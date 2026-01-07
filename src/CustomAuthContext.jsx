import { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { hashString } from './utils/hash';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Loads session
  useEffect(() => {
    const stored = localStorage.getItem("customUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Save session
  useEffect(() => {
    if (user) localStorage.setItem("customUser", JSON.stringify(user));
    else localStorage.removeItem("customUser");
  }, [user]);

  async function login(username, password) {
    setLoading(true);
    let u = null;
    const q = query(collection(db, "users"), where("username", "==", username));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const docUser = qSnap.docs[0].data();
      const hash = await hashString(password);
      if (hash === docUser.passwordHash) {
        u = { username, id: qSnap.docs[0].id };
        setUser(u);
      }
    }
    setLoading(false);
    return u;
  }

  async function signup(username, password) {
    setLoading(true);
    // Check if username exists
    const q = query(collection(db, "users"), where("username", "==", username));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      setLoading(false);
      return null;
    }
    const hash = await hashString(password);
    const docRef = await addDoc(collection(db, "users"), { username, passwordHash: hash });
    const u = { username, id: docRef.id };
    setUser(u);
    setLoading(false);
    return u;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("customUser");
  }

  const value = { user, login, signup, logout, loading, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



