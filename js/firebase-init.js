/* ═══════════════════════════════════════════
   BSt Baba - AKSpected | Firebase Init
   ═══════════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyCLw65yB0sPSf5lgSkom27PTN4DrS1CBFc",
  authDomain: "soral-atul-physicism.firebaseapp.com",
  projectId: "soral-atul-physicism",
  storageBucket: "soral-atul-physicism.firebasestorage.app",
  messagingSenderId: "466087894566",
  appId: "1:466087894566:web:1ef20916915ad8024d90e7"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
