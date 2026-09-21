/**
 * Indian Regional, Gujarati Vikram Samvat & Hindu Panchang Calendar Engine.
 * Calculates traditional Lunar Month (Masa), Paksha, Tithi, and Marine Tide impact across all languages.
 */

import type { SupportedLanguage } from '@/i18n/translations';

export type RegionalCalendarInfo = {
  // Primary regional display strings
  formattedTitle: string; // e.g. "ભાદરવો સુદ આઠમ, વિક્રમ સંવત ૨૦૮૨" or "भाद्रपद शुक्ल अष्टमी, वि. सं. २०८२"
  tithiLabel: string; // e.g. "સુદ આઠમ" / "शुक्ल अष्टमी"
  pakshaLabel: string; // e.g. "સુદ (શુક્લ પક્ષ)" / "शुक्ल पक्ष"
  monthName: string; // e.g. "ભાદરવો" / "भाद्रपद"
  samvatYear: string; // e.g. "વિક્રમ સંવત ૨૦૮૨" / "वि. सं. २०८२"
  tithiNumber: number; // 1 to 15
  isShukla: boolean; // true = Sud / Shukla, false = Vad / Krishna
  specialDayText: string | null; // e.g. "પૂનમ (મોટી ભરતી)" / "पूर्णिमा (बड़ा ज्वार)"

  // Marine Fishery & Tide Advice based on Tithi
  marineTideName: string; // e.g. "ઉધાણી / મોટી ભરતી (Spring Tide)"
  marineTideSummary: string; // localized advice for fishermen
  nakshatraEstimate: string; // Approximate Nakshatra for navigation
  calendarSystemName: string; // localized system title
  miniTithi: string; // concise badge for date pill e.g. "સુદ ૮", "शुक्ल ८", "வளர்பிறை 8"
};

// Gujarati Month Names (Kartikadi system)
const GUJARATI_MONTHS = [
  'કારતક',
  'માગશર',
  'પોષ',
  'મહા',
  'ફાગણ',
  'ચૈત્ર',
  'વૈશાખ',
  'જેઠ',
  'અષાઢ',
  'શ્રાવણ',
  'ભાદરવો',
  'આસો',
];

// Hindi / North Indian Purnimanta Months
const HINDI_MONTHS = [
  'कार्तिक',
  'मार्गशीर्ष',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत्र',
  'वैशाख',
  'ज्येष्ठ',
  'आषाढ़',
  'श्रावण',
  'भाद्रपद',
  'आश्विन',
];

// Marathi Month Names
const MARATHI_MONTHS = [
  'कार्तिक',
  'मार्गशीर्ष',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत्र',
  'वैशाख',
  'ज्येष्ठ',
  'आषाढ',
  'श्रावण',
  'भाद्रपद',
  'अश्विन',
];

// Tamil Months (Sauramana)
const TAMIL_MONTHS = [
  'கார்த்திகை',
  'மார்கழி',
  'தை',
  'மாசி',
  'பங்குனி',
  'சித்திரை',
  'வைகாசி',
  'ஆனி',
  'ஆடி',
  'ஆவணி',
  'புரட்டாசி',
  'ஐப்பசி',
];

// Bengali Months
const BENGALI_MONTHS = [
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
];

// Malayalam Months (Kollam Era)
const MALAYALAM_MONTHS = [
  'വൃശ്ചികം',
  'ധനു',
  'മകരം',
  'കുംഭം',
  'മീനം',
  'മേടം',
  'ഇടവം',
  'മിഥുനം',
  'കർക്കടകം',
  'ചിങ്ങം',
  'കന്നി',
  'തുലാം',
];

// Telugu Months
const TELUGU_MONTHS = [
  'కార్తీకం',
  'మార్గశిరం',
  'పుష్యం',
  'మాఘం',
  'ఫాల్గుణం',
  'చైత్రం',
  'వైశాఖం',
  'జ్యేష్ఠం',
  'ఆషాఢం',
  'శ్రావణం',
  'భాద్రపదం',
  'ఆశ్వయుజం',
];

// English Transliterated Months
const ENGLISH_MONTHS = [
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashvina',
];

// Gujarati Tithi Names
const GUJARATI_TITHIS = [
  'એકમ',
  'બીજ',
  'ત્રીજ',
  'ચોથ',
  'પાંચમ',
  'છઠ',
  'સાતમ',
  'આઠમ',
  'નોમ',
  'દશમ',
  'અગિયારસ',
  'બારસ',
  'તેરસ',
  'ચૌદશ',
  'પૂનમ', // 15 Shukla
  'અમાસ', // 15 Krishna
];

const HINDI_TITHIS = [
  'प्रतिपदा (एकम)',
  'द्वितीया (दूज)',
  'तृतीया (तीज)',
  'चतुर्थी (चौथ)',
  'पंचमी',
  'षष्ठी (छठ)',
  'सप्तमी',
  'अष्टमी',
  'नवमी',
  'दशमी',
  'एकादशी (ग्यारस)',
  'द्वादशी (बारस)',
  'त्रयोदशी (तेरस)',
  'चतुर्दशी',
  'पूर्णिमा',
  'अमावस्या',
];

const MARATHI_TITHIS = [
  'प्रतिपदा (पाडवा)',
  'द्वितीया',
  'तृतीया',
  'चतुर्थी',
  'पंचमी',
  'षष्ठी',
  'सप्तमी',
  'अष्टमी',
  'नवमी',
  'दशमी',
  'एकादशी',
  'द्वादशी',
  'त्रयोदशी',
  'चतुर्दशी',
  'पौर्णिमा',
  'अमावास्या',
];

const TAMIL_TITHIS = [
  'பிரதமை',
  'துவிதியை',
  'திருதியை',
  'சதுர்த்தி',
  'பஞ்சமி',
  'சஷ்டி',
  'சப்தமி',
  'அஷ்டமி',
  'நவமி',
  'தசமி',
  'ஏகாதசி',
  'துவாதசி',
  'திரயோதசி',
  'சதுர்தசி',
  'பௌர்ணமி',
  'அமாவாசை',
];

const TELUGU_TITHIS = [
  'పాడ్యమి',
  'విదియ',
  'తదియ',
  'చవితి',
  'పంచమి',
  'షష్ఠి',
  'సప్తమి',
  'అష్టమి',
  'నవమి',
  'దశమి',
  'ఏకాదశి',
  'ద్వాదశి',
  'త్రయోదశి',
  'చతుర్దశి',
  'పౌర్ణమి',
  'అమావాస్య',
];

const MALAYALAM_TITHIS = [
  'പ്രഥമ',
  'ദ്വിതീയ',
  'തൃതീയ',
  'ചതുർത്ഥി',
  'പഞ്ചമി',
  'ഷഷ്ഠി',
  'സപ്തമി',
  'അഷ്ടമി',
  'നവമി',
  'ദശമി',
  'ഏകാദശി',
  'ദ്വാദശി',
  'ത്രയോദശി',
  'ചതുർദ്ദശി',
  'വെളുത്ത വാവ്',
  'കറുത്ത വാവ്',
];

const BENGALI_TITHIS = [
  'প্রতিপদ',
  'দ্বিতীয়া',
  'তৃতীয়া',
  'চতুর্থী',
  'পঞ্চমী',
  'ষষ্ঠী',
  'সপ্তমী',
  'অষ্টমী',
  'নবমী',
  'দশমী',
  'একাদশী',
  'দ্বাদশী',
  'ত্রয়োদশী',
  'চতুর্দশী',
  'পূর্ণিমা',
  'অমাবস্যা',
];

const ENGLISH_TITHIS = [
  'Pratipada (Day 1)',
  'Dwitiya (Day 2)',
  'Tritiya (Day 3)',
  'Chaturthi (Day 4)',
  'Panchami (Day 5)',
  'Shashthi (Day 6)',
  'Saptami (Day 7)',
  'Ashtami (Quarter Moon)',
  'Navami (Day 9)',
  'Dashami (Day 10)',
  'Ekadashi (Day 11)',
  'Dwadashi (Day 12)',
  'Trayodashi (Day 13)',
  'Chaturdashi (Day 14)',
  'Full Moon (Purnima)',
  'New Moon (Amavasya)',
];

const NAKSHATRAS_MAP: Record<SupportedLanguage, string[]> = {
  gu: [
    'અશ્વિની', 'ભરણી', 'કૃતિકા', 'રોહિણી', 'મૃગશીર્ષ', 'આર્દ્રા', 'પુનર્વસુ', 'પુષ્ય',
    'આશ્લેષા', 'મઘા', 'પૂર્વા ફાલ્ગુની', 'ઉત્તરા ફાલ્ગુની', 'હસ્ત', 'ચિત્રા', 'સ્વાતિ',
    'વિશાખા', 'અનુરાધા', 'જ્યેષ્ઠા', 'મૂળ', 'પૂર્વાષાઢા', 'ઉત્તરાષાઢા', 'શ્રવણ',
    'ધનિષ્ઠા', 'શતભિષા', 'પૂર્વા ભાદ્રપદ', 'ઉત્તરા ભાદ્રપદ', 'રેવતી'
  ],
  hi: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य',
    'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
    'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
    'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'
  ],
  mr: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य',
    'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती',
    'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूळ', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण',
    'धनिष्ठा', 'शततारका', 'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती'
  ],
  ta: [
    'அஸ்வினி', 'பரணி', 'கார்த்திகை', 'ரோகிணி', 'மிருகசீரிஷம்', 'திருவாதிரை', 'புனர்பூசம்', 'பூசம்',
    'ஆயில்யம்', 'மகம்', 'பூரம்', 'உத்திரம்', 'அஸ்தம்', 'சித்திரை', 'சுவாதி',
    'விசாகம்', 'அனுஷம்', 'கேட்டை', 'மூலம்', 'பூராடம்', 'உத்திராடம்', 'திருவோணம்',
    'அவிட்டம்', 'சதயம்', 'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி'
  ],
  te: [
    'అశ్విని', 'భరణి', 'కృత్తిక', 'రోహిణి', 'మృగశిర', 'ఆరుద్ర', 'పునర్వసు', 'పుష్యమి',
    'ఆశ్లేష', 'మఖ', 'పుబ్బ', 'ఉత్తర', 'హస్త', 'చిత్త', 'స్వాతి',
    'విశాఖ', 'అనూరాధ', 'జ్యేష్ఠ', 'మూల', 'పూర్వాషాఢ', 'ఉత్తరాషాఢ', 'శ్రవణం',
    'ధనిష్ఠ', 'శతభిషం', 'పూర్వాభాద్ర', 'ఉత్తరాభాద్ర', 'రేవతి'
  ],
  ml: [
    'അശ്വതി', 'ഭരണി', 'കാർത്തിക', 'രോഹിണി', 'മകയിരം', 'തിരുവാതിര', 'പുണർതം', 'പൂയം',
    'ആയില്യം', 'മകം', 'പൂരം', 'ഉത്രം', 'അത്തം', 'ചിത്തിര', 'ചോതി',
    'വിശാഖം', 'അനിഴം', 'തൃക്കേട്ട', 'മൂലം', 'പൂരാടം', 'ഉത്രാടം', 'തിരുവോണം',
    'അവിട്ടം', 'ചതയം', 'പൂരുരുട്ടാതി', 'ഉത്തൃട്ടാതി', 'രേവതി'
  ],
  bn: [
    'অশ্বিনী', 'ভরণী', 'কৃত্তিকা', 'রোহিণী', 'মৃগশিরা', 'আর্দ্রা', 'পুনর্বসু', 'পুষ্যা',
    'অশ্লেষা', 'মঘা', 'পূর্ব ফাল্গুনী', 'উত্তর ফাল্গুনী', 'হস্তা', 'চিত্রা', 'স্বাতী',
    'বিশাখা', 'অনুরাধা', 'জ্যৈষ্ঠা', 'মূল', 'পূর্বাষাঢ়া', 'উত্তরাষাঢ়া', 'শ্রবণা',
    'ধনিষ্ঠা', 'শতভিষা', 'পূর্ব ভাদ্রপদ', 'উত্তর ভাদ্রপদ', 'রেবতী'
  ],
  en: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
    'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
    'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ],
};

// Astronomical epoch for Indian Tithi sync (accurate reference point)
const SYNODIC_MONTH = 29.530588853;
const REF_NEW_MOON_TIME = new Date('2024-01-11T11:57:00Z').getTime();

/**
 * Calculates Indian regional date, traditional calendar, Paksha, and Tithi for any given Date and Language.
 */
export function getRegionalCalendar(
  targetDate: Date = new Date(),
  lang: SupportedLanguage = 'gu'
): RegionalCalendarInfo {
  const timeMs = targetDate.getTime();
  const diffDays = (timeMs - REF_NEW_MOON_TIME) / (1000 * 60 * 60 * 24);
  const moonAge = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // A Tithi is 1/30th of a synodic lunar month (~0.984 days)
  const tithiIndexRaw = Math.floor((moonAge / SYNODIC_MONTH) * 30);
  const isShukla = tithiIndexRaw < 15;
  const tithiNumber = (tithiIndexRaw % 15) + 1; // 1 to 15

  // Indian Vikram Samvat Year calculation
  const year = targetDate.getFullYear();
  const monthIdx = targetDate.getMonth(); // 0 to 11
  const isAfterDiwali = monthIdx >= 10;
  const vikramSamvat = year + 56 + (isAfterDiwali ? 1 : 0);

  // Month index calculation
  const hinduMonthIndex = (monthIdx + 2) % 12;

  // Month localized picking
  const monthGu = GUJARATI_MONTHS[hinduMonthIndex];
  const monthHi = HINDI_MONTHS[hinduMonthIndex];
  const monthMr = MARATHI_MONTHS[hinduMonthIndex];
  const monthTa = TAMIL_MONTHS[hinduMonthIndex];
  const monthBn = BENGALI_MONTHS[hinduMonthIndex];
  const monthMl = MALAYALAM_MONTHS[hinduMonthIndex];
  const monthTe = TELUGU_MONTHS[hinduMonthIndex];
  const monthEn = ENGLISH_MONTHS[hinduMonthIndex];

  // Tithi picking per language
  const tithiNameGu =
    tithiNumber === 15
      ? isShukla
        ? GUJARATI_TITHIS[14]
        : GUJARATI_TITHIS[15]
      : GUJARATI_TITHIS[tithiNumber - 1];

  const tithiNameHi =
    tithiNumber === 15
      ? isShukla
        ? HINDI_TITHIS[14]
        : HINDI_TITHIS[15]
      : HINDI_TITHIS[tithiNumber - 1];

  const tithiNameMr =
    tithiNumber === 15
      ? isShukla
        ? MARATHI_TITHIS[14]
        : MARATHI_TITHIS[15]
      : MARATHI_TITHIS[tithiNumber - 1];

  const tithiNameTa =
    tithiNumber === 15
      ? isShukla
        ? TAMIL_TITHIS[14]
        : TAMIL_TITHIS[15]
      : TAMIL_TITHIS[tithiNumber - 1];

  const tithiNameTe =
    tithiNumber === 15
      ? isShukla
        ? TELUGU_TITHIS[14]
        : TELUGU_TITHIS[15]
      : TELUGU_TITHIS[tithiNumber - 1];

  const tithiNameMl =
    tithiNumber === 15
      ? isShukla
        ? MALAYALAM_TITHIS[14]
        : MALAYALAM_TITHIS[15]
      : MALAYALAM_TITHIS[tithiNumber - 1];

  const tithiNameBn =
    tithiNumber === 15
      ? isShukla
        ? BENGALI_TITHIS[14]
        : BENGALI_TITHIS[15]
      : BENGALI_TITHIS[tithiNumber - 1];

  const tithiNameEn =
    tithiNumber === 15
      ? isShukla
        ? ENGLISH_TITHIS[14]
        : ENGLISH_TITHIS[15]
      : ENGLISH_TITHIS[tithiNumber - 1];

  // Nakshatra approximation (13.33 deg per day)
  const nakshatraIndex = Math.floor(((diffDays * 1.05) % 27) + 27) % 27;
  const nakshatrasList = NAKSHATRAS_MAP[lang] || NAKSHATRAS_MAP.gu;
  const nakshatra = nakshatrasList[nakshatraIndex] || nakshatrasList[0];

  // Localized variables
  let formattedTitle = '';
  let tithiLabel = '';
  let pakshaLabel = '';
  let monthName = '';
  let samvatYear = '';
  let calendarSystemName = '';
  let specialDayText: string | null = null;
  let marineTideName = '';
  let marineTideSummary = '';
  let miniTithi = '';

  if (lang === 'hi') {
    calendarSystemName = 'हिन्दू पंचांग एवं तिथि';
    samvatYear = `विक्रम संवत ${vikramSamvat}`;
    monthName = monthHi;
    pakshaLabel = isShukla ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
    tithiLabel = `${isShukla ? 'शुक्ल' : 'कृष्ण'} ${tithiNameHi}`;
    formattedTitle = `${monthHi} ${isShukla ? 'शुक्ल' : 'कृष्ण'} ${tithiNameHi} • वि. सं. ${vikramSamvat}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'पूर्णिमा'
          : 'अमावस्या'
        : tithiNumber === 11
          ? 'एकादशी'
          : `${isShukla ? 'शुक्ल' : 'कृष्ण'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 पूर्णिमा (बड़ा ज्वार - Spring Tide)';
      marineTideName = 'स्प्रिंग टाइड (तीव्र बहाव)';
      marineTideSummary = 'पूर्णिमा पर अधिकतम ज्वार और तेज समुद्री बहाव। गहरे पानी की मछलियां सक्रिय रहेंगी।';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 अमावस्या (तीव्र ज्वार - Spring Tide)';
      marineTideName = 'अमावस्या तीव्र ज्वार (Spring Tide)';
      marineTideSummary = 'अंधेरी रात और भारी ज्वारीय बहाव। झींगा और तलहटी शिकार के लिए सर्वोत्तम।';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ एकादशी (ग्यारस)';
      marineTideName = 'बढ़ता ज्वार (Rising Flow)';
      marineTideSummary = 'ज्वार की गति बढ़ने लगती है। रीफ और छिछले पानी में मछली पकड़ने का अच्छा समय।';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 अष्टमी (नीप टाइड - शांत समुद्र)';
      marineTideName = 'नीप टाइड (शांत समुद्र)';
      marineTideSummary = 'धीमी समुद्री धाराएं और स्थिर पानी। तलहटी मछली पकड़ने (बॉटम फिशिंग) के लिए उपयुक्त।';
    } else {
      marineTideName = 'सामान्य ज्वार (Moderate Tide)';
      marineTideSummary = 'संतुलित समुद्री बहाव • सामान्य मछली पकड़ने हेतु अनुकूल।';
    }
  } else if (lang === 'mr') {
    calendarSystemName = 'मराठी पंचांग व तिथी';
    samvatYear = `शालिवाहन शके ${year - 78}`;
    monthName = monthMr;
    pakshaLabel = isShukla ? 'शुक्ल (शुद्ध)' : 'कृष्ण (वद्य)';
    tithiLabel = `${isShukla ? 'शुद्ध' : 'वद्य'} ${tithiNameMr}`;
    formattedTitle = `${monthMr} ${isShukla ? 'शुद्ध' : 'वद्य'} ${tithiNameMr} • शके ${year - 78}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'पौर्णिमा'
          : 'अमावास्या'
        : tithiNumber === 11
          ? 'एकादशी'
          : `${isShukla ? 'शुद्ध' : 'वद्य'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 पौर्णिमा (मोठी भरती - उधाण)';
      marineTideName = 'मोठी भरती / उधाण (Spring Tide)';
      marineTideSummary = 'पौर्णिमेमुळे समुद्रात वेगवान प्रवाह आणि मोठे पाणी. खोल समुद्रातील मासे सक्रिय.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 अमावास्या (उधाण भरती - Spring Tide)';
      marineTideName = 'अमावास्या उधाण (Spring Tide)';
      marineTideSummary = 'अंधारी रात्र आणि वेगवान सागरी प्रवाह. कोळंबी व पापलेटसाठी उत्तम वेळ.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ एकादशी';
      marineTideName = 'वाढती भरती (Rising Flow)';
      marineTideSummary = 'सागरी प्रवाहाचा वेग वाढू लागतो. खडकाळ व उथळ भागात चांगला शिकार.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 अष्टमी (लहान भरती - भांग)';
      marineTideName = 'लहान भरती / भांग (Neap Tide)';
      marineTideSummary = 'शांत पाणी व मंद प्रवाह. बोट स्थिर राहील, तळभागातील मासेमारीसाठी उत्तम.';
    } else {
      marineTideName = 'मध्यम भरती (Moderate Tide)';
      marineTideSummary = 'संतुलित सागरी प्रवाह • नियमित मासेमारीसाठी योग्य.';
    }
  } else if (lang === 'ta') {
    calendarSystemName = 'தமிழ் பாரம்பரிய பஞ்சாங்கம்';
    samvatYear = `தமிழ் ஆண்டு ${year}`;
    monthName = monthTa;
    pakshaLabel = isShukla ? 'வளர்பிறை (சுக்ல)' : 'தேய்பிறை (கிருஷ்ண)';
    tithiLabel = `${isShukla ? 'வளர்பிறை' : 'தேய்பிறை'} ${tithiNameTa}`;
    formattedTitle = `${monthTa} • ${isShukla ? 'வளர்பிறை' : 'தேய்பிறை'} ${tithiNameTa}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'பௌர்ணமி'
          : 'அமாவாசை'
        : tithiNumber === 11
          ? 'ஏகாதசி'
          : `${isShukla ? 'வளர்பிறை' : 'தேய்பிறை'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 பௌர்ணமி (பெருவெள்ளம் - Spring Tide)';
      marineTideName = 'பெருவெள்ளம் (Spring Tide)';
      marineTideSummary = 'அதிகபட்ச அலை வீச்சு மற்றும் தீவிர நீரோட்டம். ஆழ்கடல் மீன்கள் சுறுசுறுப்பாக இருக்கும்.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 அமாவாசை (பெருவெள்ளம் - Spring Tide)';
      marineTideName = 'அமாவாசை பெருவெள்ளம் (Spring Tide)';
      marineTideSummary = 'இருண்ட இரவு & வேகமான நீரோட்டம். இறால் மற்றும் நண்டு பிடிக்க சிறந்த நேரம்.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ ஏகாதசி';
      marineTideName = 'அலை உயர்வு (Rising Flow)';
      marineTideSummary = 'நீரோட்டம் அதிகரிக்கத் தொடங்குகிறது. பாறைப் பகுதிகளில் மீன்பிடிக்க ஏற்றது.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 அஷ்டமி (சிறுவெள்ளம் - Neap Tide)';
      marineTideName = 'சிறுவெள்ளம் (Neap Tide)';
      marineTideSummary = 'அமைதியான கடல் நீரோட்டம். படகு நிலைத்திருக்கும், அடிமட்ட மீன்பிடிப்புக்கு உகந்தது.';
    } else {
      marineTideName = 'மிதமான அலை (Moderate Tide)';
      marineTideSummary = 'சீரான கடல் நீரோட்டம் • வழக்கமான மீன்பிடிப்புக்கு ஏற்றது.';
    }
  } else if (lang === 'te') {
    calendarSystemName = 'తెలుగు పంచాంగం & తిథి';
    samvatYear = `శాలివాహన శక ${year - 78}`;
    monthName = monthTe;
    pakshaLabel = isShukla ? 'శుక్ల పక్షం (శుద్ధ)' : 'కృష్ణ పక్షం (బహుళ)';
    tithiLabel = `${isShukla ? 'శుద్ధ' : 'బహుళ'} ${tithiNameTe}`;
    formattedTitle = `${monthTe} ${isShukla ? 'శుద్ధ' : 'బహుళ'} ${tithiNameTe} • శక ${year - 78}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'పౌర్ణమి'
          : 'అమావాస్య'
        : tithiNumber === 11
          ? 'ఏకాదశి'
          : `${isShukla ? 'శుద్ధ' : 'బహుళ'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 పౌర్ణమి (పెద్ద పోటు - Spring Tide)';
      marineTideName = 'పెద్ద పోటు (Spring Tide)';
      marineTideSummary = 'తీవ్రమైన అలల ఉధృతి & వేగవంతమైన ప్రవాహాలు. లోతైన సముద్ర చేపలు చురుగ్గా ఉంటాయి.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 అమావాస్య (తీవ్ర పోటు - Spring Tide)';
      marineTideName = 'అమావాస్య పోటు (Spring Tide)';
      marineTideSummary = 'చీకటి రాత్రి మరియు తీవ్ర నీటి ప్రవాహం. రొయ్యలు మరియు పాంఫ్రెట్ వేటకు అనుకూలం.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ ఏకాదశి';
      marineTideName = 'పెరుగుతున్న పోటు (Rising Flow)';
      marineTideSummary = 'ప్రవాహ వేగం పెరుగుతుంది. రీఫ్ దగ్గర చేపల వేటకు మంచి సమయం.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 అష్టమి (చిన్న పోటు / పాటు - Neap Tide)';
      marineTideName = 'చిన్న పోటు (Neap Tide)';
      marineTideSummary = 'శాంతమైన సముద్రం. బోటు నిలకడగా ఉంటుంది, బాటమ్ ఫిషింగ్‌కు అనుకూలం.';
    } else {
      marineTideName = 'సాధారణ పోటు (Moderate Tide)';
      marineTideSummary = 'సమతుల్య సముద్ర ప్రవాహం • సాధారణ చేపల వేటకు అనుకూలం.';
    }
  } else if (lang === 'ml') {
    calendarSystemName = 'മലയാളം പഞ്ചാംഗം & തിഥി';
    samvatYear = `കൊല്ലവർഷം ${year - 825}`;
    monthName = monthMl;
    pakshaLabel = isShukla ? 'വെളുത്ത പക്ഷം' : 'കറുത്ത പക്ഷം';
    tithiLabel = `${isShukla ? 'വെളുത്ത പക്ഷം' : 'കറുത്ത പക്ഷം'} ${tithiNameMl}`;
    formattedTitle = `${monthMl} • ${isShukla ? 'വെളുത്ത പക്ഷം' : 'കറുത്ത പക്ഷം'} ${tithiNameMl} • കൊല്ലവർഷം ${year - 825}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'വെളുത്ത വാവ്'
          : 'കറുത്ത വാവ്'
        : tithiNumber === 11
          ? 'ഏകാദശി'
          : `${isShukla ? 'വെളുത്ത' : 'കറുത്ത'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 വെളുത്ത വാവ് (ശക്തമായ വേലിയേറ്റം)';
      marineTideName = 'വാവു വേലിയേറ്റം (Spring Tide)';
      marineTideSummary = 'ശക്തമായ അടിയൊഴുക്കും ഉയർന്ന വേലിയേറ്റവും. ആഴക്കടൽ മത്സ്യങ്ങൾ ഇരതേടാനിറങ്ങും.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 കറുത്ത വാവ് (ശക്തമായ വേലിയേറ്റം)';
      marineTideName = 'കറുത്ത വാവ് വേലിയേറ്റം (Spring Tide)';
      marineTideSummary = 'ഇരുണ്ട രാത്രിയും ശക്തമായ ഒഴുക്കും. ചെമ്മീൻ വേട്ടയ്ക്ക് ഏറ്റവും അനുയോജ്യം.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ ഏകാദശി';
      marineTideName = 'വർദ്ധിച്ച ഒഴുക്ക് (Rising Flow)';
      marineTideSummary = 'ഒഴുക്ക് ശക്തമാകാൻ തുടങ്ങുന്നു. പാറക്കെട്ടുകൾക്ക് സമീപം മീൻപിടിക്കാൻ നല്ല സമയം.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 അഷ്ടമി (വേലിയിറക്കം / ശാന്തമായ ഒഴുക്ക്)';
      marineTideName = 'അഷ്ടമി വേലിയേറ്റം (Neap Tide)';
      marineTideSummary = 'ശാന്തമായ സമുദ്രം. ബോട്ട് സുരക്ഷിതമായി നങ്കൂരമിടാം, അടിത്തട്ട് മീൻപിടുത്തത്തിന് മികച്ചത്.';
    } else {
      marineTideName = 'മിതമായ വേലിയേറ്റം (Moderate Tide)';
      marineTideSummary = 'ശാന്തമായ സമുദ്ര പ്രവാഹം • സാധാരണ മത്സ്യബന്ധനത്തിന് അനുയോജ്യം.';
    }
  } else if (lang === 'bn') {
    calendarSystemName = 'বাংলা পঞ্জিকা ও তিথি';
    samvatYear = `বঙ্গাব্দ ${year - 593}`;
    monthName = monthBn;
    pakshaLabel = isShukla ? 'শুক্ল পক্ষ' : 'কৃষ্ণ পক্ষ';
    tithiLabel = `${isShukla ? 'শুক্ল' : 'কৃষ্ণ'} ${tithiNameBn}`;
    formattedTitle = `${monthBn} ${isShukla ? 'শুক্ল' : 'কৃষ্ণ'} ${tithiNameBn} • বঙ্গাব্দ ${year - 593}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'পূর্ণিমা'
          : 'অমাবস্যা'
        : tithiNumber === 11
          ? 'একাদশী'
          : `${isShukla ? 'শুক্ল' : 'কৃষ্ণ'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 পূর্ণিমা (তেজি জোয়ার / ভরা কোটাল)';
      marineTideName = 'ভরা কোটাল (Spring Tide)';
      marineTideSummary = 'সর্বোচ্চ জোয়ার ও তীব্র স্রোতের গতি। গভীর জলের মাছের শিকারের দারুণ সময়।';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 অমাবস্যা (তেজি জোয়ার / ভরা কোটাল)';
      marineTideName = 'অমাবস্যা ভরা কোটাল (Spring Tide)';
      marineTideSummary = 'অন্ধকার রাত ও জোরালো স্রোত। চিংড়ি ও রূপচাঁদা মাছের জন্য সেরা সময়।';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ একাদশী';
      marineTideName = 'ক্রমবর্ধমান জোয়ার (Rising Flow)';
      marineTideSummary = 'স্রোতের গতি বৃদ্ধি পাচ্ছে। চরে ও অগভীর জলে মাছের আনাগোনা বাড়বে।';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 অষ্টমী (মরা কোটাল - Neap Tide)';
      marineTideName = 'মরা কোটাল (Neap Tide)';
      marineTideSummary = 'শান্ত সামুদ্রিক স্রোত ও স্থির জল। তলদেশের মাছ ধরার জন্য সবচেয়ে উপযুক্ত।';
    } else {
      marineTideName = 'স্বাভাবিক জোয়ার (Moderate Tide)';
      marineTideSummary = 'ভারসাম্যপূর্ণ সামুদ্রিক স্রোত • সাধারণ মাছ ধরার উপযোগী।';
    }
  } else if (lang === 'en') {
    calendarSystemName = 'Maritime Lunar Calendar & Panchang';
    samvatYear = `Vikram Samvat ${vikramSamvat}`;
    monthName = monthEn;
    pakshaLabel = isShukla ? 'Waxing Moon (Shukla)' : 'Waning Moon (Krishna)';
    tithiLabel = `${isShukla ? 'Shukla' : 'Krishna'} ${tithiNameEn}`;
    formattedTitle = `${monthEn} ${isShukla ? 'Shukla' : 'Krishna'} Day ${tithiNumber} • VS ${vikramSamvat}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'Full Moon'
          : 'New Moon'
        : tithiNumber === 11
          ? 'Ekadashi'
          : `${isShukla ? 'Shukla' : 'Krishna'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 Full Moon (Spring Tide)';
      marineTideName = 'Spring Tide (Maximum Currents)';
      marineTideSummary = 'Maximum tidal surge and strong currents. Pelagic fish feed actively near reefs.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 New Moon (Spring Tide)';
      marineTideName = 'New Moon Spring Tide';
      marineTideSummary = 'Dark night and heavy tidal sweep. Prime time for shrimp and bottom prowlers.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ Ekadashi (Rising Tide)';
      marineTideName = 'Rising Tidal Current';
      marineTideSummary = 'Current velocity increasing. Productive bite around drop-offs and reefs.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 Quarter Moon (Neap Tide)';
      marineTideName = 'Neap Tide (Calm Seas)';
      marineTideSummary = 'Gentle currents and steady boat drift. Ideal for bottom anchoring and reef drops.';
    } else {
      marineTideName = 'Moderate Coastal Tide';
      marineTideSummary = 'Balanced tidal range suitable for general marine navigation and fishing.';
    }
  } else {
    // Default: Gujarati (gu)
    calendarSystemName = 'ગુજરાતી પંચાંગ અને તિથિ';
    samvatYear = `વિક્રમ સંવત ${vikramSamvat}`;
    monthName = monthGu;
    pakshaLabel = `${isShukla ? 'સુદ' : 'વદ'} (${isShukla ? 'શુક્લ પક્ષ' : 'કૃષ્ણ પક્ષ'})`;
    tithiLabel = `${isShukla ? 'સુદ' : 'વદ'} ${tithiNameGu}`;
    formattedTitle = `${monthGu} ${isShukla ? 'સુદ' : 'વદ'} ${tithiNameGu} • વિ. સં. ${vikramSamvat}`;
    miniTithi =
      tithiNumber === 15
        ? isShukla
          ? 'પૂનમ'
          : 'અમાસ'
        : tithiNumber === 11
          ? 'અગિયારસ'
          : `${isShukla ? 'સુદ' : 'વદ'} ${tithiNumber}`;

    if (tithiNumber === 15 && isShukla) {
      specialDayText = '🌕 પૂનમ (મોટી ભરતી - ઉધાણી)';
      marineTideName = 'ઉધાણી / મોટી ભરતી (Spring Tide)';
      marineTideSummary = 'મહત્તમ ભરતી અને ઝડપી પ્રવાહ. ઊંડા દરિયામાં મોટી માછલીઓની હિલચાલ તેજ રહેશે.';
    } else if (tithiNumber === 15 && !isShukla) {
      specialDayText = '🌑 અમાસ (મોટી ભરતી - ઉધાણી)';
      marineTideName = 'અમાસ ઉધાણી (Spring Tide)';
      marineTideSummary = 'રાત્રે અંધકાર અને ભારે ભરતી. જીંગા અને પોમફ્રેટ માટે ઉત્તમ સમય.';
    } else if (tithiNumber === 11) {
      specialDayText = '⭐ અગિયારસ (એકાદશી)';
      marineTideName = 'ભરતીમાં વધારો (Rising Flow)';
      marineTideSummary = 'ભરતીની ગતિ તેજ થવાનું શરૂ. રીફ અને પથ્થર નજીક માછીમારી માટે સારો સમય.';
    } else if (tithiNumber === 8) {
      specialDayText = '🌊 આઠમ (ખાંભી ઓટ - Neap Tide)';
      marineTideName = 'ખાંભી / ઓટ (Neap Tide)';
      marineTideSummary = 'શાંત દરિયાઈ પ્રવાહ. બોટ સ્થિર રહેશે, તળિયે પથ્થરોમાં રહેતી માછલીઓ માટે શ્રેષ્ઠ.';
    } else {
      marineTideName = 'સામાન્ય ભરતી (Moderate Tide)';
      marineTideSummary = 'સામાન્ય દરિયાઈ પ્રવાહ • સામાન્ય માછીમારી માટે યોગ્ય.';
    }
  }

  return {
    formattedTitle,
    tithiLabel,
    pakshaLabel,
    monthName,
    samvatYear,
    tithiNumber,
    isShukla,
    specialDayText,
    marineTideName,
    marineTideSummary,
    nakshatraEstimate: nakshatra,
    calendarSystemName,
    miniTithi,
  };
}
