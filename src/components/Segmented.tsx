import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText } from './AppText';

export interface SegOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface2 }]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.btn, on && { backgroundColor: colors.surface, ...shadow }]}
          >
            <AppText type="captionMed" color={on ? colors.ink : colors.ink2} style={{ textAlign: 'center' }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.segmented,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 11,
  },
});
