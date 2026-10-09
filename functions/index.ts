/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Cloud Functions Backend
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Enforces server-side authority:
 * - Atomic document numbering
 * - Cloudinary upload signature generation (API secret kept server-side)
 * - Cash session reconciliation
 * - Outbox synchronization & EmailJS notification dispatch
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 1. Numérotation séquentielle certifiée côté serveur
 * Génère des numéros uniques et continus : FAC-2026-0001, REC-2026-0001, CTR-2026-0001
 */
export const getNextDocumentSequence = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification FCT requise.');
  }

  const { prefix } = data;
  if (!prefix || typeof prefix !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Préfixe de document manquant.');
  }

  const year = new Date().getFullYear();
  const counterRef = db.collection('document_counters').doc(`${prefix}_${year}`);

  const nextNumber = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let currentSeq = 0;
    if (counterDoc.exists) {
      currentSeq = counterDoc.data()?.currentSequence || 0;
    }
    const newSeq = currentSeq + 1;
    transaction.set(counterRef, { currentSequence: newSeq, year, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return newSeq;
  });

  const formattedNumber = `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
  return { sequence: nextNumber, documentNumber: formattedNumber };
});

/**
 * 2. Génération de signature sécurisée pour Cloudinary
 * Ne divulgue JAMAIS le CLOUDINARY_API_SECRET au frontend
 */
export const generateCloudinarySignature = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Accès refusé.');
  }

  const { folder, timestamp, isPrivate } = data;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fct_secure_dummy_secret';

  // Signature SHA-1 standard Cloudinary
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${isPrivate ? '&type=authenticated' : ''}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  return { signature, timestamp };
});

/**
 * 3. Validation atomique de clôture de caisse avec détection d'écart
 */
export const reconcileAndCloseCashSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
  }

  const { sessionId, countedClosingBalanceXAF, closingNotes } = data;
  const sessionRef = db.collection('cash_sessions').doc(sessionId);

  return await db.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session de caisse introuvable.');
    }
    const session = sessionDoc.data()!;
    if (session.status === 'CLOSED') {
      throw new functions.https.HttpsError('failed-precondition', 'Cette session de caisse est déjà clôturée.');
    }

    const calculatedExpected = session.openingBalanceXAF + (session.currentCashInXAF || 0) - (session.currentCashOutXAF || 0);
    const discrepancy = countedClosingBalanceXAF - calculatedExpected;

    transaction.update(sessionRef, {
      status: 'CLOSED',
      countedClosingBalanceXAF,
      calculatedExpectedBalanceXAF: calculatedExpected,
      discrepancyXAF: discrepancy,
      closedById: context.auth.uid,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      closingNotes: closingNotes || '',
    });

    return { success: true, calculatedExpected, discrepancy };
  });
});

/**
 * 4. Validation atomique serveur d'une intervention de maintenance avec déduction de stock
 * Idempotent, vérification de stock, traçabilité et libération du véhicule.
 */
export const validateAndCompleteMaintenance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
  }

  const { maintenanceId, actualMileage } = data;
  if (!maintenanceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Identifiant d’intervention manquant.');
  }

  // Vérifier rôle appelant
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const callerRole = callerDoc.data()?.role;
  if (!['fleet_manager', 'director', 'super_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Rôle fleet_manager ou direction requis.');
  }

  const mntRef = db.collection('maintenance').doc(maintenanceId);

  return await db.runTransaction(async (transaction) => {
    const mntDoc = await transaction.get(mntRef);
    if (!mntDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Intervention de maintenance introuvable.');
    }

    const mnt = mntDoc.data()!;
    if (mnt.status === 'COMPLETED') {
      return { success: true, alreadyCompleted: true, message: 'Intervention déjà validée antérieurement.' };
    }

    const partsUsed = mnt.partsUsed || [];
    // 1. Vérification préalable de la disponibilité de toutes les pièces
    for (const part of partsUsed) {
      if (part.stockItemId) {
        const stockRef = db.collection('stock').doc(part.stockItemId);
        const stockDoc = await transaction.get(stockRef);
        if (!stockDoc.exists) {
          throw new functions.https.HttpsError('not-found', `Article de stock ${part.name} introuvable.`);
        }
        const available = stockDoc.data()?.quantityInStock || 0;
        if (available < part.quantity) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            `Stock insuffisant pour ${part.name} : ${available} disponible(s), ${part.quantity} demandée(s).`
          );
        }
      }
    }

    // 2. Déduction atomique et enregistrement des mouvements de stock
    for (const part of partsUsed) {
      if (part.stockItemId) {
        const stockRef = db.collection('stock').doc(part.stockItemId);
        const stockDoc = await transaction.get(stockRef);
        const currentQty = stockDoc.data()?.quantityInStock || 0;
        const newQty = currentQty - part.quantity;

        transaction.update(stockRef, {
          quantityInStock: newQty,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const movRef = db.collection('stock_movements').doc();
        transaction.set(movRef, {
          stockItemId: part.stockItemId,
          stockItemName: part.name,
          type: 'MAINTENANCE_USAGE',
          quantityDelta: -part.quantity,
          quantityAfter: newQty,
          unitCostXAF: part.unitPriceXAF,
          totalCostXAF: part.totalXAF,
          reason: `Consommation maintenance ${mnt.recordNumber} - ${mnt.vehicleName}`,
          relatedMaintenanceId: mnt.id,
          relatedVehicleId: mnt.vehicleId,
          performedById: context.auth.uid,
          performedByName: callerDoc.data()?.fullName || 'Gestionnaire Flotte',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 3. Libérer le véhicule et mettre à jour son kilométrage
    const vehRef = db.collection('vehicles').doc(mnt.vehicleId);
    const vehDoc = await transaction.get(vehRef);
    if (vehDoc.exists) {
      const updatePayload: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (vehDoc.data()?.status === 'MAINTENANCE') {
        updatePayload.status = 'AVAILABLE';
      }
      if (actualMileage && actualMileage > (vehDoc.data()?.mileage || 0)) {
        updatePayload.mileage = actualMileage;
      }
      transaction.update(vehRef, updatePayload);
    }

    // 4. Clôturer l'intervention
    transaction.update(mntRef, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      completedById: context.auth.uid,
      completedByName: callerDoc.data()?.fullName || 'Gestionnaire Flotte',
      actualMileageAtCompletion: actualMileage || mnt.mileageAtService,
    });

    return { success: true, message: `Intervention ${mnt.recordNumber} validée et stock déduit avec succès.` };
  });
});

/**
 * 6. Gestion centralisée des comptes utilisateurs, rôles et custom claims (Server-side)
 * Protège le dernier super_admin actif et synchronise les claims Firebase Auth
 */
export const manageUserAccountServer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== 'super_admin' && callerRole !== 'director') {
    throw new functions.https.HttpsError('permission-denied', 'Privilèges insuffisants pour gérer les comptes collaborateurs.');
  }

  const { targetUid, action, userData, reason } = data;

  if (action === 'CREATE' || action === 'INVITE') {
    const { email, fullName, role, phone, jobTitle } = userData;
    if (role === 'super_admin' && callerRole !== 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Seul un Super Administrateur peut créer un autre Super Administrateur.');
    }

    let authUser;
    try {
      authUser = await admin.auth().getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        authUser = await admin.auth().createUser({
          email,
          displayName: fullName,
          disabled: false,
        });
      } else {
        throw new functions.https.HttpsError('internal', e.message);
      }
    }

    // Définir le custom claim Firebase Auth pour le rôle
    await admin.auth().setCustomUserClaims(authUser.uid, { role });

    const userProfile = {
      id: authUser.uid,
      email: email.toLowerCase().trim(),
      fullName,
      phone: phone || '',
      jobTitle: jobTitle || '',
      role,
      status: action === 'INVITE' ? 'INVITED' : 'ACTIVE',
      isActive: true,
      createdAt: new Date().toISOString(),
      createdById: context.auth.uid,
      createdByName: callerDoc.data()?.fullName || 'Administrateur FCT',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(authUser.uid).set(userProfile, { merge: true });

    // Enregistrement dans le journal d'audit de sécurité
    await db.collection('security_audit_logs').add({
      timestamp: new Date().toISOString(),
      performedById: context.auth.uid,
      performedByName: callerDoc.data()?.fullName || 'Administrateur FCT',
      performedByRole: callerRole,
      targetUserId: authUser.uid,
      targetUserName: fullName,
      targetRole: role,
      actionType: action === 'INVITE' ? 'USER_INVITE' : 'USER_CREATE',
      summary: `Création du compte collaborateur "${fullName}" (${role})`,
      details: reason || 'Création initiée depuis l’interface d’administration FCT.',
    });

    return { success: true, uid: authUser.uid, message: `Compte ${fullName} créé avec succès.` };
  }

  if (action === 'UPDATE' || action === 'STATUS_CHANGE') {
    if (!targetUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Identifiant utilisateur cible manquant.');
    }

    const targetDoc = await db.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Utilisateur introuvable.');
    }
    const targetData = targetDoc.data();

    // Protection essentielle du dernier super_admin actif
    if (targetData?.role === 'super_admin' && targetData?.isActive) {
      const superAdminsSnap = await db.collection('users').where('role', '==', 'super_admin').where('isActive', '==', true).get();
      if (superAdminsSnap.size <= 1) {
        if (userData?.role && userData.role !== 'super_admin') {
          throw new functions.https.HttpsError('failed-precondition', 'Impossible de rétrograder le dernier Super Administrateur actif.');
        }
        if (userData?.isActive === false || userData?.status === 'SUSPENDED' || userData?.status === 'DISABLED') {
          throw new functions.https.HttpsError('failed-precondition', 'Impossible de désactiver le dernier Super Administrateur actif.');
        }
      }
    }

    if (userData?.role && userData.role !== targetData?.role) {
      await admin.auth().setCustomUserClaims(targetUid, { role: userData.role });
    }

    if (userData?.status === 'DISABLED' || userData?.isActive === false) {
      await admin.auth().updateUser(targetUid, { disabled: true });
    } else if (userData?.status === 'ACTIVE' || userData?.isActive === true) {
      await admin.auth().updateUser(targetUid, { disabled: false });
    }

    await db.collection('users').doc(targetUid).update({
      ...userData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('security_audit_logs').add({
      timestamp: new Date().toISOString(),
      performedById: context.auth.uid,
      performedByName: callerDoc.data()?.fullName || 'Administrateur FCT',
      performedByRole: callerRole,
      targetUserId: targetUid,
      targetUserName: targetData?.fullName,
      targetRole: userData?.role || targetData?.role,
      actionType: action === 'STATUS_CHANGE' ? 'USER_STATUS_CHANGE' : 'USER_UPDATE',
      summary: `Mise à jour du compte de "${targetData?.fullName}"`,
      details: reason || 'Modification de profil ou de statut.',
    });

    return { success: true, message: `Profil de ${targetData?.fullName} mis à jour avec succès.` };
  }

  throw new functions.https.HttpsError('invalid-argument', 'Action non reconnue.');
});

/**
 * 7. Mise à jour de la matrice de permissions côté serveur
 */
export const updateRolePermissionsServer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Seul un Super Administrateur peut modifier la matrice globale des rôles.');
  }

  const { role, permissions, reason } = data;
  if (!role || !permissions) {
    throw new functions.https.HttpsError('invalid-argument', 'Rôle et permissions requis.');
  }

  await db.collection('role_permissions').doc(role).set({
    permissions,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedById: context.auth.uid,
    updatedByName: callerDoc.data()?.fullName || 'Super Administrateur',
  });

  await db.collection('security_audit_logs').add({
    timestamp: new Date().toISOString(),
    performedById: context.auth.uid,
    performedByName: callerDoc.data()?.fullName || 'Super Administrateur',
    performedByRole: 'super_admin',
    targetRole: role,
    actionType: 'ROLE_PERMISSIONS_UPDATE',
    summary: `Mise à jour de la matrice de permissions du rôle "${role}"`,
    details: reason || 'Modification enregistrée via Cloud Function.',
  });

  return { success: true, message: `Permissions du rôle ${role} mises à jour avec succès.` };
});

