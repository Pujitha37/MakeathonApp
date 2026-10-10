import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W - 80;
const CARD_H = Math.max(SCREEN_H - 270, 390);
const SNAP = CARD_W + 16;

type Profile = {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  icon: 'home' | 'pie' | 'list';
  accent: string;
  accentSoft: string;
  route: string | null;
};

// ─── Preview components ───────────────────────────────────────────────────────

function PersonalPreview({ accent, accentSoft: _accentSoft }: { accent: string; accentSoft: string }) {
  const { colors } = useTheme();
  const items = [
    { label: 'Gym 3× each week', pct: 67, a: accent },
    { label: 'Finish an AI course', pct: 62, a: colors.indigo },
  ];
  return (
    <View style={preview.wrap}>
      {items.map((it) => (
        <View key={it.label} style={preview.row}>
          <View style={[preview.dot, { backgroundColor: it.a }]} />
          <View style={preview.meta}>
            <AppText type="captionMed" style={{ fontSize: 11 }}>{it.label}</AppText>
            <View style={[preview.track, { backgroundColor: colors.line }]}>
              <View style={[preview.fill, { width: `${it.pct}%` as any, backgroundColor: it.a }]} />
            </View>
          </View>
          <AppText type="caption" muted style={{ fontSize: 10 }}>{it.pct}%</AppText>
        </View>
      ))}
    </View>
  );
}

function FinancialPreview({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  const { colors } = useTheme();
  return (
    <View style={preview.wrap}>
      <View style={preview.chipRow}>
        <View style={[preview.chip, { backgroundColor: accentSoft }]}>
          <AppText type="captionMed" style={{ fontSize: 11, color: accent }}>₹28,480 this month</AppText>
        </View>
        <View style={[preview.chip, { backgroundColor: colors.sageSoft }]}>
          <AppText type="captionMed" style={{ fontSize: 11, color: colors.sage }}>3 EMIs tracked</AppText>
        </View>
      </View>
      <View style={[preview.chip, { backgroundColor: colors.marigoldSoft, alignSelf: 'flex-start', marginTop: 6 }]}>
        <AppText type="captionMed" style={{ fontSize: 11, color: colors.marigold }}>Scam Guard active</AppText>
      </View>
    </View>
  );
}

function WorkPreview({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  const { colors } = useTheme();
  return (
    <View style={preview.wrap}>
      <View style={preview.chipRow}>
        <View style={[preview.chip, { backgroundColor: colors.marigoldSoft }]}>
          <AppText type="captionMed" style={{ fontSize: 11, color: colors.marigold }}>1 urgent email</AppText>
        </View>
        <View style={[preview.chip, { backgroundColor: accentSoft }]}>
          <AppText type="captionMed" style={{ fontSize: 11, color: accent }}>8 in digest</AppText>
        </View>
      </View>
      <View style={[preview.chip, { backgroundColor: colors.indigoSoft, alignSelf: 'flex-start', marginTop: 6 }]}>
        <AppText type="captionMed" style={{ fontSize: 11, color: colors.indigo }}>1 reply needs approval</AppText>
      </View>
      <View style={[preview.bulletRow, { marginTop: 10 }]}>
        <View style={[preview.bulletDot, { backgroundColor: accent }]} />
        <AppText type="caption" muted style={{ fontSize: 11 }}>Reminder · Standup at 2:00 PM</AppText>
      </View>
      <View style={preview.bulletRow}>
        <View style={[preview.bulletDot, { backgroundColor: colors.indigo }]} />
        <AppText type="caption" muted style={{ fontSize: 11 }}>Meeting · Sprint review · 45 min</AppText>
      </View>
    </View>
  );
}

const preview = StyleSheet.create({
  wrap: { marginTop: 16, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
  meta: { flex: 1, gap: 4 },
  track: { height: 4, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
});

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: Profile }) {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const isActive = profile.route !== null;

  return (
    <Pressable
      onPress={() => { if (isActive) router.push(profile.route as any); }}
      disabled={!isActive}
      style={({ pressed }) => [
        styles.card,
        {
          width: CARD_W,
          height: CARD_H,
          backgroundColor: colors.surface,
          borderColor: colors.line,
          opacity: pressed ? 0.88 : 1,
          ...shadow,
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: profile.accentSoft }]}>
        <Icon name={profile.icon} size={26} color={profile.accent} />
      </View>

      <AppText type="captionMed" style={{ color: profile.accent, marginTop: 18, marginBottom: 3, fontSize: 10, letterSpacing: 1.1 }}>
        {profile.subtitle.toUpperCase()}
      </AppText>
      <AppText type="titleXl" style={{ marginBottom: 8 }}>{profile.label}</AppText>
      <AppText type="label" muted style={{ lineHeight: 20 }}>{profile.description}</AppText>

      {profile.id === 'personal' && <PersonalPreview accent={profile.accent} accentSoft={profile.accentSoft} />}
      {profile.id === 'financial' && <FinancialPreview accent={profile.accent} accentSoft={profile.accentSoft} />}
      {profile.id === 'work' && <WorkPreview accent={profile.accent} accentSoft={profile.accentSoft} />}

      <View style={styles.cardFooter}>
        {isActive ? (
          <View style={[styles.ctaRow, { backgroundColor: profile.accent }]}>
            <AppText type="captionMed" style={{ color: '#fff' }}>Open {profile.label}</AppText>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="back" size={16} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={[styles.ctaRow, { backgroundColor: colors.surface2 }]}>
            <AppText type="captionMed" color={colors.ink3}>Coming soon</AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Dot indicator ────────────────────────────────────────────────────────────

function DotIndicator({ count, active }: { count: number; active: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === active ? colors.indigo : colors.line,
              width: i === active ? 20 : 7,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const [handleViewable] = useState(() => ({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });

  const PROFILES = useMemo<Profile[]>(() => [
    {
      id: 'financial',
      label: 'Financial',
      subtitle: 'Spending & savings',
      description: 'Track expenses, manage budgets, plan goals, and understand where your money goes.',
      icon: 'pie',
      accent: colors.indigo,
      accentSoft: colors.indigoSoft,
      route: '/financial',
    },
    {
      id: 'work',
      label: 'Work',
      subtitle: 'Email & meetings',
      description: 'Digest your inbox, approve reply drafts, record meeting notes, and set reminders — all on your Pi.',
      icon: 'list',
      accent: colors.marigold,
      accentSoft: colors.marigoldSoft,
      route: '/work',
    },
  ], [colors]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: colors.indigo }]}>
            <AppText type="captionMed" style={{ color: '#fff', fontSize: 14 }}>✦</AppText>
          </View>
          <AppText type="titleXl" style={{ letterSpacing: -0.5 }}>nearby</AppText>
          <AppText type="titleXl" color={colors.ink3}>.</AppText>
        </View>
        <AppText type="label" muted style={{ marginTop: 2 }}>
          Your personal AI companion
        </AppText>
      </View>

      {/* Section label */}
      <View style={styles.sectionLabel}>
        <AppText type="captionMed" muted>CHOOSE A SPACE</AppText>
        <AppText type="caption" muted>Swipe to explore · tap to open</AppText>
      </View>

      {/* Slider */}
      <FlatList
        ref={listRef}
        data={PROFILES}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled={false}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={handleViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
        renderItem={({ item }) => <ProfileCard profile={item} />}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      />

      {/* Dot indicator */}
      <DotIndicator count={PROFILES.length} active={activeIndex} />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <AppText type="caption" muted style={{ textAlign: 'center' }}>
          {PROFILES[activeIndex]?.route ? `Tap to open ${PROFILES[activeIndex].label}` : 'This space is coming soon'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listContent: { paddingHorizontal: 24 },
  card: { borderRadius: 24, borderWidth: 1, padding: 22 },
  iconTile: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { marginTop: 'auto', paddingTop: 16 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  dot: { height: 7, borderRadius: 99 },
  footer: { paddingTop: 12, paddingHorizontal: 24 },
});
