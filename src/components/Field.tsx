// Ported from `.field` in finprofile.html.
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface FieldProps extends TextInputProps {
  label: string;
}

export function Field({ label, style, ...rest }: FieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText type="captionMed" muted style={{ marginBottom: 6 }}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.ink3}
        style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface2, color: colors.ink }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 16,
  },
});
