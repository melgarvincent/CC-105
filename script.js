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

document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        const error =
            document
                .getElementById("loginError");

        error.textContent = "";


        // DEMO ACCOUNT
        const correctEmail = "admin@bakery.com";
        const correctPassword = "Bakery@123";


        // CHECK LOGIN
        if (
            email === correctEmail &&
            password === correctPassword
        ) {

            try {

                /* =========================
                   SAVE LOGIN TO FIREBASE
                ========================= */

                const loginRef =
                    push(
                        ref(db, "loginLogs")
                    );


                await set(
                    loginRef,
                    {
                        email: email,
                        action: "Login",
                        dateTime:
                            new Date().toLocaleString()
                    }
                );


                /* =========================
                   SAVE SESSION
                ========================= */

                sessionStorage.setItem(
                    "bakeryLoggedIn",
                    "true"
                );

                sessionStorage.setItem(
                    "userEmail",
                    email
                );


                /* =========================
                   SHOW SYSTEM
                ========================= */

                document
                    .getElementById("loginPage")
                    .classList.add("hidden");

                document
                    .getElementById("system")
                    .classList.remove("hidden");


                /* =========================
                   UPDATE DASHBOARD
                ========================= */

                updateDashboard();


                /* =========================
                   CLEAR FORM
                ========================= */

                document
                    .getElementById("loginForm")
                    .reset();


                console.log(
                    "Login saved to Firebase."
                );


            } catch (firebaseError) {

                console.error(
                    "Firebase Error:",
                    firebaseError
                );

                error.textContent =
                    "Firebase Error: " +
                    firebaseError.message;

            }

        } else {

            error.textContent =
                "Invalid email or password.";

        }

    });
