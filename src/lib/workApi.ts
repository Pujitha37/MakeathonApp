// Update PI_BASE to your Raspberry Pi's local IP address.
export const PI_BASE = 'http://10.94.221.88:8001';

// ─── Response types (match API spec exactly) ─────────────────────────────────

export type Importance  = 'low' | 'normal' | 'urgent';
export type DraftAction = 'reply' | 'notify';
export type DraftStatus = 'pending' | 'approved' | 'rejected' | 'sent';

export interface HealthResponse {
  status: string;
  reminders_pending: number;
  emails_stored: number;
}

export interface EmailSummary {
  id: number;
  sender: string;
  subject: string;
  summary: string;
  importance: Importance;
  raw_uid: string;
  fetched_at: string;
}

export interface Draft {
  id: number;
  source_email_uid: string;
  action: DraftAction;
  to_addr: string;
  subject: string;
  body: string;
  reason: string;
  needs_approval: 0 | 1;
  status: DraftStatus;
  created_at: string;
  decided_at: string | null;
}

export interface Reminder {
  id: number;
  message: string;
  fires_at: string;
  fired: 0 | 1;
  created_at: string;
}

export interface MeetingSummary {
  id: number;
  started_at: string;
  ended_at: string;
  duration_s: number;
  summary: string;
  created_at: string;
}

export interface Meeting extends MeetingSummary {
  transcript: string;
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${PI_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const workApi = {
  health:       () => req<HealthResponse>('/health'),

  emails:       () => req<EmailSummary[]>('/emails'),
  fetchEmails:  () => req<{ status: string; total_stored: number }>('/emails/fetch', { method: 'POST' }),

  drafts:       (status?: DraftStatus) =>
                  req<Draft[]>(status ? `/drafts?status=${status}` : '/drafts'),
  approveDraft: (id: number) =>
                  req<{ status: string; id: number }>(`/drafts/${id}/approve`, { method: 'POST' }),
  rejectDraft:  (id: number) =>
                  req<{ status: string; id: number }>(`/drafts/${id}/reject`, { method: 'POST' }),

  reminders:    () => req<Reminder[]>('/reminders'),
  addReminder:  (message: string, delay_s: number) =>
                  req<{ status: string; message: string }>('/remind', {
                    method: 'POST',
                    body: JSON.stringify({ message, delay_s }),
                  }),

  meetings:     () => req<MeetingSummary[]>('/meetings'),
  meeting:      (id: number) => req<Meeting>(`/meetings/${id}`),
  startMeeting: () => req<{ status: string; started_at: string }>('/meetings/start', { method: 'POST' }),
  stopMeeting:  () => req<Meeting>('/meetings/stop', { method: 'POST' }),
};
