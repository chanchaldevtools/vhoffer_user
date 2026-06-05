import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD1EBYCLxKYmEU4aKgjiP_CGRqwFl4i33g",
  authDomain: "driverapp-21839.firebaseapp.com",
  projectId: "driverapp-21839",
  databaseURL: "https://driverapp-21839-default-rtdb.firebaseio.com/",
  storageBucket: "driverapp-21839.firebasestorage.app",
  messagingSenderId: "412454711745",
  appId: "1:412454711745:web:4378996f5dc2d14b0d3f40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);