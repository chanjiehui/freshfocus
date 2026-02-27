import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBma1uWNwnZPCuG0Z2DrnUBgi3X5ofCNAo",
    authDomain: "freshfocus-131bc.firebaseapp.com",
    projectId: "freshfocus-131bc",
    storageBucket: "freshfocus-131bc.appspot.com",
    messagingSenderId: "803758226501",
    appId: "1:803758226501:web:e26d722364b97044c9b72c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;