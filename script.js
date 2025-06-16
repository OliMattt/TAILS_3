// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApy0sgyM4IKkck8Nd73MRDytnPFNQuyz8",
  authDomain: "tails-83c9b.firebaseapp.com",
  projectId: "tails-83c9b",
  storageBucket: "tails-83c9b.firebasestorage.app",
  messagingSenderId: "922643423199",
  appId: "1:922643423199:web:25e1921848f2d0ee52ee6a",
  measurementId: "G-736Q7K555P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);