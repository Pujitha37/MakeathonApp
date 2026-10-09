import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';

type WorkTool = {
  title: string;
  description: string;
  icon: IconName;
  route: '/work/email' | '/work/calls';
};

const TOOLS: WorkTool[] = [
  {
    title: 'Email summariser',
    description: 'Turn long email threads into key points, decisions, and follow-ups.',
    icon: 'chat',
    route: '/work/email',
  },
  {
    title: 'Call summariser',
    description: 'Get concise meeting notes, decisions, and action items from calls.',
    icon: 'mic',
    route: '/work/calls',
  },
];

function ToolCard({ tool }: { tool: WorkTool }) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(tool.route)}
      style={({ pressed }) => [
        styles.toolCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.toolIcon, { backgroundColor: colors.marigoldSoft }]}>
        <Icon name={tool.icon} size={24} color={colors.marigold} />
      </View>
      <View style={styles.toolText}>
        <AppText type="titleLg">{tool.title}</AppText>
        <AppText type="label" muted style={styles.description}>
          {tool.description}
        </AppText>
        <View style={[styles.status, { backgroundColor: colors.surface2 }]}>
          <AppText type="captionMed" color={colors.ink2}>Backend setup pending</AppText>
        </View>
      </View>
      <Icon name="r" size={18} color={colors.ink3} />
    </Pressable>
  );
}

export default function WorkHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to profiles"
          onPress={() => router.replace('/')}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Icon name="back" size={18} color={colors.ink} />
          <AppText type="captionMed">Profiles</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroIcon, { backgroundColor: colors.marigoldSoft }]}>
          <Icon name="list" size={28} color={colors.marigold} />
        </View>
        <AppText type="captionMed" color={colors.marigold} style={styles.eyebrow}>
          WORKSPACE
        </AppText>
        <AppText type="display" style={styles.title}>Work, made clearer.</AppText>
        <AppText type="body" muted style={styles.intro}>
          Summarise work conversations and keep the important decisions and next steps in view.
        </AppText>

        <AppText type="titleLg" style={styles.sectionTitle}>Your tools</AppText>
        {TOOLS.map((tool) => <ToolCard key={tool.route} tool={tool} />)}

        <View style={[styles.note, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          <AppText type="captionMed">Private by design</AppText>
          <AppText type="caption" muted style={styles.noteText}>
            Email and call services are not connected yet. No inbox or call data is read or stored in this preview.
          </AppText>
        </View>
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
  title: { maxWidth: 320 },
  intro: { lineHeight: 23, marginTop: 12, marginBottom: 28 },
  sectionTitle: { marginBottom: 14 },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  toolIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toolText: { flex: 1 },
  description: { lineHeight: 19, marginTop: 5 },
  status: { alignSelf: 'flex-start', marginTop: 11, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999 },
  note: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
  noteText: { lineHeight: 19, marginTop: 6 },
});
