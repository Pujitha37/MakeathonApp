// Ported from `forecastHTML()` in finprofile.html.
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/Button';
import { SparkLine } from '@/components/SparkLine';
import { useSheet } from '@/components/Sheet';
import { GroupedTxList } from '@/components/GroupedTxList';
import { BudgetSheetContent } from '@/components/sheets/BudgetSheet';
import { ScopeSheetContent } from '@/components/sheets/ScopeSheet';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { forecast } from '@/lib/forecast';
import { curMonth } from '@/lib/calc';
import { fd, fmt } from '@/lib/format';
import { CAT, CatId } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function ForecastScreen() {
  const { colors } = useTheme();
  const sheet = useSheet();
  const { tx, stmts, scope, budgets, fcCat } = useStore(useShallow((s) => ({
    tx: s.tx,
    stmts: s.stmts,
    scope: s.scope,
    budgets: s.budgets,
    fcCat: s.fcCat,
  })));
  const setFcCat = useStore((s) => s.setFcCat);

  const opts = Array.from(new Set([...(Object.keys(budgets) as CatId[]), 'ENTERTAINMENT' as CatId]));
  const f = forecast(tx, stmts, scope, budgets, fcCat);

  return (
    <Screen title="Forecast" screen="forecast" showBack showScopeBar={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {opts.map((c) => (
            <Chip key={c} label={`${CAT[c].emoji} ${CAT[c].label}`} on={fcCat === c} onPress={() => setFcCat(c)} />
          ))}
        </View>
      </ScrollView>

      {!f.ok ? (
        <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
          <AppText style={{ fontSize: 40 }}>🌱</AppText>
          <AppText type="h3" style={{ marginTop: 8, marginBottom: 4 }}>
            Not enough data for a forecast
          </AppText>
          <AppText type="label" muted style={{ textAlign: 'center', marginBottom: 14 }}>
            {f.reason}
          </AppText>
          {(scope === 'bank' || scope === 'card') && (
            <Button label="Switch source" variant="soft" onPress={() => sheet.open(<ScopeSheetContent />, ['65%'])} />
          )}
        </Card>
      ) : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <AppText type="h3">{CAT[fcCat].label}</AppText>
              <StatusChip tone="info" label="Estimate" />
            </View>
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 2 }}>
              <AppText type="caption" muted>
                <AppText type="captionMed" color={colors.indigo}>
                  ━
                </AppText>{' '}
                Actual
              </AppText>
              <AppText type="caption" muted>
                <AppText type="captionMed" color={f.budget && f.projected > f.budget ? colors.marigold : colors.indigo}>
                  ╌
                </AppText>{' '}
                Projected
              </AppText>
              {f.budget != null && (
                <AppText type="caption" muted>
                  <AppText type="captionMed" color={colors.coral}>
                    ┄
                  </AppText>{' '}
                  Budget
                </AppText>
              )}
            </View>
            <SparkLine f={f} mini={false} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 16, padding: 12 }}>
                <AppText type="caption" muted>
                  Actual, 1–{f.covDay} Oct
                </AppText>
                <AppText type="numMd" num>
                  {fmt(f.actual)}
                </AppText>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 16, padding: 12 }}>
                <AppText type="caption" muted>
                  Projected by 31 Oct
                </AppText>
                <AppText type="numMd" num>
                  {fmt(f.projected)}
                </AppText>
              </View>
            </View>
            {f.budget != null ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: f.projected > f.budget ? colors.marigoldSoft : colors.sageSoft,
                }}
              >
                <AppText type="label">
                  {f.projected > f.budget
                    ? `May exceed your ${fmt(f.budget)} budget by around ${fmt(f.projected - f.budget)}.`
                    : `Likely to stay within your ${fmt(f.budget)} budget, with about ${fmt(f.budget - f.projected)} to spare.`}
                </AppText>
              </View>
            ) : (
              <AppText type="label" muted style={{ marginTop: 10 }} onPress={() => sheet.open(<BudgetSheetContent cat={fcCat} />, ['55%', '90%'])}>
                No budget set for this category. <AppText type="labelMed" color={colors.indigo}>Set one</AppText>
              </AppText>
            )}
          </Card>

          <Card>
            <AppText type="h3" style={{ marginBottom: 8 }}>
              How this is worked out
            </AppText>
            <View style={{ backgroundColor: colors.surface2, borderRadius: 14, padding: 12 }}>
              <AppText type="label" num>
                {fmt(f.actual)} ÷ {f.covDay} days × {f.dim} days = <AppText type="labelMed">{fmt(f.projected)}</AppText>
              </AppText>
            </View>
            <View style={{ marginTop: 8, gap: 4 }}>
              <AppText type="label" muted>• Assumes you keep spending at the same daily pace as 1–{f.covDay} Oct.</AppText>
              <AppText type="label" muted>• Source: {scope === 'manual' ? 'Quick Add' : scope === 'bank' ? 'Bank statement' : 'Credit card statement'} only, data up to {fd(curMonth(stmts, scope).cov)}.</AppText>
              <AppText type="label" muted>• Leaves out income, transfers, card repayments and refunds.</AppText>
              <AppText type="label" muted>• Early in the month a single large purchase can move this a lot, so treat it as a rough guide.</AppText>
            </View>
            <Button
              label={`View the ${f.list.length} transactions`}
              variant="soft"
              block
              style={{ marginTop: 12 }}
              onPress={() =>
                sheet.open(
                  <View>
                    <AppText type="titleLg" style={{ marginBottom: 4 }}>
                      {CAT[fcCat].label}
                    </AppText>
                    <AppText type="label" muted style={{ marginBottom: 14 }}>
                      October so far
                    </AppText>
                    <GroupedTxList list={f.list} />
                  </View>,
                  ['70%', '92%'],
                )
              }
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
