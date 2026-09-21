import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

import { useLanguage } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import type { SupportedLanguage } from '@/i18n/translations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LanguageDropdownProps = {
  compact?: boolean;
  onLanguageChanged?: (lang: SupportedLanguage) => void;
};

export function LanguageDropdown({ compact = false, onLanguageChanged }: LanguageDropdownProps) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const { colors, isLight } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 365;
  const [isOpen, setIsOpen] = useState(false);

  const selectedMeta = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
  };

  const handleSelect = async (code: SupportedLanguage) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(false);
    await setLanguage(code);
    onLanguageChanged?.(code);
  };

  return (
    <View style={styles.wrapper}>
      {/* 🔘 Dropdown Trigger Button */}
      <Pressable
        style={[
          styles.triggerButton,
          isSmall && { paddingVertical: 9, paddingHorizontal: 10 },
          {
            backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
            borderColor: isOpen ? colors.accent : isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)',
          },
          isOpen && styles.triggerButtonActive,
        ]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={`Application language: ${selectedMeta.nativeName}. Tap to toggle dropdown.`}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={[styles.triggerLeft, isSmall && { gap: 8 }]}>
          <View
            style={[
              styles.globeIconWrap,
              isSmall && { width: 32, height: 32, borderRadius: 8 },
              {
                backgroundColor: isLight ? '#E0F2FE' : 'rgba(0, 240, 255, 0.12)',
                borderColor: isLight ? '#BAE6FD' : 'rgba(0, 240, 255, 0.25)',
              },
            ]}
          >
            <Ionicons name="globe-outline" size={compact ? 15 : isSmall ? 16 : 18} color={colors.accent} />
          </View>
          <View style={styles.triggerTexts}>
            <View style={[styles.triggerNameRow, { flexWrap: 'wrap', gap: 4 }]}>
              <Text style={[styles.flagEmoji, isSmall && { fontSize: 16 }]}>{selectedMeta.flag}</Text>
              <Text style={[styles.nativeNameText, isSmall && { fontSize: 14 }, { color: colors.text }]}>
                {selectedMeta.nativeName}
              </Text>
              <Text style={[styles.englishNameText, isSmall && { fontSize: 11 }, { color: colors.textSecondary }]}>
                ({selectedMeta.name})
              </Text>
            </View>
            {!compact && (
              <Text style={[styles.regionSubtitle, isSmall && { fontSize: 10 }, { color: colors.textMuted }]} numberOfLines={1}>
                {selectedMeta.region}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.triggerRight}>
          <View
            style={[
              styles.chevronCircle,
              isSmall && { width: 24, height: 24, borderRadius: 12 },
              {
                backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={isSmall ? 15 : 18}
              color={isOpen ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>
      </Pressable>

      {/* 📋 Dropdown Menu List */}
      {isOpen && (
        <View
          style={[
            styles.menuListCard,
            {
              backgroundColor: isLight ? '#FFFFFF' : '#0B1929',
              borderColor: isOpen ? colors.accent : colors.divider,
              shadowColor: '#000',
            },
          ]}
        >
          <View
            style={[
              styles.menuHeader,
              isSmall && { paddingHorizontal: 10, paddingVertical: 8 },
              {
                borderBottomColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <MaterialCommunityIcons name="translate" size={15} color={colors.accent} />
            <Text style={[styles.menuHeaderTitle, isSmall && { fontSize: 10 }, { color: colors.textSecondary }]}>
              {t('settings.language.subtitle', 'Choose your preferred language for the app')}
            </Text>
          </View>

          {availableLanguages.map((item, index) => {
            const isSelected = item.code === language;
            const isLast = index === availableLanguages.length - 1;

            return (
              <Pressable
                key={item.code}
                style={[
                  styles.optionRow,
                  isSmall && { paddingVertical: 9, paddingHorizontal: 10 },
                  {
                    backgroundColor: isSelected
                      ? isLight
                        ? '#E0F2FE'
                        : 'rgba(0, 240, 255, 0.12)'
                      : 'transparent',
                    borderBottomColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.04)',
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => handleSelect(item.code)}
                accessibilityRole="button"
                accessibilityLabel={`${item.nativeName} (${item.name})`}
              >
                <View style={[styles.optionLeft, isSmall && { gap: 8 }]}>
                  <Text style={[styles.optionFlag, isSmall && { fontSize: 18 }]}>{item.flag}</Text>
                  <View style={styles.optionTextColumn}>
                    <View style={[styles.optionTitleRow, { flexWrap: 'wrap', gap: 4 }]}>
                      <Text
                        style={[
                          styles.optionNativeName,
                          isSmall && { fontSize: 13.5 },
                          {
                            color: isSelected ? colors.accent : colors.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {item.nativeName}
                      </Text>
                      <Text style={[styles.optionEnglishName, isSmall && { fontSize: 11 }, { color: colors.textSecondary }]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionRegion,
                        isSmall && { fontSize: 10 },
                        { color: isSelected ? colors.accent : colors.textMuted },
                      ]}
                    >
                      {item.region}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View
                    style={[
                      styles.selectedCheckWrap,
                      {
                        backgroundColor: colors.accent,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#000000" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.unselectedDot,
                      {
                        borderColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 4,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  triggerButtonActive: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  globeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  triggerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  nativeNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  englishNameText: {
    fontSize: 13,
    fontWeight: '500',
  },
  regionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  triggerRight: {
    marginLeft: 8,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuListCard: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionFlag: {
    fontSize: 20,
  },
  optionTextColumn: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionNativeName: {
    fontSize: 15,
  },
  optionEnglishName: {
    fontSize: 12,
  },
  optionRegion: {
    fontSize: 11,
    marginTop: 2,
  },
  selectedCheckWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});
