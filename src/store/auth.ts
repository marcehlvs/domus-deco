import { create } from "zustand";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

interface AuthState {
  /** Quien tiene sesión: una cuenta o, si compró sin crear cuenta, una sesión de invitada/o (anónima). */
  user: User | null;
  /** true = tiene cuenta (correo o Google). false = sin sesión o invitada/o. Es lo que decide si se muestra «Mi cuenta». */
  member: boolean;
  ready: boolean; // false hasta que Firebase informa si hay sesión
  /** true si la cuenta tiene su documento en admins/{UID}. Es solo para mostrar u ocultar pantallas: lo que manda son las reglas de Firestore. */
  isAdmin: boolean;
  adminChecked: boolean; // false mientras se consulta si la cuenta es de administración
  signInEmail: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  /** Sesión anónima para comprar sin crear cuenta. Devuelve el UID. Si ya hay sesión, devuelve el de esa. */
  signInGuest: () => Promise<string>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

function services() {
  if (!auth || !db) throw Object.assign(new Error("Firebase sin configurar"), { code: "app/not-configured" });
  return { auth, db };
}

// users/{uid}: se crea o completa al entrar. Si falla (por ejemplo, reglas sin publicar), no frena el ingreso.
const saveProfile = (u: User, name?: string) =>
  setDoc(
    doc(services().db, "users", u.uid),
    { email: u.email, name: name ?? u.displayName ?? "", updatedAt: serverTimestamp() },
    { merge: true },
  ).catch((e) => {
    if (import.meta.env.DEV) console.error(e); // en producción no se muestran detalles internos
  });

export const useAuth = create<AuthState>(() => ({
  user: null,
  member: false,
  ready: false,
  isAdmin: false,
  adminChecked: false,
  signInEmail: async (email, password) => {
    await signInWithEmailAndPassword(services().auth, email, password);
  },
  register: async (name, email, password) => {
    const { auth } = services();
    const guest = auth.currentUser?.isAnonymous ? auth.currentUser : null;
    // Si venía de comprar como invitada/o, la cuenta se «convierte» (mismo UID) y sus pedidos aparecen en «Mis pedidos».
    const user = guest
      ? (await linkWithCredential(guest, EmailAuthProvider.credential(email, password))).user
      : (await createUserWithEmailAndPassword(auth, email, password)).user;
    await updateProfile(user, { displayName: name });
    await saveProfile(user, name);
    useAuth.setState({ user, member: true }); // vincular no dispara onAuthStateChanged
  },
  signInGoogle: async () => {
    const { auth } = services();
    const guest = auth.currentUser?.isAnonymous ? auth.currentUser : null;
    let user: User;
    try {
      user = guest ? (await linkWithPopup(guest, googleProvider)).user : (await signInWithPopup(auth, googleProvider)).user;
    } catch (e) {
      // Esa cuenta de Google ya existía: se entra con ella (los pedidos de invitada/o quedan en la sesión anterior).
      const credential = GoogleAuthProvider.credentialFromError(e as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
      if ((e as { code?: string }).code !== "auth/credential-already-in-use" || !credential) throw e;
      user = (await signInWithCredential(auth, credential)).user;
    }
    await saveProfile(user);
    useAuth.setState({ user, member: true });
  },
  signInGuest: async () => {
    const { auth } = services();
    return auth.currentUser?.uid ?? (await signInAnonymously(auth)).user.uid;
  },
  resetPassword: async (email) => {
    await sendPasswordResetEmail(services().auth, email);
  },
  logout: async () => {
    await signOut(services().auth);
  },
}));

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    useAuth.setState({ user, member: !!user && !user.isAnonymous, ready: true, isAdmin: false, adminChecked: !user });
    if (!user || !db) return;
    // La persona puede leer solo su propio documento de «admins» (reglas de Firestore): si existe, es administradora.
    let isAdmin = false;
    try {
      isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
    if (useAuth.getState().user?.uid === user.uid) useAuth.setState({ isAdmin, adminChecked: true });
  });
} else {
  useAuth.setState({ ready: true, adminChecked: true });
}
