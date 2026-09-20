import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';

export type MapStyleId = 'google' | 'satellite' | 'terrain' | 'standard' | 'marine' | 'night';

type IonName = ComponentProps<typeof Ionicons>['name'];

type MapStyleSelectorProps = {
  value: MapStyleId;
  onChange: (id: MapStyleId) => void;
};

export function MapStyleSelector({ value, onChange }: MapStyleSelectorProps) {
  const { t } = useLanguage();

  const stylesList = useMemo<{ id: MapStyleId; label: string; icon: IonName }[]>(
    () => [
      { id: 'google', label: t('style.standard', 'Standard'), icon: 'map-outline' },
      { id: 'satellite', label: t('style.satellite', 'Satellite'), icon: 'globe-outline' },
      { id: 'standard', label: t('style.vector', 'Vector Chart'), icon: 'navigate-outline' },
    ],
    [t],
  );

  return (
    <View style={styles.bar}>
      {stylesList.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.item, active && styles.itemActive]}>
            <Ionicons
              name={item.icon}
              size={16}
              color={active ? MapColors.text : MapColors.textSecondary}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MapColors.navyGlass,
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  itemActive: {
    backgroundColor: MapColors.accent,
  },
  label: {
    color: MapColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: MapColors.text,
  },
});
