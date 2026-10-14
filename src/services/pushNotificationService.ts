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
            await PushNotifications.register();
            PushNotifications.addListener('registration', (token: Token) => {
              this.pushToken = token.value;
              console.log('[FCT Push FCM] Token appareil enregistré :', token.value);
            });
            PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
              console.log('[FCT Push FCM] Action sur notification distante :', action);
            });
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

  /**
   * Retourne le token push FCM si enregistré
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationEngine = new FctNotificationEngine();
