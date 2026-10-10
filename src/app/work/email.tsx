// Gmail-style email list: dense rows, avatar initials, hairline dividers.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { workApi, type Draft, type EmailSummary } from '@/lib/workApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#1A73E8', '#D93025', '#188038', '#F29900', '#9334E6',
  '#D01884', '#009688', '#F4511E', '#5F6368', '#1E88E5',
];

function parseSender(raw: string): { name: string; email: string } {
  // "John Doe <john@x.com>" → { name: "John Doe", email: "john@x.com" }
  const m = raw.match(/^(.+?)\s*<(.+)>$/);
  if (m) return { name: m[1].replace(/"/g, '').trim(), email: m[2].trim() };
  return { name: raw, email: raw };
}

function initial(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function fmtGmailDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}

function cleanSnippet(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function EmailScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetching, setFetching]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [emails, setEmails]         = useState<EmailSummary[]>([]);
  const [drafts, setDrafts]         = useState<Draft[]>([]);
  const [query, setQuery]           = useState('');
  const [filter, setFilter]         = useState<'all' | 'urgent' | 'normal' | 'low'>('all');
  const [expanded, setExpanded]     = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [em, dr] = await Promise.all([workApi.emails(), workApi.drafts('pending')]);
      setEmails(em);
      setDrafts(dr);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      await workApi.fetchEmails();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  const handleDraft = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await workApi.approveDraft(id);
      else await workApi.rejectDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails
      .filter((e) => filter === 'all' ? true : e.importance === filter)
      .filter((e) => !q || e.sender.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q));
  }, [emails, filter, query]);

  const urgentCount = emails.filter((e) => e.importance === 'urgent').length;
  const divider = StyleSheet.hairlineWidth;

  return (
    <View style={[styles.screen, { backgroundColor: dark ? colors.surface : '#FFFFFF', paddingTop: insets.top }]}>
      {/* Gmail-style app bar */}
      <View style={[styles.appBar, { borderBottomColor: colors.line }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText style={styles.appTitle}>Inbox</AppText>
          <AppText style={[styles.appSubtitle, { color: colors.ink3 }]}>
            {emails.length} email{emails.length === 1 ? '' : 's'}
            {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
          </AppText>
        </View>
        <Pressable
          onPress={handleFetch}
          disabled={fetching}
          hitSlop={8}
          style={[styles.fetchBtn, { backgroundColor: colors.indigoSoft }]}
        >
          {fetching
            ? <ActivityIndicator size="small" color={colors.indigo} />
            : <>
                <Icon name="chat" size={14} color={colors.indigo} />
                <AppText style={[styles.fetchText, { color: colors.indigo }]}>Fetch</AppText>
              </>
          }
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: dark ? colors.surface2 : '#F1F3F4' }]}>
        <AppText style={{ fontSize: 16 }}>🔍</AppText>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search in mail"
          placeholderTextColor={colors.ink3}
          style={[styles.searchInput, { color: colors.ink }]}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <AppText style={{ color: colors.ink3, fontSize: 18 }}>×</AppText>
          </Pressable>
        ) : null}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(['all', 'urgent', 'normal', 'low'] as const).map((f) => {
          const active = filter === f;
          const label = f === 'all' ? `All ${emails.length}`
            : f === 'urgent' ? `Urgent ${urgentCount}`
            : f === 'normal' ? 'Normal'
            : 'Low';
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? (dark ? colors.indigoSoft : '#E8F0FE') : 'transparent',
                  borderColor: active ? colors.indigo : colors.line,
                },
              ]}
            >
              <AppText style={[styles.filterText, { color: active ? colors.indigo : colors.ink2 }]}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading && (
          <View style={styles.center}><ActivityIndicator color={colors.indigo} /></View>
        )}

        {!loading && error && (
          <View style={[styles.errorBox, { backgroundColor: colors.marigoldSoft, marginHorizontal: 16, marginTop: 12 }]}>
            <AppText style={[styles.errorTitle, { color: colors.marigold }]}>Pi not reachable</AppText>
            <AppText style={[styles.errorBody, { color: colors.ink2 }]}>{error}</AppText>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Drafts awaiting approval — Gmail-style notice */}
            {drafts.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <AppText style={[styles.sectionLabel, { color: colors.ink2 }]}>
                  REPLIES AWAITING APPROVAL · {drafts.length}
                </AppText>
                {drafts.map((d) => (
                  <View key={d.id} style={[styles.draftCard, { borderColor: colors.indigoSoft, backgroundColor: dark ? colors.surface2 : '#F8F9FB' }]}>
                    <View style={styles.draftHead}>
                      <View style={[styles.draftBadge, { backgroundColor: colors.indigo }]}>
                        <AppText style={styles.draftBadgeText}>DRAFT</AppText>
                      </View>
                      <AppText style={[styles.draftReason, { color: colors.ink3 }]} numberOfLines={1}>
                        {d.reason}
                      </AppText>
                    </View>
                    <AppText style={[styles.draftSubject, { color: colors.ink }]}>{d.subject}</AppText>
                    <AppText style={[styles.draftTo, { color: colors.ink3 }]}>To {d.to_addr}</AppText>
                    <AppText style={[styles.draftBody, { color: colors.ink2 }]} numberOfLines={3}>{d.body}</AppText>
                    <View style={styles.draftActions}>
                      <Pressable onPress={() => handleDraft(d.id, 'reject')} style={styles.draftReject}>
                        <AppText style={[styles.draftRejectText, { color: colors.ink3 }]}>Reject</AppText>
                      </Pressable>
                      <Pressable onPress={() => handleDraft(d.id, 'approve')} style={[styles.draftApprove, { backgroundColor: colors.indigo }]}>
                        <AppText style={styles.draftApproveText}>Approve & send</AppText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Email list */}
            {filtered.length === 0 && (
              <View style={styles.emptyWrap}>
                <AppText style={{ fontSize: 42 }}>📭</AppText>
                <AppText style={[styles.emptyTitle, { color: colors.ink }]}>
                  {emails.length === 0 ? 'No emails yet' : 'No matches'}
                </AppText>
                <AppText style={[styles.emptyBody, { color: colors.ink3 }]}>
                  {emails.length === 0 ? 'Tap Fetch to pull your inbox from the Pi.' : 'Try a different filter or search.'}
                </AppText>
              </View>
            )}

            {filtered.map((em, idx) => {
              const { name, email } = parseSender(em.sender);
              const isUrgent = em.importance === 'urgent';
              const isLow = em.importance === 'low';
              const bg = isUrgent && !dark ? '#FFF8F6' : 'transparent';
              const isExpanded = expanded === em.id;
              return (
                <Pressable
                  key={em.id}
                  onPress={() => setExpanded(isExpanded ? null : em.id)}
                  style={({ pressed }) => [
                    styles.emailRow,
                    {
                      borderTopWidth: idx === 0 ? 0 : divider,
                      borderTopColor: colors.line,
                      backgroundColor: pressed ? (dark ? colors.surface2 : '#F6F8FA') : bg,
                    },
                  ]}
                >
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: avatarColor(email) }]}>
                    <AppText style={styles.avatarText}>{initial(name)}</AppText>
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.rowHead}>
                      <AppText style={[styles.sender, { color: colors.ink, fontWeight: isUrgent ? '700' : '600' }]} numberOfLines={1}>
                        {name}
                      </AppText>
                      <AppText style={[styles.date, { color: isUrgent ? '#D93025' : colors.ink3 }]}>
                        {fmtGmailDate(em.fetched_at)}
                      </AppText>
                    </View>
                    <AppText style={[styles.subject, { color: colors.ink, fontWeight: isUrgent ? '600' : '500', opacity: isLow ? 0.75 : 1 }]} numberOfLines={1}>
                      {em.subject}
                    </AppText>
                    <View style={styles.snippetRow}>
                      {isUrgent && (
                        <View style={[styles.urgentDot, { backgroundColor: '#D93025' }]} />
                      )}
                      <AppText
                        style={[styles.snippet, { color: colors.ink3 }]}
                        numberOfLines={isExpanded ? undefined : 1}
                      >
                        {cleanSnippet(em.summary)}
                      </AppText>
                    </View>
                    {isExpanded && (
                      <View style={[styles.metaBlock, { borderTopColor: colors.line }]}>
                        <AppText style={[styles.metaLine, { color: colors.ink3 }]}>From: {em.sender}</AppText>
                        <AppText style={[styles.metaLine, { color: colors.ink3 }]}>
                          {new Date(em.fetched_at).toLocaleString()}
                        </AppText>
                        <AppText style={[styles.metaLine, { color: colors.ink3 }]}>UID: {em.raw_uid}</AppText>
                      </View>
                    )}
                  </View>

                  {/* Importance star */}
                  <View style={styles.starWrap}>
                    <AppText style={{ fontSize: 18, color: isUrgent ? '#F4B400' : colors.ink3 + '55' }}>
                      {isUrgent ? '★' : '☆'}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // App bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  appTitle: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
  appSubtitle: { fontSize: 12, lineHeight: 16, marginTop: 1 },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    justifyContent: 'center',
  },
  fetchText: { fontSize: 13, fontWeight: '600' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Filter chips
  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: '500' },

  // Error
  errorBox: { borderRadius: 12, padding: 14 },
  errorTitle: { fontSize: 14, fontWeight: '600' },
  errorBody: { fontSize: 13, marginTop: 4 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 6,
  },

  // Drafts
  draftCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  draftHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  draftBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  draftBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.8 },
  draftReason: { fontSize: 12, flex: 1 },
  draftSubject: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  draftTo: { fontSize: 12, marginTop: 2 },
  draftBody: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  draftActions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end' },
  draftReject: { paddingHorizontal: 14, paddingVertical: 8 },
  draftRejectText: { fontSize: 13, fontWeight: '600' },
  draftApprove: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  draftApproveText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Email row (Gmail list)
  emailRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sender: { flex: 1, fontSize: 14, lineHeight: 18 },
  date: { fontSize: 12, fontWeight: '500' },
  subject: { fontSize: 14, lineHeight: 18, marginBottom: 2 },
  snippetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  urgentDot: { width: 6, height: 6, borderRadius: 3 },
  snippet: { flex: 1, fontSize: 13, lineHeight: 18 },

  metaBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  metaLine: { fontSize: 11, lineHeight: 15 },

  starWrap: { paddingTop: 4 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginTop: 12 },
  emptyBody: { fontSize: 13, marginTop: 4, textAlign: 'center' },

  center: { alignItems: 'center', paddingVertical: 48 },
});
