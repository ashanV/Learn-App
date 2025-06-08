import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDnHMkCrMhNfUhCQEpesYwaCTQ3QVoe7VY",
    authDomain: "learn-app-33b45.firebaseapp.com",
    projectId: "learn-app-33b45",
    storageBucket: "learn-app-33b45.firebasestorage.app",
    messagingSenderId: "334478568934",
    appId: "1:334478568934:web:57d91e613c60985a587a27",
    measurementId: "G-JRC3KVR7QH"
  };

// Firebase Initialization
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);