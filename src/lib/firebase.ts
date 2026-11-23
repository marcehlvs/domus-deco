import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Si falta .env.local, la tienda sigue funcionando (sin ingreso) en vez de quedar en blanco.
const app = config.apiKey && config.projectId ? initializeApp(config) : undefined;

// App Check: comprueba (con reCAPTCHA Enterprise / Fraud Defense, sin que la persona haga nada) que los pedidos a Auth y Firestore vienen de tu sitio y no de un bot.
// Solo se activa si cargás VITE_RECAPTCHA_SITE_KEY. Hasta que lo «hagas cumplir» en la consola de Firebase, no bloquea a nadie.
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (app && siteKey) {
  // En desarrollo (localhost) Firebase imprime un token de depuración en la consola para registrarlo.
  if (import.meta.env.DEV) (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
}

export const auth = app ? getAuth(app) : undefined;
export const db = app ? getFirestore(app) : undefined;
export const googleProvider = new GoogleAuthProvider();
