// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKl1XvPPt9iEtcRYlhbUbZk7B8fmDgroo",
  authDomain: "new-journey-shop.firebaseapp.com",
  databaseURL: "https://new-journey-shop-default-rtdb.firebaseio.com",
  projectId: "new-journey-shop",
  storageBucket: "new-journey-shop.firebasestorage.app",
  messagingSenderId: "488236854608",
  appId: "1:488236854608:web:756df2f4e743a283ec5055",
  measurementId: "G-KHW4PKN2XE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore settings
db.settings({
  timestampsInSnapshots: true
});
