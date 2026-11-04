/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Centre de notifications in-app (Firestore) & jetons FCM
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  type: string;
  linkUrl?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAtMs: number;
}

/** Écoute temps réel des notifications d'un utilisateur (les plus récentes d'abord). */
export function subscribeToNotifications(
  uid: string,
  onData: (items: AppNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, 'notifications'), where('recipientUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            recipientUid: data.recipientUid,
            title: data.title || '',
            body: data.body || '',
            type: data.type || '',
            linkUrl: data.linkUrl || '',
            relatedEntityId: data.relatedEntityId || '',
            isRead: Boolean(data.isRead),
            createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
          } as AppNotification;
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 100);
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
      onError?.(err);
    }
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true, readAt: serverTimestamp() });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`);
    throw e;
  }
}

export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  try {
    for (let i = 0; i < ids.length; i += 400) {
      const batch = writeBatch(db);
      ids.slice(i, i + 400).forEach((id) =>
        batch.update(doc(db, 'notifications', id), { isRead: true, readAt: serverTimestamp() })
      );
      await batch.commit();
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, 'notifications[batch]');
    throw e;
  }
}

function deviceDocId(uid: string, token: string): string {
  return `${uid}_${token.slice(-24).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/** Enregistre (ou rafraîchit) le jeton FCM de l'appareil pour l'utilisateur connecté. */
export async function saveDeviceToken(
  uid: string,
  role: string,
  token: string,
  platform: 'android' | 'web' | 'ios'
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'user_fcm_tokens', deviceDocId(uid, token)),
      {
        userId: uid,
        role,
        token,
        platform,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'user_fcm_tokens');
    throw e;
  }
}

export async function removeDeviceToken(uid: string, token: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'user_fcm_tokens', deviceDocId(uid, token)));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'user_fcm_tokens');
  }
}

