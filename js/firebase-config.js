// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCJmxjuXVdY5TxvVEfbjJold1EhQnms3Mc",
    authDomain: "levantra-web-project.firebaseapp.com",
    projectId: "levantra-web-project",
    storageBucket: "levantra-web-project.firebasestorage.app",
    messagingSenderId: "235705809875",
    appId: "1:235705809875:web:68122192b2fce56ed74d26",
    measurementId: "G-BZZQRLXJMH"
};

window.LEVANTRA_FIREBASE_CONFIG = firebaseConfig;
window.firebaseConfig = firebaseConfig;

// Check if Firebase is available and initialize it
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }

        window.firebase = firebase;
        window.firebaseApp = firebase.apps[0] || firebase.app();
        window.auth = firebase.auth();
        console.log("Firebase initialized successfully.");

        // Dispatch an event to notify that Firebase has been initialized
        document.dispatchEvent(new Event('firebaseInitialized'));
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
} else {
    console.error("Firebase SDK is not loaded.");
}