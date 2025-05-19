// src/js/auth/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMwJEeBE1tfT-wVPJ8c2lSlEmuqYEuqnY",
  authDomain: "projeto-final-de-curso-425a9.firebaseapp.com",
  projectId: "projeto-final-de-curso-425a9",
  storageBucket: "projeto-final-de-curso-425a9.appspot.com",
  messagingSenderId: "475780755633",
  appId: "1:475780755633:web:6dbf97c6b394134e91f290",
  measurementId: "G-DZ3DNKYQP5"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);

const usersCollection = collection(db, "users");
const appointmentsCollection = collection(db, "appointments");
const medicalRecordsCollection = collection(db, "medicalRecords");

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

const logout = () => signOut(auth);

// Firestore functions
const getUserRole = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  return userDoc.exists() ? userDoc.data().role : null;
};

const createUserProfile = async (user, role) => {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    role: role,
    createdAt: new Date()
  });
};

// Initialize user session listener
const initAuthStateListener = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const role = await getUserRole(user.uid);
      callback({ user, role });
    } else {
      callback(null);
    }
  });
};

export {
  auth,
  db,
  googleProvider,
  signInWithGoogle,
  logout,
  getUserRole,
  createUserProfile,
  initAuthStateListener,
  usersCollection,
  appointmentsCollection,
  medicalRecordsCollection
};