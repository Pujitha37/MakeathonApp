// Ported from `piSheet()` in finprofile.html.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead, SettingRow } from '@/components/SheetParts';
import { StatusChip } from '@/components/StatusChip';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';

export function PiSheetContent() {
  const { colors } = useTheme();
  const muted = useStore((s) => s.muted);
  const listening = useStore((s) => s.listening);
  const offline = useStore((s) => s.offline);
  const toggleMuted = useStore((s) => s.toggleMuted);
  const toggleOffline = useStore((s) => s.toggleOffline);

  const dotColor = muted ? colors.marigold : listening ? colors.coral : colors.sage;
  const status = muted ? 'Microphone muted' : listening ? 'Listening now' : 'Ready, listening for the wake word';
  const sub = muted ? 'Flip the switch on the Pi to unmute.' : 'Audio stays on the Pi and is never uploaded.';

  return (
    <View>
      <SheetTitle>Your Pi companion</SheetTitle>
      <SheetLead>The AI runs on the Raspberry Pi 4 on your local network. Numbers are calculated on this phone.</SheetLead>
      <Card flat>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dotColor }} />
          <View style={{ flex: 1 }}>
            <AppText type="h3">{status}</AppText>
            <AppText type="captionSm" muted>
              {sub}
            </AppText>
          </View>
        </View>
      </Card>
      <InfoRow title="Connection" desc="Paired over local Wi-Fi, gateway authenticated" chip={<StatusChip tone="ok" label="Paired" />} />
      <SettingRow title="Physical mute switch" desc="Mirrors the switch on the device (demo toggle)" on={muted} onToggle={toggleMuted} />
      <SettingRow title="Simulate no internet" desc="Everything here keeps working offline" on={offline} onToggle={toggleOffline} />
      <InfoRow title="Cloud AI" desc="Never used for categories, answers or advice" chip={<StatusChip tone="info" label="Off" />} />
    </View>
  );
}

function InfoRow({ title, desc, chip }: { title: string; desc: string; chip: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText type="labelMed">{title}</AppText>
        <AppText type="captionSm" muted>
          {desc}
        </AppText>
      </View>
      {chip}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
});
