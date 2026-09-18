import { Platform } from 'react-native';
import type { DownloadProgress } from '@/services/offline-tile-manager';

// Safe dynamic loader to prevent Metro bundler compile-time error if expo-notifications is not yet installed
let Notifications: any = null;
try {
  // Metro bundler ignores indirect dynamic require
  const req = Function('return require')();
  Notifications = req('expo-notifications');
} catch {
  Notifications = null;
}

const NOTIFICATION_ID = 'fishnav-offline-map-download';
const CHANNEL_ID = 'marine-map-downloads';
const CHANNEL_COMPLETE_ID = 'marine-map-complete';

let isChannelSetup = false;
let lastNotifiedPercent = -1;
let lastNotifiedTime = 0;

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldPresentBanner: true,
      }),
    });
  } catch (e) {
    // Graceful fallback
  }
}

class NotificationService {
  private hasRequestedPermission = false;

  /**
   * Configure Android notification channels for low-noise progress updates & high-priority completion
   */
  async ensureChannels(): Promise<void> {
    if (Platform.OS !== 'android' || !Notifications || isChannelSetup) return;
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Marine Map Downloads',
        description: 'Live progress of marine chart downloads for offline deep-sea use',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: null,
        lightColor: '#00F0FF',
        showBadge: false,
      });

      await Notifications.setNotificationChannelAsync(CHANNEL_COMPLETE_ID, {
        name: 'Marine Map Download Complete',
        description: 'Alert when a coastal map chart finishes downloading',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
        showBadge: true,
      });

      isChannelSetup = true;
    } catch (err) {
      console.warn('[NotificationService] Failed to set up notification channels:', err);
    }
  }

  /**
   * Request system notification permissions on Android/iOS and Web
   */
  async requestPermissions(): Promise<boolean> {
    if (this.hasRequestedPermission) return true;
    this.hasRequestedPermission = true;

    // Web Browser Notifications API
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          try {
            const res = await Notification.requestPermission();
            return res === 'granted';
          } catch {
            return false;
          }
        }
      }
      return false;
    }

    // Native Mobile Notifications (Expo)
    if (!Notifications) {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (err) {
      console.warn('[NotificationService] Permission request failed:', err);
      return false;
    }
  }

  /**
   * Update system notification tray with live chart download progress (throttled to avoid spamming the OS)
   */
  async updateDownloadProgress(progress: DownloadProgress): Promise<void> {
    const now = Date.now();
    // Throttle notifications: only dispatch if percent increases by >= 10% or >= 3 seconds elapsed
    if (
      lastNotifiedPercent !== -1 &&
      progress.percent < 100 &&
      progress.percent - lastNotifiedPercent < 10 &&
      now - lastNotifiedTime < 3000
    ) {
      return;
    }

    lastNotifiedPercent = progress.percent;
    lastNotifiedTime = now;

    const title = `🗺️ Downloading Chart (${progress.percent}%)`;
    const body = `${progress.regionName} • ${progress.completed}/${progress.total} tiles cached`;

    // 1. Native Mobile Notification (Android notification tray / iOS banner)
    if (Notifications) {
      try {
        await this.ensureChannels();
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_ID,
          content: {
            title,
            body,
            data: { regionId: progress.regionId, percent: progress.percent },
            channelId: CHANNEL_ID,
            sticky: true,
          },
          trigger: null,
        });
      } catch (err) {
        // Silent catch
      }
    }

    // 2. Web Browser Notification
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            tag: NOTIFICATION_ID,
            silent: true,
          });
        }
      } catch {
        // Silent catch
      }
    }
  }

  /**
   * Alert user when download finishes or is cancelled
   */
  async completeDownloadNotification(regionName: string, success: boolean): Promise<void> {
    lastNotifiedPercent = -1;
    lastNotifiedTime = 0;

    // Clear sticky progress notification
    if (Notifications) {
      try {
        await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
      } catch {}
    }

    if (!success) return;

    const title = `✅ Chart Saved Offline: ${regionName}`;
    const body = 'Map tiles downloaded successfully! Ready for deep-sea navigation with 0% internet.';

    // Native Mobile Notification
    if (Notifications) {
      try {
        await this.ensureChannels();
        await Notifications.scheduleNotificationAsync({
          identifier: `complete-${Date.now()}`,
          content: {
            title,
            body,
            channelId: CHANNEL_COMPLETE_ID,
            sound: true,
          },
          trigger: null,
        });
      } catch (err) {
        console.warn('[NotificationService] Complete notification failed:', err);
      }
    }

    // Web Browser Notification
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            tag: 'fishnav-complete',
          });
        }
      } catch {}
    }
  }

  /**
   * Cancel and dismiss any active download notification
   */
  async dismissDownloadNotification(): Promise<void> {
    lastNotifiedPercent = -1;
    lastNotifiedTime = 0;
    if (Notifications) {
      try {
        await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
      } catch {}
    }
  }
}

export const notificationService = new NotificationService();
