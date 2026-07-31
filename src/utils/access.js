/* ============================================================
   Access Control + Concurrency Guard (Firestore)
   Primary/Secondary Key Architecture
   ============================================================ */

import { db, authReady, signInAsAdmin } from './firebase.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  orderBy,
  limit,
  setDoc,
  increment
} from 'firebase/firestore';

const ACCESS_CODES_COLLECTION = 'access_codes';
const SESSIONS_COLLECTION = 'sessions';
const WAITLIST_COLLECTION = 'waitlist';

const DEFAULT_MAX_CONCURRENT = 50;
const HEARTBEAT_MS = 30000;
const SESSION_TTL_MIN = 20;
const AVG_SESSION_MIN = 12;

let heartbeatId = null;

function getSessionId() {
  const existing = localStorage.getItem('cogscreen_session_id');
  if (existing) return existing;
  const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  localStorage.setItem('cogscreen_session_id', id);
  return id;
}

function generateNewSessionId() {
  const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  localStorage.setItem('cogscreen_session_id', id);
  return id;
}

function getCutoffTimestamp() {
  const cutoff = new Date(Date.now() - SESSION_TTL_MIN * 60 * 1000);
  return Timestamp.fromDate(cutoff);
}

/**
 * Validate an access code — supports both primary and secondary keys.
 * Returns type info so callers can branch on key type.
 */
export async function validateAccessCode(code) {
  await authReady;
  const rawCode = (code || '').trim();
  if (!rawCode) return { ok: false, reason: 'invalid' };

  const ref = doc(db, ACCESS_CODES_COLLECTION, rawCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: 'invalid' };
  const data = snap.data();
  if (data.active === false) return { ok: false, reason: 'inactive' };

  const keyType = data.type || 'primary'; // backward compat: no type = primary

  if (keyType === 'secondary') {
    // Verify parent key exists and is active
    if (!data.parentKey) return { ok: false, reason: 'invalid' };
    const parentRef = doc(db, ACCESS_CODES_COLLECTION, data.parentKey);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return { ok: false, reason: 'parent_invalid' };
    const parentData = parentSnap.data();
    if (parentData.active === false) return { ok: false, reason: 'parent_inactive' };

    return {
      ok: true,
      code: rawCode,
      type: 'secondary',
      parentKey: data.parentKey,
      companyId: data.companyId || parentData.companyId || rawCode,
      companyName: parentData.companyName || '',
      playerName: data.playerName || '',
      email: data.email || '',
      age: data.age || '',
      gender: data.gender || '',
      handle: data.handle || '',
      maxConcurrent: parentData.maxConcurrent || DEFAULT_MAX_CONCURRENT,
    };
  }

  // Primary key
  if (data.maxUsages !== undefined && data.maxUsages !== null) {
    const usages = data.usages || 0;
    if (usages >= data.maxUsages) {
      return { ok: false, reason: 'limit_reached' };
    }
  }

  return {
    ok: true,
    code: rawCode,
    type: 'primary',
    companyId: data.companyId || rawCode,
    maxConcurrent: data.maxConcurrent || DEFAULT_MAX_CONCURRENT,
    companyName: data.companyName || '',
    maxUsages: data.maxUsages,
    usages: data.usages || 0
  };
}

/**
 * Validate admin access — primary keys only (password required).
 */
export async function validateAdminAccess(code, password) {
  await authReady;
  const rawCode = (code || '').trim();
  if (!rawCode) return { ok: false, reason: 'invalid' };

  const ref = doc(db, ACCESS_CODES_COLLECTION, rawCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: 'invalid' };
  const data = snap.data();
  if (data.active === false) return { ok: false, reason: 'inactive' };

  const keyType = data.type || 'primary';
  if (keyType === 'secondary') return { ok: false, reason: 'not_primary' };

  if (!data.adminPassword || data.adminPassword !== password) {
    return { ok: false, reason: 'bad_password' };
  }

  const adminEmail = data.adminEmail || `${(data.companyId || rawCode).toLowerCase()}@cogscreen.admin`;
  try {
    await signInAsAdmin(adminEmail, password);
  } catch (e) {
    console.warn('[Admin] Firebase Auth sign-in failed:', e.code);
    return { ok: false, reason: 'auth_failed', email: adminEmail };
  }

  return {
    ok: true,
    code: rawCode,
    type: 'primary',
    companyId: data.companyId || rawCode,
    companyName: data.companyName || ''
  };
}

/**
 * Validate player access — secondary keys only (no password).
 */
export async function validatePlayerAccess(code) {
  await authReady;
  const rawCode = (code || '').trim();
  if (!rawCode) return { ok: false, reason: 'invalid' };

  const ref = doc(db, ACCESS_CODES_COLLECTION, rawCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: 'invalid' };
  const data = snap.data();
  if (data.active === false) return { ok: false, reason: 'inactive' };

  const keyType = data.type || 'primary';
  if (keyType !== 'secondary') return { ok: false, reason: 'not_secondary' };

  if (!data.parentKey) return { ok: false, reason: 'invalid' };
  const parentRef = doc(db, ACCESS_CODES_COLLECTION, data.parentKey);
  const parentSnap = await getDoc(parentRef);
  if (!parentSnap.exists()) return { ok: false, reason: 'parent_invalid' };
  const parentData = parentSnap.data();
  if (parentData.active === false) return { ok: false, reason: 'parent_inactive' };

  return {
    ok: true,
    code: rawCode,
    type: 'secondary',
    parentKey: data.parentKey,
    companyId: data.companyId || parentData.companyId,
    companyName: parentData.companyName || '',
    playerName: data.playerName || '',
    email: data.email || '',
    age: data.age || '',
    gender: data.gender || '',
    handle: data.handle || '',
  };
}

/* ---- Secondary Key CRUD ---- */

export async function createSecondaryKey({ parentCode, companyId, playerName, customCode, email, age, gender, handle }) {
  await authReady;

  const keyCode = customCode
    ? customCode.trim()
    : `PLY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const existingRef = doc(db, ACCESS_CODES_COLLECTION, keyCode);
  try {
    const existingSnap = await getDoc(existingRef);
    if (existingSnap.exists()) {
      return { ok: false, reason: 'exists', code: keyCode };
    }

    await setDoc(existingRef, {
      type: 'secondary',
      parentKey: parentCode,
      companyId: companyId,
      playerName: playerName || '',
      email: email || '',
      age: age ? parseInt(age) : null,
      gender: gender || '',
      handle: handle || '',
      active: true,
      createdAt: serverTimestamp(),
    });

    return { ok: true, code: keyCode };

    return { ok: true, code: keyCode };
  } catch (e) {
    console.error('[SecondaryKey] Firestore error creating key:', e);
    return { ok: false, reason: 'permission_denied', message: e.message };
  }
}

export async function getSecondaryKeys(parentCode) {
  await authReady;
  try {
    const q = query(
      collection(db, ACCESS_CODES_COLLECTION),
      where('parentKey', '==', parentCode),
      where('type', '==', 'secondary')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ code: d.id, ...d.data() }));
  } catch (e) {
    console.error('[SecondaryKey] Firestore error fetching keys:', e);
    return [];
  }
}

export async function revokeSecondaryKey(code) {
  await authReady;
  try {
    const ref = doc(db, ACCESS_CODES_COLLECTION, code);
    await updateDoc(ref, { active: false });
    return { ok: true };
  } catch (e) {
    console.error('[SecondaryKey] Firestore error revoking key:', e);
    return { ok: false, reason: 'permission_denied' };
  }
}

export async function reactivateSecondaryKey(code) {
  await authReady;
  try {
    const ref = doc(db, ACCESS_CODES_COLLECTION, code);
    await updateDoc(ref, { active: true });
    return { ok: true };
  } catch (e) {
    console.error('[SecondaryKey] Firestore error reactivating key:', e);
    return { ok: false, reason: 'permission_denied' };
  }
}

/* ---- Concurrency & Session Management ---- */

async function cleanupWaitlist(sessionId, companyId) {
  const q = query(
    collection(db, WAITLIST_COLLECTION),
    where('sessionId', '==', sessionId),
    where('companyId', '==', companyId)
  );
  const snap = await getDocs(q);
  const deletions = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletions);
}

async function getActiveCount(companyId) {
  const cutoff = getCutoffTimestamp();
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('companyId', '==', companyId),
    where('status', '==', 'active'),
    where('lastSeen', '>=', cutoff)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function ensureAccessAndSession(codeInfo) {
  await authReady;

  const codeRef = doc(db, ACCESS_CODES_COLLECTION, codeInfo.code);
  const codeSnap = await getDoc(codeRef);
  if (!codeSnap.exists()) return { ok: false, reason: 'invalid' };
  const codeData = codeSnap.data();
  if (codeData.active === false) return { ok: false, reason: 'inactive' };

  const keyType = codeData.type || 'primary';
  if (keyType === 'primary' && codeData.maxUsages !== undefined && codeData.maxUsages !== null) {
    const usages = codeData.usages || 0;
    if (usages >= codeData.maxUsages) {
      return { ok: false, reason: 'limit_reached' };
    }
  }

  const sessionId = generateNewSessionId();
  const activeCount = await getActiveCount(codeInfo.companyId);

  if (activeCount >= codeInfo.maxConcurrent) {
    await addDoc(collection(db, WAITLIST_COLLECTION), {
      companyId: codeInfo.companyId,
      code: codeInfo.code,
      sessionId,
      createdAt: serverTimestamp()
    });

    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('companyId', '==', codeInfo.companyId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    const pos = snap.docs.findIndex(d => d.data().sessionId === sessionId) + 1;
    const etaMin = Math.max(1, pos * AVG_SESSION_MIN);

    return { ok: false, waitlist: true, position: pos, etaMin };
  }

  if (keyType === 'primary' && codeData.maxUsages !== undefined && codeData.maxUsages !== null) {
    await updateDoc(codeRef, {
      usages: increment(1)
    });
  }

  await cleanupWaitlist(sessionId, codeInfo.companyId);

  await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
    companyId: codeInfo.companyId,
    code: codeInfo.code,
    status: 'active',
    startedAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  }, { merge: true });

  localStorage.setItem('cogscreen_access_code', codeInfo.code);
  localStorage.setItem('cogscreen_company_id', codeInfo.companyId);

  return { ok: true, sessionId };
}

export function startHeartbeat() {
  const sessionId = localStorage.getItem('cogscreen_session_id');
  if (!sessionId) return;
  stopHeartbeat();

  heartbeatId = setInterval(async () => {
    try {
      await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
        lastSeen: serverTimestamp()
      });
    } catch (e) {
      // no-op
    }
  }, HEARTBEAT_MS);
}

export function stopHeartbeat() {
  if (heartbeatId) clearInterval(heartbeatId);
  heartbeatId = null;
}

export async function endSession(status = 'complete') {
  await authReady;
  const sessionId = localStorage.getItem('cogscreen_session_id');
  if (!sessionId) return;
  try {
    await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
      status,
      lastSeen: serverTimestamp()
    });
  } catch (e) {
    // no-op
  }
}
