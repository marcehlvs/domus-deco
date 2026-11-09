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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

interface AuthState {
  user: User | null;
  ready: boolean; // false hasta que Firebase informa si hay sesión
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
  ).catch(console.error);

export const useAuth = create<AuthState>(() => ({
  user: null,
  ready: false,
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
  onAuthStateChanged(auth, (user) => useAuth.setState({ user, ready: true }));
} else {
  useAuth.setState({ ready: true });
}
