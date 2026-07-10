import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDo3PzZFL_3YCs0Fl_WUTJ8j4Lw6dx0XSQ",
  authDomain: "driverapp-4cb59.firebaseapp.com",
  projectId: "driverapp-4cb59",
  storageBucket: "driverapp-4cb59.firebasestorage.app",
  databaseURL: "https://driverapp-4cb59-default-rtdb.firebaseio.com",
  messagingSenderId: "294874049573",
  appId: "1:294874049573:web:a88f375fb35ad1f7c863cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);