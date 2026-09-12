import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapColors } from '@/constants/map-theme';
import { BottomTabInset } from '@/constants/theme';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: BottomTabInset }]}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Settings, account, and app preferences.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MapColors.navy,
    paddingHorizontal: 24,
  },
  title: {
    color: MapColors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: MapColors.textSecondary,
    fontSize: 15,
    marginTop: 8,
  },
});
