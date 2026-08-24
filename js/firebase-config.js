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

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
     console.error("Firebase SDK is not loaded.");
    window.firebaseAvailable = false;
}

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize services
    window.firebase = firebase;
    window.auth = firebase.auth();
    window.firebaseAvailable = true;
    console.log("Firebase initialized successfully");

    document.dispatchEvent(new Event('firebaseReady'));
} catch (error) {
    console.error("Firebase initialization failed:", error);
    window.firebaseAvailable = false;
}