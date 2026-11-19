import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

interface AuthState {
  user: User | null;
  ready: boolean; // false hasta que Firebase informa si hay sesión
  /** true si la cuenta tiene su documento en admins/{UID}. Es solo para mostrar u ocultar pantallas: lo que manda son las reglas de Firestore. */
  isAdmin: boolean;
  adminChecked: boolean; // false mientras se consulta si la cuenta es de administración
  signInEmail: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
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
  ready: false,
  isAdmin: false,
  adminChecked: false,
  signInEmail: async (email, password) => {
    await signInWithEmailAndPassword(services().auth, email, password);
  },
  register: async (name, email, password) => {
    const { user } = await createUserWithEmailAndPassword(services().auth, email, password);
    await updateProfile(user, { displayName: name });
    await saveProfile(user, name);
  },
  signInGoogle: async () => {
    const { user } = await signInWithPopup(services().auth, googleProvider);
    await saveProfile(user);
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
    useAuth.setState({ user, ready: true, isAdmin: false, adminChecked: !user });
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
