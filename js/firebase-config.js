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

// Check if Firebase is available and initialize it
if (typeof firebase === 'undefined') {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Initialize Services
        window.auth = firebase.auth();
        window.firebaseAvailable = true;
        console.log("Firebase initialized successfully.");

        // Dispatch an event to notify that Firebase is ready
        document.dispatchEvent(new Event('firebaseReady'));
    } catch (error) {
        console.error("Firebase initialization error:", error);
        window.firebaseAvailable = false;
    }
} else {
    console.error("Firebase is not loaded.");
    window.firebaseAvailable = false;
}