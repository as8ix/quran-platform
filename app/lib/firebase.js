import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyD99w3W0B-myel7exEOIKzC7VTCaAtE0zA",
    authDomain: "alhalaqa-909b7.firebaseapp.com",
    projectId: "alhalaqa-909b7",
    storageBucket: "alhalaqa-909b7.firebasestorage.app",
    messagingSenderId: "143474746560",
    appId: "1:143474746560:web:7fd7c72a7f16b727eab925",
    measurementId: "G-57YJHJ6HZ4"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
