import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { workApi, type HealthResponse, type MeetingSummary, type Reminder } from '@/lib/workApi';

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtDuration(s: number) {
  const m = Math.round(s / 60);
  return m < 1 ? `${Math.round(s)}s` : `${m} min`;
}

export default function WorkHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [health, setHealth]         = useState<HealthResponse | null>(null);
  const [pendingDrafts, setPending] = useState(0);
  const [reminders, setReminders]   = useState<Reminder[]>([]);
  const [recentMeeting, setRecent]  = useState<MeetingSummary | null>(null);

  const [reminderText, setReminderText] = useState('');
  const [addingReminder, setAdding]     = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [h, drafts, rems, meets] = await Promise.all([
        workApi.health(),
        workApi.drafts('pending'),
        workApi.reminders(),
        workApi.meetings(),
      ]);
      setHealth(h);
      setPending(drafts.length);
      setReminders(rems);
      setRecent(meets[0] ?? null);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleAddReminder = async () => {
    if (!reminderText.trim()) return;
    setAdding(true);
    try {
      await workApi.addReminder(reminderText.trim(), 3600); // 1 h default
      setReminderText('');
      await load();
    } catch {
      // silently ignore — offline
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Icon name="back" size={18} color={colors.ink} />
          <AppText type="captionMed">Profiles</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Hero */}
        <View style={[styles.heroIcon, { backgroundColor: colors.marigoldSoft }]}>
          <Icon name="list" size={28} color={colors.marigold} />
        </View>
        <AppText type="captionMed" color={colors.marigold} style={styles.eyebrow}>WORKSPACE</AppText>
        <AppText type="display" style={styles.title}>Work, made clearer.</AppText>

        {/* Loading / error */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.marigold} />
            <AppText type="caption" muted style={{ marginTop: 8 }}>Connecting to Pi…</AppText>
          </View>
        )}

        {!loading && error && (
          <View style={[styles.errorBox, { backgroundColor: colors.marigoldSoft }]}>
            <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
            <AppText type="caption" muted style={{ marginTop: 4, lineHeight: 18 }}>{error}</AppText>
            <Pressable onPress={refresh} style={[styles.retryBtn, { borderColor: colors.marigold }]}>
              <AppText type="captionMed" color={colors.marigold}>Try again</AppText>
            </Pressable>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Stats strip */}
            {health && (
              <View style={[styles.statsStrip, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                <View style={styles.stat}>
                  <AppText type="titleLg" style={{ color: colors.marigold }}>{health.emails_stored}</AppText>
                  <AppText type="caption" muted>emails</AppText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
                <View style={styles.stat}>
                  <AppText type="titleLg" style={{ color: pendingDrafts > 0 ? colors.marigold : colors.ink }}>{pendingDrafts}</AppText>
                  <AppText type="caption" muted>drafts pending</AppText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
                <View style={styles.stat}>
                  <AppText type="titleLg" style={{ color: health.reminders_pending > 0 ? colors.indigo : colors.ink }}>{health.reminders_pending}</AppText>
                  <AppText type="caption" muted>reminders</AppText>
                </View>
              </View>
            )}

            {/* Email card */}
            <AppText type="titleLg" style={styles.sectionTitle}>Email digest</AppText>
            <Pressable
              onPress={() => router.push('/work/email' as any)}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.88 : 1 }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.marigoldSoft }]}>
                <Icon name="chat" size={22} color={colors.marigold} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="labelMed">
                  {health ? `${health.emails_stored} emails stored` : 'Email digest'}
                </AppText>
                {pendingDrafts > 0 ? (
                  <AppText type="caption" style={{ color: colors.marigold, marginTop: 3 }}>
                    {pendingDrafts} repl{pendingDrafts === 1 ? 'y' : 'ies'} need your approval
                  </AppText>
                ) : (
                  <AppText type="caption" muted style={{ marginTop: 3 }}>No pending approvals</AppText>
                )}
              </View>
              <Icon name="back" size={16} color={colors.ink3} />
            </Pressable>

            {/* Meeting notes card */}
            <AppText type="titleLg" style={styles.sectionTitle}>Meeting notes</AppText>
            <Pressable
              onPress={() => router.push('/work/calls' as any)}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.88 : 1 }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.indigoSoft }]}>
                <Icon name="mic" size={22} color={colors.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                {recentMeeting ? (
                  <>
                    <AppText type="labelMed" numberOfLines={1}>{fmtDate(recentMeeting.started_at)}</AppText>
                    <AppText type="caption" muted style={{ marginTop: 3 }} numberOfLines={1}>
                      {fmtDuration(recentMeeting.duration_s)} · {recentMeeting.summary.split('\n')[0]}
                    </AppText>
                  </>
                ) : (
                  <>
                    <AppText type="labelMed">Record a meeting</AppText>
                    <AppText type="caption" muted style={{ marginTop: 3 }}>No meetings yet</AppText>
                  </>
                )}
              </View>
              <Icon name="back" size={16} color={colors.ink3} />
            </Pressable>

            {/* Reminders */}
            <AppText type="titleLg" style={styles.sectionTitle}>Reminders</AppText>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {reminders.length === 0 ? (
                <AppText type="caption" muted>No upcoming reminders</AppText>
              ) : (
                reminders.map((r) => (
                  <View key={r.id} style={[styles.reminderRow, { borderBottomColor: colors.line }]}>
                    <View style={[styles.reminderDot, { backgroundColor: colors.indigo }]} />
                    <View style={{ flex: 1 }}>
                      <AppText type="label">{r.message}</AppText>
                      <AppText type="caption" muted style={{ marginTop: 2 }}>
                        {fmtDate(r.fires_at)} at {fmtTime(r.fires_at)}
                      </AppText>
                    </View>
                  </View>
                ))
              )}
              {/* Add reminder inline */}
              <View style={[styles.addRow, { borderTopColor: colors.line, borderTopWidth: reminders.length > 0 ? StyleSheet.hairlineWidth : 0, marginTop: reminders.length > 0 ? 8 : 0 }]}>
                <TextInput
                  style={[styles.reminderInput, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 }]}
                  placeholder="New reminder…"
                  placeholderTextColor={colors.ink3}
                  value={reminderText}
                  onChangeText={setReminderText}
                  onSubmitEditing={handleAddReminder}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={handleAddReminder}
                  disabled={addingReminder || !reminderText.trim()}
                  style={[styles.addBtn, { backgroundColor: reminderText.trim() ? colors.indigo : colors.surface2 }]}
                >
                  {addingReminder
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <AppText type="captionMed" style={{ color: reminderText.trim() ? '#fff' : colors.ink3 }}>Set</AppText>
                  }
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  topBar:  { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  heroIcon:   { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  eyebrow:    { marginTop: 22, marginBottom: 6, letterSpacing: 1 },
  title:      { marginBottom: 20, maxWidth: 280 },
  center:     { alignItems: 'center', paddingVertical: 32 },
  errorBox:   { borderRadius: 18, padding: 18, marginBottom: 8 },
  retryBtn:   { alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  statsStrip: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, paddingVertical: 16, marginBottom: 6 },
  stat:       { flex: 1, alignItems: 'center' },
  statDivider:{ width: 1, marginVertical: 4 },
  sectionTitle: { marginTop: 22, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 4 },
  cardIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reminderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  reminderDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  addRow: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  reminderInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 },
  addBtn: { borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', minWidth: 52 },
});
