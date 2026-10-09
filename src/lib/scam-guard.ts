export type Risk = 'watch' | 'warn';
export type ConnectionState = 'disconnected' | 'checking' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ScamAlert {
  segment_id: string;
  risk: Risk;
  speaker: 'caller' | 'user' | 'unknown';
  evidence: string;
  message: string;
  source: 'rule' | 'llm' | 'rule+llm';
  revision: number;
}

export interface TranscriptSegment {
  segment_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface LastCheck {
  segment_id: string;
  outcome: 'none' | 'watch' | 'warn' | 'advice' | 'invalid';
  took_s: number;
}

export interface SnapshotEvent {
  type: 'snapshot';
  event_id: number;
  active: boolean;
  call_id: string;
  segments: TranscriptSegment[];
  alerts: ScamAlert[];
  audio_gap: boolean;
  llm_busy: boolean;
  last_check: LastCheck | null;
}

export type ScamEvent = Record<string, unknown> & {
  type: string;
  event_id?: number;
};

export interface PiHealth {
  status: 'ok' | 'degraded' | string;
  api_version?: string;
  monitoring?: boolean;
  stt_model?: string;
  rules_enabled?: boolean;
  analysis_log?: boolean;
  llm?: {
    reachable?: boolean;
    model?: string;
    mode?: string;
    detail?: string;
  };
}

export class PiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'PiApiError';
  }
}

export function normalizePiAddress(input: string): string {
  const value = input.trim();
  if (!value) throw new Error('Enter the Raspberry Pi address shown by the Scam Guard service.');

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error('Enter a valid address, for example http://192.168.1.20:8000.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('The Pi address must use http:// or https://.');
  }
  if (!parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Enter only the Pi host and port, such as http://192.168.1.20:8000.');
  }
  if (parsed.pathname !== '/') {
    throw new Error('Enter only the Pi host and port, without a path.');
  }

  return `${parsed.protocol}//${parsed.host}`;
}

export function websocketAddress(baseAddress: string): string {
  return `${baseAddress.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/events`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function requestPiJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The Raspberry Pi did not respond in time. Check the address and local Wi-Fi.');
    }
    throw new Error('Could not reach the Raspberry Pi. Check that this device is on the same private Wi-Fi.');
  } finally {
    clearTimeout(timeout);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail = isRecord(body) && typeof body.detail === 'string' ? body.detail : `Pi request failed (${response.status}).`;
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
    throw new PiApiError(detail, response.status, code);
  }
  if (!isRecord(body)) throw new Error('The Raspberry Pi returned an invalid response.');
  return body as T;
}

export function isScamAlert(value: unknown): value is ScamAlert {
  if (!isRecord(value)) return false;
  return (
    typeof value.segment_id === 'string' &&
    (value.risk === 'warn' || value.risk === 'watch') &&
    (value.speaker === 'caller' || value.speaker === 'user' || value.speaker === 'unknown') &&
    typeof value.evidence === 'string' &&
    typeof value.message === 'string' &&
    (value.source === 'rule' || value.source === 'llm' || value.source === 'rule+llm') &&
    typeof value.revision === 'number'
  );
}

export function isTranscriptSegment(value: unknown): value is TranscriptSegment {
  return (
    isRecord(value) &&
    typeof value.segment_id === 'string' &&
    typeof value.start_ms === 'number' &&
    typeof value.end_ms === 'number' &&
    typeof value.text === 'string'
  );
}

export function isSnapshotEvent(value: ScamEvent): value is ScamEvent & SnapshotEvent {
  return (
    value.type === 'snapshot' &&
    Array.isArray(value.segments) &&
    Array.isArray(value.alerts) &&
    typeof value.active === 'boolean'
  );
}
