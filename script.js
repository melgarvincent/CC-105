/* ==========================================
   BAKERY INVENTORY SYSTEM
   FIREBASE REALTIME DATABASE
========================================== */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* ==========================================
   FIREBASE CONFIGURATION
========================================== */

const firebaseConfig = {

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"

};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* Database locations */

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");


/* Local array used by the interface */

let products = [];

let activities = [];


/* ==========================================
   LOGIN
========================================== */

document.getElementById("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    // Demo account
    const correctEmail = "admin@bakery.com";
    const correctPassword = "Bakery@123";

    // Check login
    if (email === correctEmail && password === correctPassword) {

        try {

            // Create new login record in Firebase
            const loginRecord = push(
                ref(db, "loginLogs")
            );

            await set(loginRecord, {
                email: email,
                action: "Login",
                dateTime: new Date().toLocaleString()
            });

            // Save login session
            sessionStorage.setItem(
                "bakeryLoggedIn",
                "true"
            );

            sessionStorage.setItem(
                "userEmail",
                email
            );

            // Hide login
            document
                .getElementById("loginPage")
                .classList.add("hidden");

            // Show system
            document
                .getElementById("system")
                .classList.remove("hidden");

            // Update dashboard
            updateDashboard();

            // Clear login form
            document
                .getElementById("loginForm")
                .reset();

            console.log("Login successfully saved to Firebase.");

        } catch (firebaseError) {

            console.error(
                "Firebase Login Error:",
                firebaseError
            );

            error.textContent =
                "Login failed: " +
                firebaseError.message;
        }

    } else {

        error.textContent =
            "Invalid email or password.";

    }

});
