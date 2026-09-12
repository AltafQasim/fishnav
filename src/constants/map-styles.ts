export const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1c2c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1c2c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ba3b8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1c3348' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b8299' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#142a1f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a3145' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f2233' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#274860' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a3145' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#021526' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a6d88' }],
  },
];

export const MARINE_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#dceaf5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3a556c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5fbff' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#c5d7e6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#a9c4d8' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a6ea8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#dff3ff' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#b7d0a8' }],
  },
];
