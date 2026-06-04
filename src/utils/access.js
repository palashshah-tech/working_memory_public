/* ============================================================
   Access Control + Concurrency Guard (Firestore) - Public Edition
   ============================================================ */

import { authReady, signInAsAdmin } from './firebase.js';

// Constant admin email to be created in the Firebase console for admin dashboard auth.
const ADMIN_EMAIL = 'admin@cogscreen.public';

function generateNewSessionId() {
  const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  localStorage.setItem('cogscreen_session_id', id);
  return id;
}

export async function validateAccessCode(code) {
  // Public version bypasses validation - always valid
  return {
    ok: true,
    code: 'public',
    companyId: 'public',
    maxConcurrent: 9999,
    companyName: 'Public',
    maxUsages: null,
    usages: 0
  };
}

export async function validateAdminAccess(password) {
  await authReady;

  // Sign into Firebase Auth as the admin so Firestore rules can verify identity.
  // The public database uses a single admin email.
  try {
    await signInAsAdmin(ADMIN_EMAIL, password);
  } catch (e) {
    console.warn('[Admin] Firebase Auth sign-in failed:', e.code);
    return { ok: false, reason: 'auth_failed', email: ADMIN_EMAIL };
  }

  return {
    ok: true,
    code: 'public',
    companyId: 'public',
    companyName: 'Public'
  };
}

export async function ensureAccessAndSession(codeInfo) {
  const sessionId = generateNewSessionId();

  localStorage.setItem('cogscreen_access_code', 'public');
  localStorage.setItem('cogscreen_company_id', 'public');

  return { ok: true, sessionId };
}

export function startHeartbeat() {
  // No-op in public version (no concurrency limits or session tracking needed)
}

export function stopHeartbeat() {
  // No-op in public version
}

export async function endSession(status = 'complete') {
  // No-op in public version
}

