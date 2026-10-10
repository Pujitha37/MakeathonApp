import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { workApi, type Meeting, type MeetingSummary } from '@/lib/workApi';

type RecordState = 'idle' | 'recording' | 'transcribing';

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MeetingCard({ meeting, colors }: { meeting: MeetingSummary; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const [fullMeeting, setFull]  = useState<Meeting | null>(null);
  const [loadingTx, setLoading] = useState(false);

  const toggleTranscript = async () => {
    if (!expanded && !fullMeeting) {
      setLoading(true);
      try {
        const m = await workApi.meeting(meeting.id);
        setFull(m);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    setExpanded((v) => !v);
  };

  const lines = meeting.summary.split('\n').filter(Boolean);

  return (
    <View style={[mcard.wrap, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={mcard.head}>
        <View style={{ flex: 1 }}>
          <AppText type="labelMed">{fmtDate(meeting.started_at)}</AppText>
          <AppText type="caption" muted style={{ marginTop: 2 }}>
            {fmtTime(meeting.started_at)} · {fmtDuration(meeting.duration_s)} recording
          </AppText>
        </View>
        <View style={[mcard.duration, { backgroundColor: colors.indigoSoft }]}>
          <AppText type="captionMed" style={{ fontSize: 11, color: colors.indigo }}>
            {fmtDuration(meeting.duration_s)}
          </AppText>
        </View>
      </View>
      {lines.map((line, i) => (
        <AppText key={i} type="caption" muted style={mcard.summaryLine}>
          {line}
        </AppText>
      ))}
      {/* Transcript toggle */}
      <Pressable onPress={toggleTranscript} style={mcard.txBtn}>
        {loadingTx
          ? <ActivityIndicator size="small" color={colors.indigo} />
          : <AppText type="captionMed" color={colors.indigo}>{expanded ? 'Hide transcript' : 'View transcript'}</AppText>
        }
      </Pressable>
      {expanded && fullMeeting && (
        <View style={[mcard.transcript, { backgroundColor: colors.surface2 }]}>
          {fullMeeting.transcript
            ? <AppText type="caption" muted style={{ lineHeight: 20 }}>{fullMeeting.transcript}</AppText>
            : <AppText type="caption" muted>No speech detected in this recording.</AppText>
          }
        </View>
      )}
    </View>
  );
}

const mcard = StyleSheet.create({
  wrap:       { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  head:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  duration:   { borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10, flexShrink: 0 },
  summaryLine:{ lineHeight: 19, marginBottom: 3 },
  txBtn:      { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 4 },
  transcript: { marginTop: 12, borderRadius: 14, padding: 14 },
});

export default function CallsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [meetings, setMeetings]     = useState<MeetingSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [recState, setRecState]   = useState<RecordState>('idle');
  const [elapsed, setElapsed]     = useState(0);
  const [recError, setRecError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const m = await workApi.meetings();
      setMeetings(m);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const friendlyRecError = (msg: string) => {
    if (/device/i.test(msg) || /querying/i.test(msg))
      return 'No microphone found on the Pi. Connect a USB mic and restart the Work service.';
    if (/speech.to.text|faster.whisper/i.test(msg))
      return 'Transcription not available — faster-whisper is not installed on the Pi.';
    if (/already recording/i.test(msg))
      return 'The Pi is already recording. Stop the current session first.';
    return msg;
  };

  const startRecording = async () => {
    setRecError(null);
    try {
      await workApi.startMeeting();
      setRecState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e: any) {
      setRecError(friendlyRecError(e.message ?? 'Could not start recording'));
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecState('transcribing');
    setRecError(null);
    try {
      await workApi.stopMeeting();
      await load();
    } catch (e: any) {
      setRecError(e.message);
    } finally {
      setRecState('idle');
      setElapsed(0);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="back" size={18} color={colors.ink} />
          <AppText type="captionMed">Work</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <AppText type="captionMed" color={colors.indigo} style={styles.eyebrow}>MEETING NOTES</AppText>
        <AppText type="display" style={styles.title}>Recordings</AppText>

        {/* Recording control */}
        <View style={[styles.recorder, { backgroundColor: colors.surface, borderColor: recState === 'recording' ? colors.marigold : colors.line }]}>
          {recState === 'idle' && (
            <>
              <View style={[styles.recIcon, { backgroundColor: colors.marigoldSoft }]}>
                <Icon name="mic" size={22} color={colors.marigold} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="labelMed">Start a meeting</AppText>
                <AppText type="caption" muted style={{ marginTop: 3 }}>Records from Pi mic · transcribed locally</AppText>
              </View>
              <Pressable onPress={startRecording} style={[styles.recBtn, { backgroundColor: colors.marigold }]}>
                <AppText type="captionMed" style={{ color: '#fff' }}>Start</AppText>
              </Pressable>
            </>
          )}
          {recState === 'recording' && (
            <>
              <View style={[styles.recIcon, { backgroundColor: colors.marigoldSoft }]}>
                <View style={[styles.recDot, { backgroundColor: colors.marigold }]} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="labelMed" style={{ color: colors.marigold }}>Recording…</AppText>
                <AppText type="caption" muted style={{ marginTop: 3, fontVariant: ['tabular-nums'] }}>
                  {fmtDuration(elapsed)}
                </AppText>
              </View>
              <Pressable onPress={stopRecording} style={[styles.recBtn, { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line }]}>
                <AppText type="captionMed" color={colors.ink2}>Stop</AppText>
              </Pressable>
            </>
          )}
          {recState === 'transcribing' && (
            <>
              <ActivityIndicator color={colors.indigo} style={{ marginRight: 4 }} />
              <View style={{ flex: 1 }}>
                <AppText type="labelMed">Transcribing…</AppText>
                <AppText type="caption" muted style={{ marginTop: 3 }}>This may take a minute</AppText>
              </View>
            </>
          )}
        </View>
        {recError && (
          <View style={[styles.recErrorBox, { backgroundColor: colors.marigoldSoft }]}>
            <AppText type="captionMed" color={colors.marigold}>⚠ Pi microphone unavailable</AppText>
            <AppText type="caption" muted style={{ marginTop: 4, lineHeight: 18 }}>{recError}</AppText>
          </View>
        )}

        {/* Past meetings */}
        <AppText type="titleLg" style={styles.sectionTitle}>Past meetings</AppText>

        {loading && <View style={styles.center}><ActivityIndicator color={colors.indigo} /></View>}

        {!loading && error && (
          <View style={[styles.errorBox, { backgroundColor: colors.marigoldSoft }]}>
            <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
            <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
          </View>
        )}

        {!loading && !error && meetings.length === 0 && (
          <AppText type="caption" muted>No meetings recorded yet. Tap Start to record your first one.</AppText>
        )}

        {!loading && !error && meetings.map((m) => (
          <MeetingCard key={m.id} meeting={m} colors={colors} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  topBar:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backBtn:      { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  content:      { paddingHorizontal: 24, paddingTop: 10 },
  eyebrow:      { marginBottom: 6, letterSpacing: 1 },
  title:        { marginBottom: 22, maxWidth: 280 },
  recorder:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 20, padding: 16, marginBottom: 4 },
  recIcon:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recDot:       { width: 14, height: 14, borderRadius: 7 },
  recBtn:       { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16, flexShrink: 0 },
  sectionTitle: { marginTop: 26, marginBottom: 12 },
  center:       { alignItems: 'center', paddingVertical: 24 },
  errorBox:     { borderRadius: 18, padding: 18 },
  recErrorBox:  { borderRadius: 14, padding: 14, marginTop: 10 },
});
