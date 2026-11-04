/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service Unifié de Notifications (Locales & Push FCM)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 * 
 * Permet l'envoi et la planification d'alertes sonores et visuelles sur smartphone Android
 * (via Capacitor LocalNotifications & PushNotifications) et sur Desktop (Web Notification API).
 * Les notifications programmées sont déclenchées par le système Android MÊME SI L'APPLICATION EST FERMÉE.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { isNativeMobile } from './mobileFileService.ts';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase.ts';
import { saveDeviceToken, removeDeviceToken } from './notificationCenterService.ts';

export interface NotificationPayload {
  id?: number;
  title: string;
  body: string;
  scheduleDate?: Date; // Si fourni, notification programmée dans le futur
  data?: Record<string, any>;
  sound?: string;
  actionTypeId?: string;
}

class FctNotificationEngine {
  private isInitialized = false;
  private pushToken: string | null = null;
  private pushListenersAttached = false;
  private session: { uid: string; role: string } | null = null;
  private foregroundUnsub: (() => void) | null = null;

  /**
   * Initialise les canaux de notification Android (Heads-up haute priorité)
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (isNativeMobile()) {
        // 1. Création des canaux de notification Android
        await LocalNotifications.createChannel({
          id: 'fct_vip_alerts',
          name: 'Alertes VIP FCT Automobile',
          description: 'Notifications prioritaires pour les réservations, contrats et caisse FCT',
          importance: 5, // Notification Heads-up maximale
          visibility: 1, // Visible sur écran de verrouillage
          vibration: true,
          lights: true,
          lightColor: '#0F2A4A',
        });

        // 2. Écoute des interactions utilisateur
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('[FCT Notification] Notification cliquée :', notification);
        });
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[FCT Notification] Initialisation des canaux :', err);
      return false;
    }
  }

  /**
   * Demande les permissions au système Android ou au navigateur
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      await this.init();

      if (isNativeMobile()) {
        const localPerm = await LocalNotifications.requestPermissions();
        if (localPerm.display !== 'granted') {
          return false;
        }

        // Enregistrement Push FCM
        try {
          const pushPerm = await PushNotifications.requestPermissions();
          if (pushPerm.receive === 'granted') {
            if (!this.pushListenersAttached) {
              this.pushListenersAttached = true;
              PushNotifications.addListener('registration', (token: Token) => {
                this.pushToken = token.value;
                void this.persistToken();
              });
              PushNotifications.addListener('registrationError', (err) => {
                console.error('[FCT Push FCM] Erreur d\'enregistrement :', err);
              });
              PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
                console.log('[FCT Push FCM] Action sur notification distante :', action);
              });
            }
            await PushNotifications.register();
          }
        } catch (pushErr) {
          console.warn('[FCT Push] Push distant facultatif :', pushErr);
        }

        return true;
      } else {
        // Navigateur Web Desktop
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const perm = await Notification.requestPermission();
          return perm === 'granted';
        }
        return false;
      }
    } catch (err) {
      console.error('[FCT Notification] Erreur demande permission :', err);
      return false;
    }
  }

  /**
   * Émet une notification immédiate ou programmée
   * Même si l'application est fermée sur Android, la date programmée est honorée par AlarmManager.
   */
  public async dispatch({
    id,
    title,
    body,
    scheduleDate,
    data = {},
  }: NotificationPayload): Promise<boolean> {
    const notifId = id || Math.floor(Math.random() * 1000000);

    try {
      if (isNativeMobile()) {
        const options: any = {
          notifications: [
            {
              id: notifId,
              title: title || 'FCT Automobile — Douala',
              body,
              channelId: 'fct_vip_alerts',
              smallIcon: 'ic_stat_fct_logo',
              extra: data,
            },
          ],
        };

        if (scheduleDate && scheduleDate.getTime() > Date.now()) {
          options.notifications[0].schedule = { at: scheduleDate };
        }

        await LocalNotifications.schedule(options);
        return true;
      } else {
        // Fallback Web Desktop
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          if (scheduleDate && scheduleDate.getTime() > Date.now()) {
            const delay = scheduleDate.getTime() - Date.now();
            setTimeout(() => {
              new Notification(title, {
                body,
                icon: '/icon-192.png',
                data,
              });
            }, delay);
          } else {
            new Notification(title, {
              body,
              icon: '/icon-192.png',
              data,
            });
          }
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('[FCT Notification] Erreur envoi notification :', err);
      return false;
    }
  }

  /**
   * Planifie automatiquement les rappels d'échéances de restitution de location
   * (Déclenché 2h avant la fin du contrat)
   */
  public async scheduleRentalReturnReminder(contractNumber: string, vehicleName: string, returnDate: Date): Promise<void> {
    const reminderDate = new Date(returnDate.getTime() - 2 * 60 * 60 * 1000); // 2 heures avant
    if (reminderDate.getTime() <= Date.now()) return;

    await this.dispatch({
      id: Math.abs(contractNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)),
      title: `FCT Location — Restitution Imminente : ${contractNumber}`,
      body: `Le véhicule ${vehicleName} doit être restitué aujourd'hui à 17h00 à l'agence de Bonamoussadi.`,
      scheduleDate: reminderDate,
      data: { type: 'RENTAL_RETURN', contractNumber },
    });
  }

  private async persistToken(): Promise<void> {
    if (!this.pushToken || !this.session) return;
    try {
      await saveDeviceToken(this.session.uid, this.session.role, this.pushToken, this.platform());
    } catch (err) {
      console.error('[FCT Push FCM] Impossible de sauvegarder le token appareil :', err);
    }
  }

  private platform(): 'android' | 'web' {
    return isNativeMobile() ? 'android' : 'web';
  }

  /**
   * Associe l'appareil à l'utilisateur connecté et enregistre son token FCM dans Firestore.
   * Sur le web, nécessite VITE_FIREBASE_VAPID_KEY ; sinon seules les notifications in-app sont actives.
   */
  public async registerForUser(uid: string, role: string): Promise<void> {
    this.session = { uid, role };
    try {
      if (isNativeMobile()) {
        if (this.pushToken) await this.persistToken();
        else await this.requestPermissions();
        return;
      }

      const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string | undefined;
      if (!vapidKey || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
        return;
      }
      if (!(await isSupported()) || Notification.permission === 'denied') return;
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (token) {
        this.pushToken = token;
        await this.persistToken();
      }
      if (!this.foregroundUnsub) {
        this.foregroundUnsub = onMessage(messaging, (msg) => {
          void this.dispatch({
            title: msg.notification?.title || 'FCT Automobile',
            body: msg.notification?.body || '',
            data: msg.data,
          });
        });
      }
    } catch (err) {
      console.error('[FCT Push] Enregistrement de l\'appareil impossible :', err);
    }
  }

  /** À appeler à la déconnexion : retire le token de l'appareil pour l'utilisateur sortant. */
  public async unregisterUser(): Promise<void> {
    const session = this.session;
    const token = this.pushToken;
    this.session = null;
    if (session && token) {
      await removeDeviceToken(session.uid, token);
    }
  }

  /**
   * Retourne le token push FCM si enregistré
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationEngine = new FctNotificationEngine();
