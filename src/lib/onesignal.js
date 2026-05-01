import OneSignal from 'react-onesignal'

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const IS_PROD = window.location.hostname === 'vibars.com'

let initialized = false

export async function initOneSignal() {
  if (!APP_ID || !IS_PROD || initialized) return
  initialized = true
  try {
    await OneSignal.init({
      appId: APP_ID,
      safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_ID ?? '',
      notifyButton: { enable: false },
    })
  } catch (_) {}
}

export async function identifyUser(userId) {
  if (!APP_ID || !IS_PROD || !initialized) return
  try { await OneSignal.login(userId) } catch (_) {}
}

export async function requestPermission() {
  if (!APP_ID || !IS_PROD || !initialized) return
  try { await OneSignal.Notifications.requestPermission() } catch (_) {}
}

export async function logoutOneSignal() {
  if (!APP_ID || !IS_PROD || !initialized) return
  try { await OneSignal.logout() } catch (_) {}
}
