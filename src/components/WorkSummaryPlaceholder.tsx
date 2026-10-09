import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';

export type WorkSummaryKind = 'email' | 'calls';

const CONTENT: Record<WorkSummaryKind, {
  title: string;
  icon: IconName;
  description: string;
  outputs: string[];
  service: string;
}> = {
  email: {
    title: 'Email summariser',
    icon: 'chat',
    description: 'Get the signal from busy threads without losing the context.',
    outputs: ['Key points and decisions', 'Questions that still need answers', 'Follow-ups and owners'],
    service: 'work email provider',
  },
  calls: {
    title: 'Call summariser',
    icon: 'mic',
    description: 'Turn a supported call transcript into clear notes you can act on.',
    outputs: ['Meeting overview and decisions', 'Action items and owners', 'Topics to follow up on'],
    service: 'call or meeting service',
  },
};

export function WorkSummaryPlaceholder({ kind }: { kind: WorkSummaryKind }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const content = CONTENT[kind];

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Work"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Icon name="back" size={18} color={colors.ink} />
          <AppText type="captionMed">Work</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroIcon, { backgroundColor: colors.marigoldSoft }]}>
          <Icon name={content.icon} size={27} color={colors.marigold} />
        </View>
        <AppText type="captionMed" color={colors.marigold} style={styles.eyebrow}>
          WORKSPACE
        </AppText>
        <AppText type="display" style={styles.title}>{content.title}</AppText>
        <AppText type="body" muted style={styles.intro}>{content.description}</AppText>

        <View style={[styles.integrationCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.cardHeading}>
            <AppText type="titleLg" style={styles.cardTitle}>Integration not connected</AppText>
            <View style={[styles.pendingBadge, { backgroundColor: colors.marigoldSoft }]}>
              <AppText type="captionMed" color={colors.marigold}>Coming soon</AppText>
            </View>
          </View>
          <AppText type="label" muted style={styles.cardDescription}>
            This preview does not connect to a {content.service}. The service API and authorization flow need to be configured before summaries can be generated.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={[styles.connectButton, { backgroundColor: colors.surface2 }]}
          >
            <AppText type="captionMed" color={colors.ink3}>Connect {kind === 'email' ? 'email' : 'calls'} — unavailable</AppText>
          </Pressable>
        </View>

        <AppText type="titleLg" style={styles.sectionTitle}>What summaries will include</AppText>
        <View style={[styles.outputsCard, { backgroundColor: colors.surface2 }]}>
          {content.outputs.map((output, index) => (
            <View key={output} style={[styles.outputRow, index > 0 && { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.outputDot, { backgroundColor: colors.sage }]} />
              <AppText type="label" style={styles.outputText}>{output}</AppText>
            </View>
          ))}
        </View>
        <AppText type="caption" muted style={styles.disclaimer}>
          No account access, call recording, or content processing happens on this screen.
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  content: { paddingHorizontal: 24, paddingTop: 22 },
  heroIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  title: { maxWidth: 330 },
  intro: { lineHeight: 23, marginTop: 12, marginBottom: 24 },
  integrationCard: { borderWidth: 1, borderRadius: 22, padding: 18 },
  cardHeading: { gap: 10 },
  cardTitle: { flexShrink: 1 },
  pendingBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  cardDescription: { lineHeight: 20, marginTop: 12 },
  connectButton: { alignItems: 'center', borderRadius: 14, paddingVertical: 14, marginTop: 18 },
  sectionTitle: { marginTop: 28, marginBottom: 12 },
  outputsCard: { borderRadius: 18, paddingHorizontal: 15 },
  outputRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 15 },
  outputDot: { width: 8, height: 8, borderRadius: 4 },
  outputText: { flex: 1 },
  disclaimer: { lineHeight: 18, marginTop: 15 },
});
