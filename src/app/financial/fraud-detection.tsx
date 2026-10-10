import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, Vibration } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';
import { Mascot } from '@/components/Mascot';
import { useTheme } from '@/theme/ThemeProvider';
import {
  isRecord,
  isScamAlert,
  isSnapshotEvent,
  isTranscriptSegment,
  PiApiError,
  requestPiJson,
  websocketAddress,
  type ConnectionState,
  type LastCheck,
  type PiHealth,
  type ScamAlert,
  type ScamEvent,
  type TranscriptSegment,
} from '@/lib/scam-guard';

const CONNECT_TIMEOUT_MS = 10_000;
const KEEP_ALIVE_MS = 15_000;
const MAX_RECONNECT_MS = 15_000;

// Hardcoded Pi address — tap the bot to connect.
const PI_URL = 'http://10.94.221.88:8000';

function eventFromMessage(data: unknown): ScamEvent | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) && typeof parsed.type === 'string' ? (parsed as ScamEvent) : null;
  } catch {
    return null;
  }
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function speakerLabel(speaker: ScamAlert['speaker']): string {
  if (speaker === 'caller') return 'Likely the caller';
  if (speaker === 'user') return 'Likely you';
  return 'Speaker unclear';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected connection error occurred.';
}

export default function FraudDetectionScreen() {
  const { colors, dark } = useTheme();
  const [baseAddress, setBaseAddress] = useState('');
  const [connection, setConnection] = useState<ConnectionState>('disconnected');
  const [health, setHealth] = useState<PiHealth | null>(null);
  const [active, setActive] = useState(false);
  const [callId, setCallId] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [audioGap, setAudioGap] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastCheck, setLastCheck] = useState<LastCheck | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectCountRef = useRef(0);
  const lastEventIdRef = useRef(0);
  const wantedRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(true);
  const urlRef = useRef('');
  const snapshotResolverRef = useRef<((error?: Error) => void) | null>(null);
  const handleEventRef = useRef<(event: ScamEvent) => void>(() => undefined);
  const openSocketRef = useRef<(base: string) => Promise<void>>(async () => undefined);
  const reconnectRef = useRef<() => void>(() => undefined);

  const clearSocketTimers = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    reconnectTimerRef.current = null;
    pingTimerRef.current = null;
  }, []);

  const applyEvent = useCallback((event: ScamEvent) => {
    if (isSnapshotEvent(event)) {
      const wasActive = activeRef.current;
      lastEventIdRef.current = 0;
      activeRef.current = event.active;
      setActive(event.active);
      setCallId(typeof event.call_id === 'string' ? event.call_id : '');
      setSegments(event.segments.filter(isTranscriptSegment));
      setAlerts(event.alerts.filter(isScamAlert));
      setAudioGap(event.audio_gap === true);
      setProcessing(event.llm_busy === true);
      setLastCheck(isRecord(event.last_check) ? (event.last_check as LastCheck) : null);
      setConnection('connected');
      setError('');
      setNotice(
        wasActive && !event.active
          ? 'Monitoring ended while the app was disconnected.'
          : wasActive
            ? "Reconnected. The Pi's current transcript and warnings have been restored."
            : '',
      );
      snapshotResolverRef.current?.();
      snapshotResolverRef.current = null;
      return;
    }

    if (typeof event.event_id === 'number') {
      if (event.event_id <= lastEventIdRef.current) return;
      lastEventIdRef.current = event.event_id;
    }

    switch (event.type) {
      case 'listening':
        activeRef.current = true;
        setActive(true);
        setCallId(typeof event.call_id === 'string' ? event.call_id : '');
        setSegments([]);
        setAlerts([]);
        setLastCheck(null);
        setAudioGap(false);
        setNotice(typeof event.message === 'string' ? event.message : 'Monitoring started.');
        break;
      case 'transcript': {
        if (!isTranscriptSegment(event)) break;
        setSegments((current) => [...current, event]);
        break;
      }
      case 'warning': {
        if (!isScamAlert(event)) break;
        setAlerts((current) => {
          const existing = current.find((alert) => alert.segment_id === event.segment_id);
          if (existing && event.revision <= existing.revision) return current;
          return existing
            ? current.map((alert) => (alert.segment_id === event.segment_id ? event : alert))
            : [...current, event];
        });
        if (event.vibrate === true) Vibration.vibrate([400, 150, 400]);
        break;
      }
      case 'processing':
        setProcessing(event.active === true);
        if (typeof event.message === 'string' && event.message) setNotice(event.message);
        break;
      case 'checked':
        if (typeof event.segment_id === 'string' && typeof event.outcome === 'string') {
          setLastCheck({
            segment_id: event.segment_id,
            outcome: event.outcome as LastCheck['outcome'],
            took_s: typeof event.took_s === 'number' ? event.took_s : 0,
          });
        }
        break;
      case 'error':
        if (event.code === 'no_audio') {
          setAudioGap(true);
          setNotice('Microphone is silent — monitoring may be incomplete.');
        } else if (event.code === 'stt_failed') {
          setNotice('Speech recognition may have missed some speech.');
        } else if (typeof event.message === 'string') {
          setNotice(event.message);
        }
        break;
      case 'info':
        if (typeof event.message === 'string') {
          if (event.message.toLowerCase().includes('audio resumed')) setAudioGap(false);
          setNotice(event.message);
        }
        break;
      case 'stopped':
        activeRef.current = false;
        setActive(false);
        setProcessing(false);
        setNotice(
          event.reason === 'connection_lost'
            ? 'Monitoring ended while the app was disconnected.'
            : typeof event.message === 'string'
              ? event.message
              : 'Monitoring stopped.',
        );
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    handleEventRef.current = applyEvent;
  }, [applyEvent]);

  const openSocket = useCallback(
    (base: string) =>
      new Promise<void>((resolve, reject) => {
        let settled = false;
        let socket: WebSocket | null = null;
        const finish = (failure?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(snapshotTimeout);
          if (snapshotResolverRef.current === finish) snapshotResolverRef.current = null;
          if (failure) {
            if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
            reject(failure);
          } else resolve();
        };
        const snapshotTimeout = setTimeout(
          () => finish(new Error('Connected to the Pi, but no initial status snapshot arrived.')),
          CONNECT_TIMEOUT_MS,
        );

        try {
          socket = new WebSocket(websocketAddress(base));
        } catch (openError) {
          finish(new Error(errorMessage(openError)));
          return;
        }
        socketRef.current = socket;
        snapshotResolverRef.current = finish;
        setConnection('connecting');

        socket.onopen = () => {
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          pingTimerRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) socket.send('ping');
          }, KEEP_ALIVE_MS);
        };
        socket.onmessage = ({ data }) => {
          const event = eventFromMessage(data);
          if (!event) return;
          handleEventRef.current(event);
          if (event.type === 'snapshot') {
            reconnectCountRef.current = 0;
            finish();
          }
        };
        socket.onerror = () => {
          if (!settled) finish(new Error('Could not open the Pi event stream. Check its address and Wi-Fi.'));
        };
        socket.onclose = () => {
          if (!settled) finish(new Error('The Pi closed the event stream before sending its status.'));
          const isCurrentSocket = socketRef.current === socket;
          if (isCurrentSocket) socketRef.current = null;
          if (isCurrentSocket && wantedRef.current) reconnectRef.current();
        };
      }),
    [],
  );

  useEffect(() => {
    openSocketRef.current = openSocket;
    reconnectRef.current = () => {
      if (!wantedRef.current) return;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      setConnection('reconnecting');
      const baseDelay = Math.min(1000 * 2 ** reconnectCountRef.current, MAX_RECONNECT_MS);
      const jitter = Math.floor(Math.random() * 500);
      reconnectCountRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        if (!wantedRef.current) return;
        void requestPiJson<PiHealth>(`${urlRef.current}/health`)
          .then(setHealth)
          .catch(() => {
            if (mountedRef.current) setNotice('Could not reach the Pi. Reconnecting; monitoring may be incomplete.');
          })
          .finally(() => {
            if (wantedRef.current) {
              void openSocketRef.current(urlRef.current).catch((reconnectError) => {
                if (mountedRef.current) {
                  setError(errorMessage(reconnectError));
                  setConnection('reconnecting');
                }
                if (wantedRef.current) reconnectRef.current();
              });
            }
          });
      }, baseDelay + jitter);
    };
  }, [openSocket]);

  const disconnect = useCallback(
    (showMessage = true) => {
      wantedRef.current = false;
      clearSocketTimers();
      snapshotResolverRef.current?.(new Error('Connection cancelled.'));
      snapshotResolverRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
      setConnection('disconnected');
      if (showMessage) setNotice('Disconnected from Scam Guard.');
    },
    [clearSocketTimers],
  );

  useEffect(
    () => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        if (activeRef.current && urlRef.current) {
          void requestPiJson(`${urlRef.current}/stop`, { method: 'POST' }).catch((stopError) => {
            console.warn('Unable to stop Scam Guard after leaving the screen:', stopError);
          });
        }
        wantedRef.current = false;
        clearSocketTimers();
        snapshotResolverRef.current?.(new Error('Screen closed.'));
        socketRef.current?.close();
      };
    },
    [clearSocketTimers],
  );

  const connect = async () => {
    if (activeRef.current) {
      setError('Stop the active call before reconnecting or changing the Pi address.');
      return;
    }
    if (Platform.OS === 'web') {
      setError('The Pi API does not allow browser cross-origin requests. Connect using the iOS or Android app.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    disconnect(false);
    try {
      const base = PI_URL;
      setBaseAddress(base);
      urlRef.current = base;
      setConnection('checking');
      const piHealth = await requestPiJson<PiHealth>(`${base}/health`);
      setHealth(piHealth);
      setConnection('connecting');
      wantedRef.current = true;
      await openSocket(base);
      setConnection('connected');
    } catch (connectionError) {
      wantedRef.current = false;
      clearSocketTimers();
      socketRef.current?.close();
      socketRef.current = null;
      if (mountedRef.current) {
        setConnection('error');
        setError(errorMessage(connectionError));
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const startMonitoring = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await requestPiJson<{ ok: boolean; call_id: string }>(`${baseAddress}/start`, { method: 'POST' });
      activeRef.current = true;
      setActive(true);
      setCallId(result.call_id);
      setNotice('Monitoring started. Keep this app open while the call is on speaker.');
    } catch (startError) {
      if (startError instanceof PiApiError && startError.status === 409 && startError.code === 'already_monitoring') {
        setNotice('A call is already being monitored. The live status is shown below.');
      } else {
        setError(errorMessage(startError));
      }
    } finally {
      setBusy(false);
    }
  };

  const stopMonitoring = async () => {
    setBusy(true);
    setError('');
    try {
      await requestPiJson<{ ok: boolean; was_active: boolean }>(`${baseAddress}/stop`, { method: 'POST' });
      activeRef.current = false;
      setActive(false);
      setProcessing(false);
      setNotice('Monitoring stopped. The transcript and warnings remain available below.');
    } catch (stopError) {
      setError(errorMessage(stopError));
    } finally {
      setBusy(false);
    }
  };

  const connectionLabel: Record<ConnectionState, string> = {
    disconnected: 'Not connected',
    checking: 'Checking Pi',
    connecting: 'Connecting',
    connected: 'Connected',
    reconnecting: 'Connection lost · reconnecting',
    error: 'Connection error',
  };
  const healthTone = health?.status === 'ok' ? 'ok' : health?.status === 'degraded' ? 'warn' : 'bad';

  return (
    <Screen title="Fraud detection" screen="fraud" showBack showScopeBar={false}>
      <Card style={{ paddingBottom: 18 }}>
        <View style={styles.cardHeading}>
          <View style={[styles.shield, { backgroundColor: colors.indigoSoft }]}>
            <AppText style={{ fontSize: 25 }}>🛡️</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText type="h3">Scam Guard</AppText>
            <AppText type="caption" muted>
              Live call analysis on your Raspberry Pi
            </AppText>
          </View>
          <StatusChip
            tone={connection === 'connected' ? 'ok' : connection === 'reconnecting' ? 'warn' : 'info'}
            label={connectionLabel[connection]}
          />
        </View>
        <AppText type="label" muted style={{ marginTop: 12 }}>
          Put the call on speaker and keep this screen open. The Pi listens and runs the speech/model analysis; this app
          displays its transcript and warnings. Call audio is not sent to the app or cloud.
        </AppText>
        <AppText type="captionSm" muted style={{ marginTop: 8 }}>
          Background monitoring is not included: Android may stop an idle socket, and iOS suspends network activity
          when the app is backgrounded. The Pi API does not provide push notifications.
        </AppText>
      </Card>

      <Card>
        <AppText type="h3" style={{ marginBottom: 4 }}>
          Connect to your Pi
        </AppText>
        <AppText type="caption" muted style={{ marginBottom: 14 }}>
          Tap the bot to open a live link with the Pi at {PI_URL.replace(/^https?:\/\//, '')}. Both devices must share the
          same private Wi-Fi or hotspot.
        </AppText>

        <Pressable
          accessibilityLabel="Connect to the Pi"
          accessibilityRole="button"
          disabled={busy || active || connection === 'connected'}
          onPress={() => void connect()}
          style={({ pressed }) => [
            styles.botTap,
            {
              backgroundColor:
                connection === 'connected'
                  ? colors.sageSoft
                  : connection === 'error'
                    ? colors.coralSoft
                    : connection === 'reconnecting'
                      ? colors.marigoldSoft
                      : colors.indigoSoft,
              borderColor:
                connection === 'connected'
                  ? colors.sage
                  : connection === 'error'
                    ? colors.coral
                    : connection === 'reconnecting'
                      ? colors.marigold
                      : colors.indigo,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.botMascot}>
            <Mascot size={78} />
            {(busy || connection === 'checking' || connection === 'connecting' || connection === 'reconnecting') && (
              <View style={styles.botSpinner}>
                <ActivityIndicator color={colors.indigo} />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <AppText type="h3" style={{ fontSize: 16 }}>
              {connection === 'connected'
                ? 'Linked with the Pi'
                : connection === 'checking'
                  ? 'Checking Pi…'
                  : connection === 'connecting' || busy
                    ? 'Opening live link…'
                    : connection === 'reconnecting'
                      ? 'Reconnecting…'
                      : connection === 'error'
                        ? 'Tap the bot to retry'
                        : 'Tap the bot to connect'}
            </AppText>
            <AppText type="captionSm" muted style={{ marginTop: 2 }}>
              {connection === 'connected'
                ? 'Streaming transcript and warnings live.'
                : `Pi · ${PI_URL.replace(/^https?:\/\//, '')}`}
            </AppText>
          </View>
          <StatusChip
            tone={connection === 'connected' ? 'ok' : connection === 'reconnecting' ? 'warn' : connection === 'error' ? 'bad' : 'info'}
            label={connectionLabel[connection]}
          />
        </Pressable>

        {connection !== 'disconnected' && !active && (
          <View style={styles.buttonRow}>
            <Button label="Disconnect" disabled={busy} onPress={() => disconnect()} />
          </View>
        )}

        {health && connection !== 'disconnected' && (
          <View style={[styles.healthRow, { backgroundColor: colors.surface2 }]}>
            <View style={{ flex: 1 }}>
              <AppText type="labelMed">
                {health.status === 'ok'
                  ? 'Pi connected'
                  : health.status === 'degraded'
                    ? 'Model unavailable'
                    : 'Pi status'}
              </AppText>
              <AppText type="captionSm" muted>
                {health.status === 'degraded'
                  ? 'Pattern-based warnings may still work; model analysis is unavailable.'
                  : `Rules ${health.rules_enabled === false ? 'off' : 'on'}${health.stt_model ? ` · speech model ${health.stt_model}` : ''}`}
              </AppText>
            </View>
            <StatusChip tone={healthTone} label={health.status === 'ok' ? 'Ready' : health.status} />
          </View>
        )}
      </Card>

      {connection === 'connected' && (
        <Card>
          <View style={styles.statusLine}>
            <View style={{ flex: 1 }}>
              <AppText type="h3">{active ? 'Call monitoring is on' : 'Ready to monitor'}</AppText>
              {callId ? <AppText type="captionSm" muted>Call {callId}</AppText> : null}
            </View>
            {processing && <StatusChip tone="info" label="Analyzing on Pi…" />}
          </View>
          <View style={styles.buttonRow}>
            {active ? (
              <Button label={busy ? 'Stopping…' : 'Stop monitoring'} variant="soft" disabled={busy} onPress={() => void stopMonitoring()} />
            ) : (
              <Button label={busy ? 'Starting…' : 'Start monitoring'} variant="primary" disabled={busy} onPress={() => void startMonitoring()} />
            )}
          </View>
          {!active && (
            <AppText type="captionSm" muted style={{ marginTop: 8 }}>
              Start monitoring only after the other person is on speaker near the Pi microphone.
            </AppText>
          )}
        </Card>
      )}

      {connection === 'reconnecting' && (
        <NoticeCard tone="warn" message="Connection lost. Trying to reconnect; monitoring may stop if the app cannot reconnect within 60 seconds." />
      )}
      {notice ? <NoticeCard tone="info" message={notice} /> : null}
      {error ? <NoticeCard tone="bad" message={error} /> : null}
      {audioGap && <NoticeCard tone="bad" message="Microphone is silent — monitoring may be incomplete." />}
      {health?.status === 'degraded' && (
        <NoticeCard tone="warn" message="The Pi reports that its model is unavailable. Rule-based warnings may still be active." />
      )}
      {Platform.OS === 'ios' && active && (
        <NoticeCard tone="warn" message="iOS may pause network activity when this app goes to the background. Keep Scam Guard open during the call." />
      )}

      {connection === 'connected' && (
        <Card>
          <View style={styles.statusLine}>
            <AppText type="h3">Call warnings</AppText>
            <StatusChip tone={alerts.some((alert) => alert.risk === 'warn') ? 'bad' : 'info'} label={`${alerts.length} alert${alerts.length === 1 ? '' : 's'}`} />
          </View>
          {alerts.length ? (
            alerts
              .slice()
              .reverse()
              .map((alert) => (
                <View
                  key={alert.segment_id}
                  style={[
                    styles.alertCard,
                    {
                      backgroundColor: alert.risk === 'warn' ? colors.coralSoft : colors.marigoldSoft,
                      borderColor: alert.risk === 'warn' ? colors.coral : colors.marigold,
                    },
                  ]}
                >
                  <View style={styles.alertHeading}>
                    <AppText style={{ fontSize: 23 }}>{alert.risk === 'warn' ? '⚠️' : '👀'}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText type="h3" color={alert.risk === 'warn' ? colors.coral : dark ? colors.marigold : '#9A6200'}>
                        {alert.risk === 'warn' ? 'Possible scam request' : 'Be careful'}
                      </AppText>
                      <AppText type="captionSm" muted>
                        {speakerLabel(alert.speaker)} · {alert.source} · update {alert.revision}
                      </AppText>
                    </View>
                  </View>
                  <AppText type="labelMed" style={{ marginTop: 10 }}>
                    “{alert.evidence}”
                  </AppText>
                  <AppText type="label" style={{ marginTop: 6 }}>
                    {alert.message}
                  </AppText>
                </View>
              ))
          ) : (
            <AppText type="label" muted style={{ marginTop: 8 }}>
              {active ? 'No warnings so far. This is not proof that the call is safe.' : 'No warnings recorded for this call.'}
            </AppText>
          )}
        </Card>
      )}

      {connection === 'connected' && (
        <Card>
          <View style={styles.statusLine}>
            <AppText type="h3">Live transcript</AppText>
            {lastCheck && (
              <StatusChip
                tone={lastCheck.outcome === 'warn' ? 'bad' : lastCheck.outcome === 'watch' ? 'warn' : 'info'}
                label={`${lastCheck.outcome === 'none' ? 'Reviewed' : lastCheck.outcome} ${lastCheck.segment_id} · ${lastCheck.took_s.toFixed(1)}s`}
              />
            )}
          </View>
          {segments.length ? (
            segments.map((segment) => (
              <View key={segment.segment_id} style={[styles.transcriptRow, { borderTopColor: colors.line }]}>
                <AppText type="captionSm" muted style={{ width: 42 }}>
                  {formatElapsed(segment.start_ms)}
                </AppText>
                <AppText type="label" style={{ flex: 1 }}>
                  {segment.text}
                </AppText>
              </View>
            ))
          ) : (
            <AppText type="label" muted style={{ marginTop: 8 }}>
              {active ? 'Waiting for speech from the Pi…' : 'The call transcript will appear here when monitoring starts.'}
            </AppText>
          )}
        </Card>
      )}

      <Card flat style={{ marginTop: 2 }}>
        <AppText type="captionSm" muted>
          Scam Guard can mishear speech, and no warning does not mean a call is safe. Never share an OTP, PIN, password,
          or card details over an unsolicited call. This local Pi API has no authentication or encryption; use it only
          on a trusted private network.
        </AppText>
      </Card>
    </Screen>
  );
}

function NoticeCard({ tone, message }: { tone: 'warn' | 'bad' | 'info'; message: string }) {
  const { colors } = useTheme();
  const background = tone === 'bad' ? colors.coralSoft : tone === 'warn' ? colors.marigoldSoft : colors.indigoSoft;
  const foreground = tone === 'bad' ? colors.coral : tone === 'warn' ? colors.marigold : colors.indigo;
  return (
    <Card flat style={[styles.notice, { backgroundColor: background }]}>
      <AppText type="labelMed" color={foreground}>{message}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shield: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  botTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
  },
  botMascot: { width: 78, height: 82, alignItems: 'center', justifyContent: 'center' },
  botSpinner: { position: 'absolute', bottom: -2, right: -2 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, marginTop: 12 },
  statusLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  alertCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  alertHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transcriptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  notice: { padding: 13 },
});
