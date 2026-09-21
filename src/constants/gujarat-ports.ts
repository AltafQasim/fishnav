/**
 * Comprehensive Gujarat Fishing Harbors & Marine Ports Database
 *
 * Covers all 65+ official Gujarat Maritime Board (GMB) ports, CMFRI marine landing centers,
 * tidal creeks (bandars), and trawler harbors across all coastal districts:
 * Gir Somnath, Junagadh, Porbandar, Devbhumi Dwarka, Jamnagar, Morbi, Kutch,
 * Amreli, Diu, Bhavnagar, Bharuch, Surat, Navsari, and Valsad.
 */

import { bearingDegrees, distanceNm } from '@/utils/geo';

export type GujaratPortType =
  | 'major_fishing_harbor'
  | 'intermediate_port'
  | 'minor_landing_creek'
  | 'deep_sea_trawler_base';

export type GujaratPort = {
  id: string;
  name: string;
  nameGujarati: string;
  district: string;
  latitude: number;
  longitude: number;
  type: GujaratPortType;
  description: string;
};

export const GUJARAT_PORTS: GujaratPort[] = [
  // ==========================================
  // 1. GIR SOMNATH DISTRICT (Main Marine Hub)
  // ==========================================
  {
    id: 'veraval',
    name: 'Veraval Fishing Harbor',
    nameGujarati: 'વેરાવળ ફિશિંગ પોર્ટ',
    district: 'Gir Somnath',
    latitude: 20.9022,
    longitude: 70.3667,
    type: 'major_fishing_harbor',
    description: "Asia's largest seafood landing center & deep sea trawler base",
  },
  {
    id: 'sutrapada',
    name: 'Sutrapada Bandar',
    nameGujarati: 'સુત્રાપાડા બંદર',
    district: 'Gir Somnath',
    latitude: 20.8447,
    longitude: 70.4789,
    type: 'minor_landing_creek',
    description: 'Active gillnetter and motorized boat landing center',
  },
  {
    id: 'dhamlej',
    name: 'Dhamlej Bandar',
    nameGujarati: 'ધામળેજ બંદર',
    district: 'Gir Somnath',
    latitude: 20.7811,
    longitude: 70.5892,
    type: 'minor_landing_creek',
    description: 'Traditional marine fishing landing beach near Kodinar',
  },
  {
    id: 'mul_dwarka',
    name: 'Mul Dwarka (Kodinar)',
    nameGujarati: 'મૂળ દ્વારકા બંદર',
    district: 'Gir Somnath',
    latitude: 20.7589,
    longitude: 70.6625,
    type: 'intermediate_port',
    description: 'Ancient port and sheltered fishing anchorage basin',
  },
  {
    id: 'kotda',
    name: 'Kotda (Madhavray) Bandar',
    nameGujarati: 'કોટડા બંદર',
    district: 'Gir Somnath',
    latitude: 20.7412,
    longitude: 70.7381,
    type: 'minor_landing_creek',
    description: 'Tidal creek fishing harbor with mechanized fiber boats',
  },
  {
    id: 'madhwad',
    name: 'Madhwad Fishery Harbor',
    nameGujarati: 'મઢવાડ બંદર',
    district: 'Gir Somnath',
    latitude: 20.7189,
    longitude: 70.8123,
    type: 'major_fishing_harbor',
    description: 'Dense fishing settlement and sheltered creek anchorage',
  },
  {
    id: 'navabandar',
    name: 'Navabandar Harbor',
    nameGujarati: 'નવાબંદર (ગીર સોમનાથ)',
    district: 'Gir Somnath',
    latitude: 20.7356,
    longitude: 70.9234,
    type: 'major_fishing_harbor',
    description: 'One of the busiest traditional fishing creeks on the Saurashtra coast',
  },
  {
    id: 'hirakot',
    name: 'Hirakot Fishery Center',
    nameGujarati: 'હીરાકોટ બંદર',
    district: 'Gir Somnath',
    latitude: 20.8912,
    longitude: 70.4123,
    type: 'minor_landing_creek',
    description: 'Nearshore fishing landing point east of Somnath',
  },
  {
    id: 'adri',
    name: 'Adri Landing Center',
    nameGujarati: 'આદ્રી બંદર',
    district: 'Gir Somnath',
    latitude: 20.9567,
    longitude: 70.2833,
    type: 'minor_landing_creek',
    description: 'Coastal fishing center between Veraval and Mangrol',
  },

  // ==========================================
  // 2. JUNAGADH DISTRICT
  // ==========================================
  {
    id: 'mangrol',
    name: 'Mangrol Fishing Harbor',
    nameGujarati: 'માંગરોળ પોર્ટ',
    district: 'Junagadh',
    latitude: 21.1212,
    longitude: 70.1172,
    type: 'major_fishing_harbor',
    description: 'Major Saurashtra trawler and gillnetter harbor basin',
  },
  {
    id: 'sil',
    name: 'Sil Bandar',
    nameGujarati: 'શીલ બંદર',
    district: 'Junagadh',
    latitude: 21.1892,
    longitude: 70.0456,
    type: 'minor_landing_creek',
    description: 'Coastal fishing creek near Mangrol',
  },
  {
    id: 'chorwad',
    name: 'Chorwad Bandar',
    nameGujarati: 'ચોરવાડ બંદર',
    district: 'Junagadh',
    latitude: 20.9983,
    longitude: 70.2189,
    type: 'minor_landing_creek',
    description: 'Beach surf-landing center for artisanal fishers',
  },

  // ==========================================
  // 3. PORBANDAR DISTRICT
  // ==========================================
  {
    id: 'porbandar',
    name: 'Porbandar Fishing Harbor',
    nameGujarati: 'પોરબંદર પોર્ટ',
    district: 'Porbandar',
    latitude: 21.6417,
    longitude: 69.6293,
    type: 'major_fishing_harbor',
    description: 'All-weather port with Subhashnagar landing quay and trawler fleet',
  },
  {
    id: 'madhavpur',
    name: 'Madhavpur Ghed Beach',
    nameGujarati: 'માધવપુર ઘેડ બંદર',
    district: 'Porbandar',
    latitude: 21.2500,
    longitude: 69.9667,
    type: 'minor_landing_creek',
    description: 'Surf-landing beach for coastal fishing craft',
  },
  {
    id: 'navibandar',
    name: 'Navi Bandar (Bhadar Mouth)',
    nameGujarati: 'નવી બંદર (ભાદર નદી)',
    district: 'Porbandar',
    latitude: 21.4556,
    longitude: 69.7892,
    type: 'minor_landing_creek',
    description: 'Estuarine fishing center where Bhadar river meets the sea',
  },
  {
    id: 'miyani',
    name: 'Miyani Creek Bandar',
    nameGujarati: 'મિયાણી બંદર',
    district: 'Porbandar',
    latitude: 21.8344,
    longitude: 69.3878,
    type: 'minor_landing_creek',
    description: 'Historic creek harbor famous for lobster and pomfret catch',
  },
  {
    id: 'kuchhdi',
    name: 'Kuchhdi Landing Center',
    nameGujarati: 'કુછડી બંદર',
    district: 'Porbandar',
    latitude: 21.7123,
    longitude: 69.5412,
    type: 'minor_landing_creek',
    description: 'Coastal landing village north of Porbandar',
  },

  // ==========================================
  // 4. DEVBHUMI DWARKA DISTRICT
  // ==========================================
  {
    id: 'okha',
    name: 'Okha Fishing Harbor',
    nameGujarati: 'ઓખા પોર્ટ',
    district: 'Devbhumi Dwarka',
    latitude: 22.4667,
    longitude: 69.0667,
    type: 'major_fishing_harbor',
    description: 'Gateway to Gulf of Kutch and strategic deep-sea trawler port',
  },
  {
    id: 'rupen',
    name: 'Rupen Bandar (Dwarka)',
    nameGujarati: 'રૂપેણ બંદર (દ્વારકા)',
    district: 'Devbhumi Dwarka',
    latitude: 22.2567,
    longitude: 68.9667,
    type: 'major_fishing_harbor',
    description: 'High-density motorized fishing harbor right near Dwarka temple',
  },
  {
    id: 'beyt_dwarka',
    name: 'Beyt Dwarka (Balapur / Shankhodhar)',
    nameGujarati: 'બેટ દ્વારકા (બાલાપુર બંદર)',
    district: 'Devbhumi Dwarka',
    latitude: 22.4633,
    longitude: 69.1122,
    type: 'major_fishing_harbor',
    description: 'Island marine fishing harbor with sheltered tidal basin',
  },
  {
    id: 'arambhada',
    name: 'Arambhada Creek',
    nameGujarati: 'આરાંભડા બંદર',
    district: 'Devbhumi Dwarka',
    latitude: 22.4333,
    longitude: 69.0123,
    type: 'minor_landing_creek',
    description: 'Tidal creek between Mithapur and Okha',
  },
  {
    id: 'surajkaradi',
    name: 'Surajkaradi Fishery Center',
    nameGujarati: 'સૂરજકરાડી બંદર',
    district: 'Devbhumi Dwarka',
    latitude: 22.4189,
    longitude: 69.0412,
    type: 'minor_landing_creek',
    description: 'Marine landing zone on Okhamandal coast',
  },
  {
    id: 'poshitra',
    name: 'Poshitra Coral Creek',
    nameGujarati: 'પોષિત્રા બંદર',
    district: 'Devbhumi Dwarka',
    latitude: 22.3912,
    longitude: 69.2145,
    type: 'minor_landing_creek',
    description: 'Marine sanctuary creek harbor in Gulf of Kutch',
  },
  {
    id: 'kuranga',
    name: 'Kuranga Coastal Landing',
    nameGujarati: 'કુરાંગા બંદર',
    district: 'Devbhumi Dwarka',
    latitude: 22.0456,
    longitude: 69.1567,
    type: 'minor_landing_creek',
    description: 'Coastal fishing center on the Arabian Sea front',
  },
  {
    id: 'harshad',
    name: 'Harshad / Gandhavi Creek',
    nameGujarati: 'હર્ષદ / ગાંધવી બંદર',
    district: 'Devbhumi Dwarka',
    latitude: 21.8845,
    longitude: 69.3456,
    type: 'minor_landing_creek',
    description: 'Pilgrim and fishing harbor near Harsiddhi Mataji Temple',
  },

  // ==========================================
  // 5. JAMNAGAR DISTRICT
  // ==========================================
  {
    id: 'bedi',
    name: 'Bedi / Rozi Port',
    nameGujarati: 'બેડી બંદર (જામનગર)',
    district: 'Jamnagar',
    latitude: 22.5039,
    longitude: 70.0417,
    type: 'intermediate_port',
    description: 'Jamnagar regional fishing landing center & lighterage port',
  },
  {
    id: 'sikka',
    name: 'Sikka Fishing Harbor',
    nameGujarati: 'સિક્કા બંદર',
    district: 'Jamnagar',
    latitude: 22.4333,
    longitude: 69.8333,
    type: 'intermediate_port',
    description: 'Anchorage basin and industrial marine fishing creek',
  },
  {
    id: 'salaya',
    name: 'Salaya Marine Harbor',
    nameGujarati: 'સલાયા બંદર',
    district: 'Jamnagar',
    latitude: 22.3167,
    longitude: 69.6000,
    type: 'major_fishing_harbor',
    description: 'World-famous wooden dhow (vahan) maritime hub & active trawler port',
  },
  {
    id: 'jodiya',
    name: 'Jodiya Tidal Port',
    nameGujarati: 'જોડિયા બંદર',
    district: 'Jamnagar',
    latitude: 22.6833,
    longitude: 70.3000,
    type: 'minor_landing_creek',
    description: 'Tidal creek port on the southeast corner of Gulf of Kutch',
  },
  {
    id: 'sarmat',
    name: 'Sarmat Creek',
    nameGujarati: 'સરમત બંદર',
    district: 'Jamnagar',
    latitude: 22.4833,
    longitude: 69.9500,
    type: 'minor_landing_creek',
    description: 'Artisanal motorized boat landing point',
  },
  {
    id: 'dhuvav',
    name: 'Dhuvav Coastal Creek',
    nameGujarati: 'ધુવાવ બંદર',
    district: 'Jamnagar',
    latitude: 22.5212,
    longitude: 70.1234,
    type: 'minor_landing_creek',
    description: 'Nearshore fishing creek on the Jamnagar mudflats',
  },

  // ==========================================
  // 6. MORBI DISTRICT
  // ==========================================
  {
    id: 'navlakhi',
    name: 'Navlakhi Port',
    nameGujarati: 'નવલખી પોર્ટ',
    district: 'Morbi',
    latitude: 22.9583,
    longitude: 70.4472,
    type: 'intermediate_port',
    description: 'Inner Gulf of Kutch tidal estuary and regional fishing base',
  },

  // ==========================================
  // 7. KUTCH DISTRICT
  // ==========================================
  {
    id: 'jakhau',
    name: 'Jakhau Fishery Port',
    nameGujarati: 'જખૌ ફિશરી પોર્ટ',
    district: 'Kutch',
    latitude: 23.2355,
    longitude: 68.6975,
    type: 'major_fishing_harbor',
    description: 'Strategic Kutch border port renowned for pomfret, ghol & ribbonfish',
  },
  {
    id: 'koteshwar',
    name: 'Koteshwar / Narayan Sarovar',
    nameGujarati: 'કોટેશ્વર બંદર',
    district: 'Kutch',
    latitude: 23.6872,
    longitude: 68.5289,
    type: 'minor_landing_creek',
    description: 'Westernmost coastal creek harbor near Kori Creek border',
  },
  {
    id: 'mandvi',
    name: 'Mandvi Port',
    nameGujarati: 'માંડવી પોર્ટ',
    district: 'Kutch',
    latitude: 22.8333,
    longitude: 69.3556,
    type: 'major_fishing_harbor',
    description: 'Historic ship-building center & Rukmavati river mouth fishing harbor',
  },
  {
    id: 'mundra',
    name: 'Mundra Old Port',
    nameGujarati: 'મુન્દ્રા ઓલ્ડ પોર્ટ',
    district: 'Kutch',
    latitude: 22.8397,
    longitude: 69.7028,
    type: 'intermediate_port',
    description: 'Kutch central marine fishing landing basin',
  },
  {
    id: 'kandla',
    name: 'Kandla Creek Harbor',
    nameGujarati: 'કંડલા બંદર',
    district: 'Kutch',
    latitude: 23.0039,
    longitude: 70.2186,
    type: 'intermediate_port',
    description: 'Major tidal gulf port with estuarine fishing zones',
  },
  {
    id: 'tuna',
    name: 'Tuna / Tekra Port',
    nameGujarati: 'ટૂણા બંદર',
    district: 'Kutch',
    latitude: 22.9667,
    longitude: 70.1167,
    type: 'intermediate_port',
    description: 'Tidal creek port in Gulf of Kutch',
  },
  {
    id: 'modhva',
    name: 'Modhva Coastal Village',
    nameGujarati: 'મોઢવા બંદર',
    district: 'Kutch',
    latitude: 22.8123,
    longitude: 69.4567,
    type: 'minor_landing_creek',
    description: 'Traditional Kutch waghari/fishing community landing center',
  },
  {
    id: 'pingleshwar',
    name: 'Pingleshwar Coastal Landing',
    nameGujarati: 'પિંગલેશ્વર બંદર',
    district: 'Kutch',
    latitude: 23.1892,
    longitude: 68.7892,
    type: 'minor_landing_creek',
    description: 'Sandy beach landing south of Jakhau',
  },

  // ==========================================
  // 8. AMRELI DISTRICT
  // ==========================================
  {
    id: 'jafrabad',
    name: 'Jafrabad Fishing Harbor',
    nameGujarati: 'જાફરાબાદ પોર્ટ',
    district: 'Amreli',
    latitude: 20.8711,
    longitude: 71.3653,
    type: 'major_fishing_harbor',
    description: "Hub of India's 'Bombay Duck' (Bumla) trawling & drying fleets",
  },
  {
    id: 'pipavav',
    name: 'Pipavav / Shiyalbet Harbor',
    nameGujarati: 'પીપાવાવ / શિયાળબેટ બંદર',
    district: 'Amreli',
    latitude: 20.9167,
    longitude: 71.5056,
    type: 'major_fishing_harbor',
    description: 'Shiyalbet island marine community & natural deep water harbor',
  },
  {
    id: 'rajpara',
    name: 'Rajpara Fishery Harbor',
    nameGujarati: 'રાજપરા બંદર',
    district: 'Amreli',
    latitude: 20.8878,
    longitude: 71.4312,
    type: 'major_fishing_harbor',
    description: 'High-volume fish landing harbor adjacent to Jafrabad',
  },
  {
    id: 'chanch',
    name: 'Chanch Bandar',
    nameGujarati: 'ચાંચ બંદર',
    district: 'Amreli',
    latitude: 20.9412,
    longitude: 71.6123,
    type: 'minor_landing_creek',
    description: 'Island spit fishing landing creek near Pipavav',
  },
  {
    id: 'dharabandar',
    name: 'Dhara Bandar',
    nameGujarati: 'ધારા બંદર',
    district: 'Amreli',
    latitude: 20.8923,
    longitude: 71.3123,
    type: 'minor_landing_creek',
    description: 'Traditional creek fishing point near Jafrabad',
  },

  // ==========================================
  // 9. DIU (Geographically Saurashtra Coast)
  // ==========================================
  {
    id: 'vanakbara',
    name: 'Vanakbara Harbor (Diu)',
    nameGujarati: 'વણકબારા બંદર (દીવ)',
    district: 'Diu / Saurashtra',
    latitude: 20.7167,
    longitude: 70.9000,
    type: 'major_fishing_harbor',
    description: 'One of the densest mechanized fishing boat fleets in India',
  },
  {
    id: 'diu_bunder',
    name: 'Diu Main Bunder',
    nameGujarati: 'દીવ મુખ્ય બંદર',
    district: 'Diu / Saurashtra',
    latitude: 20.7133,
    longitude: 70.9856,
    type: 'major_fishing_harbor',
    description: 'Sheltered harbor basin on Diu Island channel',
  },
  {
    id: 'ghoghla',
    name: 'Ghoghla Fishery Landing',
    nameGujarati: 'ઘોઘલા બંદર',
    district: 'Diu / Saurashtra',
    latitude: 20.7233,
    longitude: 70.9989,
    type: 'minor_landing_creek',
    description: 'Continental side fishing center facing Diu Fort',
  },

  // ==========================================
  // 10. BHAVNAGAR DISTRICT
  // ==========================================
  {
    id: 'alang',
    name: 'Alang / Sartanpur Port',
    nameGujarati: 'સરતાનપુર / અલંગ બંદર',
    district: 'Bhavnagar',
    latitude: 21.3833,
    longitude: 72.2167,
    type: 'intermediate_port',
    description: 'West Gulf of Khambhat fishing port & anchorage',
  },
  {
    id: 'bhavnagar',
    name: 'Bhavnagar Old Port',
    nameGujarati: 'ભાવનગર પોર્ટ',
    district: 'Bhavnagar',
    latitude: 21.7667,
    longitude: 72.1500,
    type: 'intermediate_port',
    description: 'High tidal range lock-gate estuary port',
  },
  {
    id: 'ghogha',
    name: 'Ghogha Port Pier',
    nameGujarati: 'ઘોઘા બંદર',
    district: 'Bhavnagar',
    latitude: 21.6833,
    longitude: 72.2833,
    type: 'intermediate_port',
    description: 'Ro-Pax ferry terminal & regional fishing pier',
  },
  {
    id: 'sultanpur',
    name: 'Sultanpur Marine Creek',
    nameGujarati: 'સુલતાનપુર બંદર',
    district: 'Bhavnagar',
    latitude: 21.3123,
    longitude: 72.1123,
    type: 'minor_landing_creek',
    description: 'Shettrunji river mouth coastal fishing center',
  },
  {
    id: 'methla',
    name: 'Methla Coastal Landing',
    nameGujarati: 'મેથળા બંદર',
    district: 'Bhavnagar',
    latitude: 21.2189,
    longitude: 71.8567,
    type: 'minor_landing_creek',
    description: 'Coastal fishing center on Amreli-Bhavnagar border',
  },

  // ==========================================
  // 11. ANAND DISTRICT (Gulf of Khambhat Head)
  // ==========================================
  {
    id: 'khambhat',
    name: 'Khambhat Historic Port',
    nameGujarati: 'ખંભાત બંદર',
    district: 'Anand',
    latitude: 22.3133,
    longitude: 72.6189,
    type: 'minor_landing_creek',
    description: 'Ancient port with India’s highest tidal range (up to 11 meters!)',
  },

  // ==========================================
  // 12. BHARUCH DISTRICT
  // ==========================================
  {
    id: 'dahej',
    name: 'Dahej Fishery Creek',
    nameGujarati: 'દહેજ બંદર',
    district: 'Bharuch',
    latitude: 21.7056,
    longitude: 72.5361,
    type: 'intermediate_port',
    description: 'Narmada river mouth marine fishing and chemical port',
  },
  {
    id: 'kavi',
    name: 'Kavi Marine Bandar',
    nameGujarati: 'કાવી બંદર',
    district: 'Bharuch',
    latitude: 21.9833,
    longitude: 72.6167,
    type: 'minor_landing_creek',
    description: 'Mahi river estuary fishing landing center',
  },
  {
    id: 'bhagwa',
    name: 'Bhagwa Coastal Creek',
    nameGujarati: 'ભાગવા બંદર',
    district: 'Bharuch / Surat',
    latitude: 21.4167,
    longitude: 72.6833,
    type: 'minor_landing_creek',
    description: 'Estuarine fishing center on Gulf of Khambhat east coast',
  },

  // ==========================================
  // 13. SURAT DISTRICT
  // ==========================================
  {
    id: 'hazira',
    name: 'Hazira / Magdalla Harbor',
    nameGujarati: 'હજીરા / મગદલ્લા (સુરત)',
    district: 'Surat',
    latitude: 21.1167,
    longitude: 72.6333,
    type: 'major_fishing_harbor',
    description: 'Tapi estuary South Gujarat major marine landing harbor',
  },
  {
    id: 'dumas',
    name: 'Dumas Beach Landing',
    nameGujarati: 'ડુમસ બંદર',
    district: 'Surat',
    latitude: 21.0833,
    longitude: 72.7167,
    type: 'minor_landing_creek',
    description: 'Beach surf-landing center near Surat city',
  },
  {
    id: 'mora',
    name: 'Mora Coastal Fishery',
    nameGujarati: 'મોરા બંદર',
    district: 'Surat',
    latitude: 21.1667,
    longitude: 72.6500,
    type: 'minor_landing_creek',
    description: 'Hazira peninsula fishing community center',
  },

  // ==========================================
  // 14. NAVSARI DISTRICT
  // ==========================================
  {
    id: 'onjal',
    name: 'Onjal Machhiwad Fishery Harbor',
    nameGujarati: 'ઓંજલ માછીવાડ બંદર',
    district: 'Navsari',
    latitude: 20.8912,
    longitude: 72.8345,
    type: 'major_fishing_harbor',
    description: 'Highly populated Machhi marine fishing community and harbor',
  },
  {
    id: 'dandi',
    name: 'Dandi Beach Landing',
    nameGujarati: 'દાંડી બંદર',
    district: 'Navsari',
    latitude: 20.8833,
    longitude: 72.8000,
    type: 'minor_landing_creek',
    description: 'Historic coastal beach with active gillnetter craft',
  },
  {
    id: 'billimora',
    name: 'Billimora Port (Ambika Mouth)',
    nameGujarati: 'બીલીમોરા બંદર',
    district: 'Navsari',
    latitude: 20.7667,
    longitude: 72.9667,
    type: 'intermediate_port',
    description: 'Ambika river mouth tidal harbor & traditional boatyards',
  },
  {
    id: 'maroli_navsari',
    name: 'Maroli Creek (Navsari)',
    nameGujarati: 'મરોલી બંદર (નવસારી)',
    district: 'Navsari',
    latitude: 20.9333,
    longitude: 72.8167,
    type: 'minor_landing_creek',
    description: 'South Gujarat tidal creek fishing center',
  },

  // ==========================================
  // 15. VALSAD DISTRICT
  // ==========================================
  {
    id: 'valsad',
    name: 'Valsad (Kosamba / Dandi)',
    nameGujarati: 'વલસાડ (કોસંબા બંદર)',
    district: 'Valsad',
    latitude: 20.6100,
    longitude: 72.9300,
    type: 'major_fishing_harbor',
    description: 'Auranga river estuary fishing community and landing center',
  },
  {
    id: 'umargam',
    name: 'Umargam Fishery Harbor',
    nameGujarati: 'ઉમરગામ બંદર',
    district: 'Valsad',
    latitude: 20.1900,
    longitude: 72.7500,
    type: 'major_fishing_harbor',
    description: 'Southernmost Gujarat border fishing port near Maharashtra',
  },
  {
    id: 'maroli_valsad',
    name: 'Maroli Harbor (Valsad)',
    nameGujarati: 'મરોલી બંદર (વલસાડ)',
    district: 'Valsad',
    latitude: 20.2833,
    longitude: 72.7833,
    type: 'minor_landing_creek',
    description: 'Active coastal fishing center between Daman and Umargam',
  },
  {
    id: 'kolak',
    name: 'Kolak River Bandar',
    nameGujarati: 'કોલક બંદર',
    district: 'Valsad',
    latitude: 20.4667,
    longitude: 72.8833,
    type: 'minor_landing_creek',
    description: 'Kolak river mouth marine landing center',
  },
  {
    id: 'nargol',
    name: 'Nargol Fishery Beach',
    nameGujarati: 'નારગોલ બંદર',
    district: 'Valsad',
    latitude: 20.2333,
    longitude: 72.7500,
    type: 'minor_landing_creek',
    description: 'Coastal palm beach artisanal fishing center',
  },
  {
    id: 'umarsadi',
    name: 'Umarsadi (Par River Mouth)',
    nameGujarati: 'ઉમરસડી બંદર',
    district: 'Valsad',
    latitude: 20.5167,
    longitude: 72.9000,
    type: 'minor_landing_creek',
    description: 'Par river estuarine fishery landing center',
  },
  {
    id: 'kalai',
    name: 'Kalai Creek Bandar',
    nameGujarati: 'કલાઈ બંદર',
    district: 'Valsad',
    latitude: 20.2167,
    longitude: 72.7667,
    type: 'minor_landing_creek',
    description: 'South Gujarat border fishing landing creek',
  },
];

export type NearestPortResult = {
  port: GujaratPort;
  distanceNm: number;
  distanceKm: number;
  bearingDeg: number;
  bearingText: string;
  isAtPort: boolean; // within 2.5 NM (~4.6 km)
  displayBadge: string;
  displayStatusText: string;
};

function degToCompass(deg: number): string {
  const val = Math.round(deg / 22.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[val % 16] || 'N';
}

/**
 * Finds the nearest Gujarat fishing port or creek for any given GPS coordinates.
 */
export function findNearestGujaratPort(latitude?: number | null, longitude?: number | null): NearestPortResult {
  const safeLat = typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : 20.902;
  const safeLon = typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : 70.366;

  let nearestPort = GUJARAT_PORTS[0];
  let minDistanceNm = Infinity;
  let nearestBearing = 0;

  for (const port of GUJARAT_PORTS) {
    const dist = distanceNm(safeLat, safeLon, port.latitude, port.longitude);
    if (dist < minDistanceNm) {
      minDistanceNm = dist;
      nearestPort = port;
      nearestBearing = Math.round(bearingDegrees(safeLat, safeLon, port.latitude, port.longitude));
    }
  }

  const distanceKm = Number((minDistanceNm * 1.852).toFixed(1));
  const roundedNm = Number(minDistanceNm.toFixed(1));
  const bearingText = degToCompass(nearestBearing);
  const isAtPort = minDistanceNm <= 2.5; // Within 2.5 NM (~4.6 km) of port harbor limits

  let displayBadge = '';
  let displayStatusText = '';

  if (isAtPort) {
    displayBadge = `⚓ ${nearestPort.name} (At Port)`;
    displayStatusText = `Anchored at ${nearestPort.name} • ${nearestPort.district}`;
  } else {
    displayBadge = `📍 ${roundedNm} NM from ${nearestPort.name}`;
    displayStatusText = `Offshore • ${roundedNm} NM (${distanceKm} km) ${bearingText} of ${nearestPort.name}`;
  }

  return {
    port: nearestPort,
    distanceNm: roundedNm,
    distanceKm,
    bearingDeg: nearestBearing,
    bearingText,
    isAtPort,
    displayBadge,
    displayStatusText,
  };
}
