// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-auth-5ed57.firebaseapp.com",
  projectId: "mern-auth-5ed57",
  storageBucket: "mern-auth-5ed57.appspot.com",
  messagingSenderId: "270895481613",
  appId: "1:270895481613:web:8045d600af4dad56c82644",
};

export const app = initializeApp(firebaseConfig);
