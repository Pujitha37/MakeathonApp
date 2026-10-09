import React, { useRef, useState } from 'react';
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

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;

type Profile = {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  icon: 'home' | 'pie' | 'list';
  accent: keyof ReturnType<typeof useTheme>['colors'];
  accentSoft: keyof ReturnType<typeof useTheme>['colors'];
  route: string | null;
};

const PROFILES: Profile[] = [
  {
    id: 'personal',
    label: 'Personal',
    subtitle: 'Goals & habits',
    description: 'Track personal goals, build daily habits, and stay on top of what matters to you.',
    icon: 'home',
    accent: 'sage',
    accentSoft: 'sageSoft',
    route: null,
  },
  {
    id: 'financial',
    label: 'Financial',
    subtitle: 'Spending & savings',
    description: 'Track expenses, manage budgets, plan goals, and understand where your money goes.',
    icon: 'pie',
    accent: 'indigo',
    accentSoft: 'indigoSoft',
    route: '/financial',
  },
  {
    id: 'work',
    label: 'Work',
    subtitle: 'Tasks & focus',
    description: 'Manage action items, summarise meetings, and stay ahead of your commitments.',
    icon: 'list',
    accent: 'marigold',
    accentSoft: 'marigoldSoft',
    route: null,
  },
];

function ProfileCard({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const { colors } = useTheme();
  const accent = colors[profile.accent as keyof typeof colors] as string;
  const accentSoft = colors[profile.accentSoft as keyof typeof colors] as string;
  const isActive = profile.route !== null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isActive}
      style={({ pressed }) => [
        styles.card,
        {
          width: CARD_W,
          backgroundColor: colors.surface,
          borderColor: colors.line,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Icon tile */}
      <View style={[styles.iconTile, { backgroundColor: accentSoft }]}>
        <Icon name={profile.icon} size={26} color={accent} />
      </View>

      {/* Text */}
      <AppText type="captionMed" style={{ color: accent, marginTop: 20, marginBottom: 4 }}>
        {profile.subtitle.toUpperCase()}
      </AppText>
      <AppText type="titleXl" style={{ marginBottom: 10 }}>
        {profile.label}
      </AppText>
      <AppText type="label" muted style={{ lineHeight: 20 }}>
        {profile.description}
      </AppText>

      {/* CTA */}
      <View style={styles.cardFooter}>
        {isActive ? (
          <View style={[styles.ctaRow, { backgroundColor: accent }]}>
            <AppText type="captionMed" style={{ color: '#fff' }}>
              Open {profile.label}
            </AppText>
            <Icon name="back" size={16} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
          </View>
        ) : (
          <View style={[styles.ctaRow, { backgroundColor: colors.surface2 }]}>
            <AppText type="captionMed" color={colors.ink3}>
              Coming soon
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

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

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(1); // start on Financial
  const listRef = useRef<FlatList>(null);

  const handleViewable = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }).current;

  const handlePress = (profile: Profile) => {
    if (!profile.route) return;
    router.push(profile.route as any);
  };

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
        <AppText type="label" muted style={{ marginTop: 4 }}>
          Your personal AI companion
        </AppText>
      </View>

      {/* Section label */}
      <View style={styles.sectionLabel}>
        <AppText type="captionMed" muted>CHOOSE A SPACE</AppText>
      </View>

      {/* Slider */}
      <FlatList
        ref={listRef}
        data={PROFILES}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_W + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={handleViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        initialScrollIndex={1}
        getItemLayout={(_, index) => ({ length: CARD_W + 16, offset: (CARD_W + 16) * index, index })}
        renderItem={({ item }) => (
          <ProfileCard profile={item} onPress={() => handlePress(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      />

      {/* Dot indicator */}
      <DotIndicator count={PROFILES.length} active={activeIndex} />

      {/* Footer hint */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <AppText type="caption" muted style={{ textAlign: 'center' }}>
          Swipe to explore profiles · tap to open
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    minHeight: 320,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  dot: {
    height: 7,
    borderRadius: 99,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
});
