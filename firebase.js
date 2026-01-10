// Firebase configuration and initialization
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

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firebase authentication state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User signed in:", user.email);
    
    // Check if user is admin
    checkAdminStatus(user.uid);
    
    // Update UI
    updateAuthUI(user);
    
    // Load user cart
    loadUserCart(user.uid);
  } else {
    // User is signed out
    console.log("User signed out");
    updateAuthUI(null);
  }
});

// Check if user is admin
async function checkAdminStatus(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        // Show admin link if user is admin
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
          adminLink.style.display = 'inline-block';
        }
      }
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
  }
}

// Update authentication UI
function updateAuthUI(user) {
  const authButtons = document.getElementById('authButtons');
  const userProfile = document.getElementById('userProfile');
  
  if (authButtons && userProfile) {
    if (user) {
      // User is logged in
      authButtons.style.display = 'none';
      userProfile.style.display = 'flex';
      
      // Update user name
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email.split('@')[0];
      }
    } else {
      // User is logged out
      authButtons.style.display = 'flex';
      userProfile.style.display = 'none';
    }
  }
}

// Export Firebase services
export { auth, db, storage };
