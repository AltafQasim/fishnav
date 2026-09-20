import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DynamicMoonView } from '@/components/calendar/dynamic-moon-view';
import { SolunarChart } from '@/components/calendar/solunar-chart';
import { MapColors } from '@/constants/map-theme';
import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { getMoonPhaseDetails, getSunTimingDetails } from '@/utils/astronomy';
import { getRegionalCalendar } from '@/utils/regional-calendar';

const TOTAL_FORECAST_DAYS = 35; // 5 full weeks covering a complete synodic lunar cycle

export function CalendarSheetContent() {
  const { colors, isLight } = useAppTheme();
  const { language, t } = useLanguage();
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const dateScrollRef = useRef<ScrollView>(null);

  // Selected date based on horizontal strip offset
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);
    return d;
  }, [selectedDayOffset]);

  // Locale for Gregorian calendar string formatting
  const locale = useMemo(() => {
    switch (language) {
      case 'hi':
        return 'hi-IN';
      case 'gu':
        return 'gu-IN';
      case 'mr':
        return 'mr-IN';
      case 'ta':
        return 'ta-IN';
      case 'ml':
        return 'ml-IN';
      case 'te':
        return 'te-IN';
      case 'bn':
        return 'bn-IN';
      default:
        return 'en-US';
    }
  }, [language]);

  // Compute astronomical details for selected date
  const moonInfo = useMemo(() => getMoonPhaseDetails(selectedDate), [selectedDate]);
  const sunInfo = useMemo(() => getSunTimingDetails(selectedDate), [selectedDate]);

  // Compute Regional Calendar strictly based on the user's SELECTED LANGUAGE
  const regionalCal = useMemo(
    () => getRegionalCalendar(selectedDate, language),
    [selectedDate, language]
  );

  // 35-day comprehensive strip items with language-specific tithi badges
  const days = useMemo(() => {
    return Array.from({ length: TOTAL_FORECAST_DAYS }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayCal = getRegionalCalendar(d, language);
      const dayMoon = getMoonPhaseDetails(d);

      const dayName =
        i === 0
          ? t('calendar.today', 'TODAY')
          : d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
      const month = d.toLocaleDateString(locale, { month: 'short' });

      return {
        offset: i,
        dayName,
        dateNum: d.getDate(),
        month,
        miniTithi: dayCal.miniTithi,
        specialDayText: dayCal.specialDayText,
        illumination: dayMoon.illumination,
        tithiNumber: dayCal.tithiNumber,
        isShukla: dayCal.isShukla,
      };
    });
  }, [locale, language, t]);

  // Quick jump target discovery (Next Poonam, Next Amas, Next Agiyaras)
  const poonamItem = useMemo(
    () => days.find((d) => d.tithiNumber === 15 && d.isShukla),
    [days]
  );
  const amasItem = useMemo(
    () => days.find((d) => d.tithiNumber === 15 && !d.isShukla),
    [days]
  );
  const agiyarasItem = useMemo(
    () => days.find((d) => d.tithiNumber === 11 && d.offset > 0),
    [days]
  );

  // Smooth scroll handler on date selection
  const handleSelectOffset = (offset: number) => {
    setSelectedDayOffset(offset);
    dateScrollRef.current?.scrollTo({
      x: Math.max(0, offset * 70 - 70),
      animated: true,
    });
  };

  const formattedGregorianDate = useMemo(() => {
    return selectedDate.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDate, locale]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 35-Day Header & Quick Jump Shortcuts */}
      <View style={styles.stripHeaderRow}>
        <View style={styles.stripHeaderLeft}>
          <Ionicons name="calendar-sharp" size={15} color="#38BDF8" />
          <Text style={[styles.stripHeaderTitle, { color: colors.text }]}>
            {t('calendar.days_forecast', '35-Day Lunar & Tide Forecast')}
          </Text>
        </View>
        <View
          style={[
            styles.totalDaysBadge,
            { backgroundColor: colors.chipBg, borderColor: colors.chipBorder },
          ]}
        >
          <Text style={[styles.totalDaysBadgeText, { color: colors.accent }]}>
            35 {t('calendar.days', 'DAYS')}
          </Text>
        </View>
      </View>

      {/* Quick Jump Pills (Today, Poonam, Amas, Agiyaras) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickJumpScroll}
        contentContainerStyle={styles.quickJumpContent}
      >
        <Pressable
          style={[
            styles.jumpChip,
            selectedDayOffset === 0 && styles.jumpChipActive,
            {
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
              borderColor: colors.divider,
            },
          ]}
          onPress={() => handleSelectOffset(0)}
        >
          <Text
            style={[
              styles.jumpChipText,
              { color: colors.textSecondary },
              selectedDayOffset === 0 && styles.jumpChipTextActive,
            ]}
          >
            📍 {t('calendar.today', 'TODAY')}
          </Text>
        </Pressable>

        {poonamItem && (
          <Pressable
            style={[
              styles.jumpChip,
              selectedDayOffset === poonamItem.offset && styles.jumpChipPoonamActive,
              {
                backgroundColor: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.16)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
              },
            ]}
            onPress={() => handleSelectOffset(poonamItem.offset)}
          >
            <Text style={[styles.jumpChipText, { color: '#F59E0B', fontWeight: '800' }]}>
              {t('calendar.jump_poonam', '🌕 Full Moon (Poonam)')} ({poonamItem.dateNum}{' '}
              {poonamItem.month})
            </Text>
          </Pressable>
        )}

        {amasItem && (
          <Pressable
            style={[
              styles.jumpChip,
              selectedDayOffset === amasItem.offset && styles.jumpChipAmasActive,
              {
                backgroundColor: isLight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.14)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
              },
            ]}
            onPress={() => handleSelectOffset(amasItem.offset)}
          >
            <Text style={[styles.jumpChipText, { color: '#38BDF8', fontWeight: '800' }]}>
              {t('calendar.jump_amas', '🌑 New Moon (Amas)')} ({amasItem.dateNum} {amasItem.month})
            </Text>
          </Pressable>
        )}

        {agiyarasItem && (
          <Pressable
            style={[
              styles.jumpChip,
              selectedDayOffset === agiyarasItem.offset && styles.jumpChipActive,
              {
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                borderColor: colors.divider,
              },
            ]}
            onPress={() => handleSelectOffset(agiyarasItem.offset)}
          >
            <Text
              style={[
                styles.jumpChipText,
                { color: isLight ? '#D97706' : '#FCD34D', fontWeight: '700' },
                selectedDayOffset === agiyarasItem.offset && styles.jumpChipTextActive,
              ]}
            >
              {t('calendar.jump_agiyaras', '⭐ Ekadashi')} ({agiyarasItem.dateNum}{' '}
              {agiyarasItem.month})
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* 35-Day Horizontal Selector */}
      <ScrollView
        ref={dateScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScroll}
      >
        {days.map((item) => {
          const isSelected = selectedDayOffset === item.offset;
          return (
            <Pressable
              key={item.offset}
              style={[
                styles.datePill,
                {
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 41, 66, 0.7)',
                  borderColor: colors.divider,
                },
                isSelected && {
                  backgroundColor: isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.18)',
                  borderColor: '#38BDF8',
                  shadowColor: '#38BDF8',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
              onPress={() => handleSelectOffset(item.offset)}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: colors.textSecondary },
                  isSelected && { color: '#38BDF8', fontWeight: '800' },
                ]}
              >
                {item.dayName}
              </Text>

              <Text
                style={[
                  styles.dateNum,
                  { color: colors.text },
                  isSelected && { color: isLight ? '#0284C7' : '#FFFFFF', fontWeight: '900' },
                ]}
              >
                {item.dateNum}
              </Text>

              <Text
                style={[
                  styles.monthText,
                  { color: colors.textMuted },
                  isSelected && { color: isLight ? '#0284C7' : '#38BDF8', fontWeight: '600' },
                ]}
              >
                {item.month}
              </Text>

              {/* Language-Specific Mini Tithi Badge */}
              <View
                style={[
                  styles.miniTithiBadge,
                  isSelected && styles.miniTithiBadgeActive,
                  item.specialDayText ? styles.miniTithiBadgeSpecial : null,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.miniTithiText,
                    isSelected && styles.miniTithiTextActive,
                    item.specialDayText ? styles.miniTithiTextSpecial : null,
                  ]}
                >
                  {item.miniTithi}
                </Text>
              </View>

              {/* Mini Illumination Dot */}
              <View style={styles.miniIllumRow}>
                <View
                  style={[
                    styles.miniIllumDot,
                    {
                      backgroundColor:
                        item.illumination > 80
                          ? '#F59E0B'
                          : item.illumination > 30
                            ? '#38BDF8'
                            : '#64748B',
                    },
                  ]}
                />
                <Text style={styles.miniIllumText}>{item.illumination}%</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* REGIONAL PANCHANG HERO CARD (DYNAMIC TO USER'S SELECTED LANGUAGE) */}
      <View
        style={[
          styles.card,
          styles.panchangCard,
          {
            backgroundColor: isLight ? '#FEFCE8' : 'rgba(24, 30, 48, 0.95)',
            borderColor: isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.3)',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <MaterialCommunityIcons name="calendar-star" size={18} color="#F59E0B" />
            <Text
              style={[
                styles.cardTitle,
                { color: isLight ? '#B45309' : '#FBBF24', letterSpacing: 0.6 },
              ]}
            >
              {regionalCal.calendarSystemName}
            </Text>
          </View>
          <View
            style={[
              styles.samvatBadge,
              {
                backgroundColor: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)',
              },
            ]}
          >
            <Text style={styles.samvatBadgeText}>{regionalCal.samvatYear}</Text>
          </View>
        </View>

        {/* Primary Language-Specific Tithi Banner */}
        <View style={styles.panchangHeroWrap}>
          <Text style={[styles.gujaratiTitleText, { color: isLight ? '#78350F' : '#FFFFFF' }]}>
            {regionalCal.formattedTitle}
          </Text>

          <View style={styles.dateMetaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.dateMetaText, { color: colors.textSecondary }]}>
              {formattedGregorianDate}
            </Text>
            <Text style={[styles.bulletSep, { color: colors.divider }]}>•</Text>
            <Text style={[styles.dateMetaText, { color: isLight ? '#D97706' : '#FCD34D' }]}>
              {regionalCal.pakshaLabel}
            </Text>
          </View>
        </View>

        {/* Special Day / High Tide Indicator */}
        {regionalCal.specialDayText && (
          <View
            style={[
              styles.specialDayBanner,
              {
                backgroundColor: isLight
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(245, 158, 11, 0.18)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
              },
            ]}
          >
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.specialDayText}>{regionalCal.specialDayText}</Text>
          </View>
        )}

        {/* Marine Fishing & Tidal Advice Box */}
        <View
          style={[
            styles.tideAdviceBox,
            {
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
              borderColor: isLight ? '#E2E8F0' : 'rgba(56, 189, 248, 0.2)',
            },
          ]}
        >
          <View style={styles.tideAdviceHeader}>
            <View style={styles.tideAdviceHeaderLeft}>
              <Ionicons name="water" size={15} color="#38BDF8" />
              <Text style={[styles.tideAdviceTitle, { color: isLight ? '#0369A1' : '#38BDF8' }]}>
                {regionalCal.marineTideName}
              </Text>
            </View>
            <View style={styles.nakshatraPill}>
              <Text style={styles.nakshatraText}>⭐ {regionalCal.nakshatraEstimate}</Text>
            </View>
          </View>
          <Text style={[styles.tideAdviceSummary, { color: colors.textSecondary }]}>
            {regionalCal.marineTideSummary}
          </Text>
        </View>
      </View>

      {/* MOON PHASE CARD (FIXED SOLID SIZE WITH DYNAMIC VISIBILITY PHASE) */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Ionicons name="moon" size={18} color="#FBBF24" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('calendar.moon_phase', 'MOON PHASE & ILLUMINATION')}
            </Text>
          </View>
          <View style={styles.illuminationBadge}>
            <Text style={styles.illuminationText}>
              {moonInfo.illumination}% {t('calendar.visibility', 'VISIBILITY')}
            </Text>
          </View>
        </View>

        {/* Moon Hero Row with FIXED Size and Dynamic Phase Visibility */}
        <View style={styles.moonHeroRow}>
          <View style={styles.moonGraphic}>
            <DynamicMoonView
              phase={moonInfo.phase}
              illumination={moonInfo.illumination}
              size={82}
            />
          </View>

          <View style={styles.moonInfoWrap}>
            <Text style={[styles.moonPhaseName, { color: colors.text }]}>
              {t('calendar.' + moonInfo.phaseKey, moonInfo.phaseNameEn)}
            </Text>

            <Text style={[styles.moonSub, { color: colors.textSecondary }]}>
              {regionalCal.tithiLabel} • {regionalCal.pakshaLabel}
            </Text>

            <View style={styles.moonStatsRow}>
              <Text style={[styles.moonDistance, { color: colors.textMuted }]}>
                {t('calendar.moon_age', 'Moon Age')}: {moonInfo.moonAgeDays.toFixed(1)} / 29.53 d
              </Text>
            </View>

            <View style={styles.moonStatsRow}>
              <Text style={[styles.moonDistance, { color: colors.textMuted }]}>
                {t('calendar.moon_distance', 'Distance')}: {moonInfo.distanceKm.toLocaleString()} km
              </Text>
            </View>

            {/* Moon Phase Visibility Badge */}
            <View style={styles.visibilityBadgeWrap}>
              <Feather name="eye" size={11} color="#38BDF8" />
              <Text style={styles.visibilityBadgeText}>
                {t('calendar.moon_visibility', 'Visibility')}: {moonInfo.illumination}%
              </Text>
            </View>
          </View>
        </View>

        {/* Moonrise, Moonset, Overhead, Underfoot */}
        <View style={styles.timingsGrid}>
          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
              {t('calendar.moonrise', 'MOONRISE')}
            </Text>
            <Text style={[styles.timingValue, { color: colors.text }]}>{moonInfo.moonrise}</Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
              {t('calendar.moonset', 'MOONSET')}
            </Text>
            <Text style={[styles.timingValue, { color: colors.text }]}>{moonInfo.moonset}</Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
              {t('calendar.overhead', 'OVERHEAD')}
            </Text>
            <Text style={[styles.timingValue, { color: colors.text }]}>{moonInfo.overhead}</Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
              {t('calendar.underfoot', 'UNDERFOOT')}
            </Text>
            <Text style={[styles.timingValue, { color: colors.text }]}>{moonInfo.underfoot}</Text>
          </View>
        </View>
      </View>

      {/* SUN & DAYLIGHT HOURS CARD */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Ionicons name="sunny" size={18} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('calendar.daylight_hours', 'SUN & DAYLIGHT HOURS')}
            </Text>
          </View>
          <View style={[styles.illuminationBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Text style={[styles.illuminationText, { color: '#F59E0B' }]}>
              {sunInfo.daylightHours}h {sunInfo.daylightMinutes}m{' '}
              {t('calendar.daylight', 'DAYLIGHT')}
            </Text>
          </View>
        </View>

        <View style={styles.timingsGrid}>
          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <View style={styles.timingHeaderRow}>
              <Feather name="sunrise" size={12} color="#F59E0B" />
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                {t('calendar.sunrise', 'SUNRISE')}
              </Text>
            </View>
            <Text style={[styles.timingValue, { color: colors.text }]}>{sunInfo.sunrise}</Text>
            <Text style={[styles.timingSub, { color: colors.textMuted }]}>
              {t('calendar.dawn', 'Dawn')}: {sunInfo.dawn}
            </Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <View style={styles.timingHeaderRow}>
              <Feather name="sunset" size={12} color="#EF4444" />
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                {t('calendar.sunset', 'SUNSET')}
              </Text>
            </View>
            <Text style={[styles.timingValue, { color: colors.text }]}>{sunInfo.sunset}</Text>
            <Text style={[styles.timingSub, { color: colors.textMuted }]}>
              {t('calendar.dusk', 'Dusk')}: {sunInfo.dusk}
            </Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <View style={styles.timingHeaderRow}>
              <Feather name="sun" size={12} color="#F59E0B" />
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                {t('calendar.solar_noon', 'SOLAR NOON')}
              </Text>
            </View>
            <Text style={[styles.timingValue, { color: colors.text }]}>{sunInfo.solarNoon}</Text>
            <Text style={[styles.timingSub, { color: colors.textMuted }]}>
              {t('calendar.angle', 'Angle')}: {sunInfo.sunAngleDeg}°
            </Text>
          </View>

          <View
            style={[
              styles.timingItem,
              { backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)' },
            ]}
          >
            <View style={styles.timingHeaderRow}>
              <Ionicons name="sparkles" size={12} color="#A855F7" />
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                {t('calendar.golden_hour', 'GOLDEN HOUR')}
              </Text>
            </View>
            <Text style={[styles.timingValue, { color: colors.text }]}>{sunInfo.goldenHour}</Text>
            <Text style={[styles.timingSub, { color: colors.textMuted }]}>
              {t('calendar.prime_catch', 'Prime Catch')}
            </Text>
          </View>
        </View>
      </View>

      {/* 24-HOUR SOLUNAR FEEDING FORECAST */}
      <SolunarChart />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stripHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  totalDaysBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  totalDaysBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  quickJumpScroll: {
    marginBottom: 10,
  },
  quickJumpContent: {
    gap: 8,
    paddingVertical: 2,
  },
  jumpChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  jumpChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  jumpChipPoonamActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  jumpChipAmasActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  jumpChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jumpChipTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  dateScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  datePill: {
    alignItems: 'center',
    backgroundColor: MapColors.navyPanel,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 62,
  },
  dayName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dateNum: {
    fontSize: 17,
    fontWeight: '800',
    marginVertical: 1,
  },
  monthText: {
    fontSize: 10,
    marginBottom: 4,
  },
  miniTithiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 58,
  },
  miniTithiBadgeActive: {
    backgroundColor: '#38BDF8',
  },
  miniTithiBadgeSpecial: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  miniTithiText: {
    color: MapColors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  miniTithiTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  miniTithiTextSpecial: {
    color: '#F59E0B',
  },
  miniIllumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  miniIllumDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniIllumText: {
    color: MapColors.textMuted,
    fontSize: 8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: MapColors.navyPanel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  panchangCard: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  samvatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  samvatBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  panchangHeroWrap: {
    marginBottom: 8,
  },
  gujaratiTitleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bulletSep: {
    fontSize: 11,
  },
  specialDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  specialDayText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  tideAdviceBox: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  tideAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tideAdviceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tideAdviceTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  nakshatraPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nakshatraText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '700',
  },
  tideAdviceSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  illuminationBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  illuminationText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  moonHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  moonGraphic: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonInfoWrap: {
    flex: 1,
  },
  moonPhaseName: {
    fontSize: 17,
    fontWeight: '800',
  },
  moonSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  moonStatsRow: {
    marginTop: 2,
  },
  moonDistance: {
    fontSize: 10,
    fontWeight: '500',
  },
  visibilityBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5,
  },
  visibilityBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
  },
  timingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  timingItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    padding: 8,
  },
  timingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  timingValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  timingSub: {
    fontSize: 9,
    marginTop: 1,
  },
});
