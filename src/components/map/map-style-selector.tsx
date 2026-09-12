import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MapColors } from '@/constants/map-theme';

export type MapStyleId = 'standard' | 'satellite' | 'marine' | 'night';

type IonName = ComponentProps<typeof Ionicons>['name'];

const STYLES: {
  id: MapStyleId;
  label: string;
  icon: IonName | 'waves';
  lib: 'ion' | 'mci';
}[] = [
  { id: 'standard', label: 'Standard', icon: 'cube-outline', lib: 'ion' },
  { id: 'satellite', label: 'Satellite', icon: 'globe-outline', lib: 'ion' },
  { id: 'marine', label: 'Marine', icon: 'waves', lib: 'mci' },
  { id: 'night', label: 'Night', icon: 'moon', lib: 'ion' },
];

type MapStyleSelectorProps = {
  value: MapStyleId;
  onChange: (id: MapStyleId) => void;
};

export function MapStyleSelector({ value, onChange }: MapStyleSelectorProps) {
  return (
    <View style={styles.bar}>
      {STYLES.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.item, active && styles.itemActive]}>
            {item.lib === 'mci' ? (
              <MaterialCommunityIcons
                name={item.icon as 'waves'}
                size={16}
                color={active ? MapColors.text : MapColors.textSecondary}
              />
            ) : (
              <Ionicons
                name={item.icon as IonName}
                size={16}
                color={active ? MapColors.text : MapColors.textSecondary}
              />
            )}
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
