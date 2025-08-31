import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCbThUHyA7whoHCiYmzJhcfJwLK3GCXtbY",
  authDomain: "mvek-f636b.firebaseapp.com",
  projectId: "mvek-f636b",
  storageBucket: "mvek-f636b.firebasestorage.app",
  messagingSenderId: "971315050280",
  appId: "1:971315050280:web:806b49a3716faeb23c021d"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig)

// Инициализация сервисов
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { db, auth, storage }