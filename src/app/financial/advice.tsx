// Pi-backed advice: GET /advice.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { financialApi, type Advice } from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

export default function AdviceScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const a = await financialApi.advice();
      setItems(a);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const toneColor = (tone: Advice['tone']) =>
    tone === 'good' ? colors.sage : tone === 'bad' ? colors.coral : colors.marigold;
  const toneSoft = (tone: Advice['tone']) =>
    tone === 'good' ? colors.sageSoft : tone === 'bad' ? colors.coralSoft : colors.marigoldSoft;

  return (
    <Screen title="Advice" screen="advice" showBack showScopeBar={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 4, marginBottom: 12 }}>
        <AppText type="label" muted style={{ flex: 1, marginRight: 10 }}>
          Live nudges from the Pi, computed from your spending, budgets, and goals.
        </AppText>
        <Pressable onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
          <AppText type="captionMed" color={colors.indigo}>Refresh</AppText>
        </Pressable>
      </View>

      {loading && (
        <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator color={colors.indigo} />
        </Card>
      )}

      {!loading && error && (
        <Card style={{ backgroundColor: colors.marigoldSoft }}>
          <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
          <AppText style={{ fontSize: 40 }}>🌤️</AppText>
          <AppText type="h3" style={{ marginTop: 8, marginBottom: 4 }}>All clear</AppText>
          <AppText type="label" muted style={{ textAlign: 'center' }}>
            Nothing needs your attention right now.
          </AppText>
        </Card>
      )}

      {!loading && !error && items.map((a) => (
        <Card key={a.id} style={{ borderLeftWidth: 4, borderLeftColor: toneColor(a.tone), backgroundColor: toneSoft(a.tone) }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            {a.category_id && (
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: piCatColor(a.category_id) + '33', alignItems: 'center', justifyContent: 'center' }}>
                <AppText style={{ fontSize: 20 }}>{piCatEmoji(a.category_id)}</AppText>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText type="h3" style={{ fontSize: 15 }}>{a.title}</AppText>
              <AppText type="label" muted style={{ marginTop: 4, lineHeight: 20 }}>{a.body}</AppText>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <AppText type="caption" style={{ fontSize: 10, color: toneColor(a.tone), textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {a.kind.replace(/_/g, ' ')}
                </AppText>
                {a.category_id && (
                  <AppText type="caption" muted style={{ fontSize: 10 }}>· {piCatLabel(a.category_id)}</AppText>
                )}
              </View>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
