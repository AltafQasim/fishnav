import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { MapColors } from '@/constants/map-theme';

const mapIcon = require('@/assets/images/tabIcons/explore.png');
const homeIcon = require('@/assets/images/tabIcons/home.png');

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={MapColors.navy}
      indicatorColor={MapColors.accentSoft}
      labelStyle={{
        default: { color: MapColors.textMuted },
        selected: { color: MapColors.accent },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" src={mapIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="spots">
        <NativeTabs.Trigger.Label>Spots</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mappin.and.ellipse" src={mapIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sailboat.fill" src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="line.3.horizontal" src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
