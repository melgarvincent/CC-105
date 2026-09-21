import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================
// IMPORTANT:
// Replace these values with the values from:
// Firebase Console → Project Settings → Your Web App
// =====================================================

const firebaseConfig = {

    apiKey: "PASTE_YOUR_API_KEY_HERE",

    authDomain:
        "crudfirebase-b2a1f-default-rtdb.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "PASTE_YOUR_PROJECT_ID_HERE",

    storageBucket:
        "PASTE_YOUR_STORAGE_BUCKET_HERE",

    messagingSenderId:
        "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",

    appId:
        "PASTE_YOUR_APP_ID_HERE"
};


// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================
// After deploying Apps Script as Web App,
// paste the URL here.
//
// Example:
// https://script.google.com/macros/s/XXXXXXXX/exec
// =====================================================

const OTP_API_URL =
    "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// =====================================================
// ELEMENTS
// =====================================================

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const dashboardPage =
    document.getElementById("dashboardPage");


// Login
const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginError =
    document.getElementById("loginError");


// Register
const registerForm =
    document.getElementById("registerForm");

const registerName =
    document.getElementById("registerName");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const registerError =
    document.getElementById("registerError");


// OTP
const otpForm =
    document.getElementById("otpForm");

const otpInput =
    document.getElementById("otpInput");

const otpEmail =
    document.getElementById("otpEmail");

const otpError =
    document.getElementById("otpError");

const otpMessage =
    document.getElementById("otpMessage");

const resendOtpBtn =
    document.getElementById("resendOtpBtn");


// Dashboard
const dashboardUserName =
    document.getElementById("dashboardUserName");

const dashboardUserEmail =
    document.getElementById("dashboardUserEmail");

const totalProducts =
    document.getElementById("totalProducts");

const totalStock =
    document.getElementById("totalStock");

const lowStock =
    document.getElementById("lowStock");

const estimatedValue =
    document.getElementById("estimatedValue");

const lowStockList =
    document.getElementById("lowStockList");


// =====================================================
// TEMPORARY OTP SESSION
// =====================================================

let pendingUser = null;

let otpExpiresAt = 0;


// =====================================================
// PAGE FUNCTIONS
// =====================================================

function showOnly(page) {

    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    otpPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");

    page.classList.remove("hidden");
}


// =====================================================
// SHOW REGISTER
// =====================================================

document
    .getElementById("showRegisterBtn")
    .addEventListener("click", () => {

        registerError.textContent = "";

        showOnly(registerPage);
    });


// =====================================================
// SHOW LOGIN
// =====================================================

document
    .getElementById("showLoginBtn")
    .addEventListener("click", () => {

        loginError.textContent = "";

        showOnly(loginPage);
    });


// =====================================================
// REGISTER
// =====================================================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    registerError.textContent = "";

    const name =
        registerName.value.trim();

    const email =
        registerEmail.value.trim();

    const password =
        registerPassword.value;

    const confirm =
        confirmPassword.value;


    if (password.length < 6) {

        registerError.textContent =
            "Password must be at least 6 characters.";

        return;
    }


    if (password !== confirm) {

        registerError.textContent =
            "Passwords do not match.";

        return;
    }


    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        await updateProfile(user, {
            displayName: name
        });


        // Save profile to RTDB
        await set(
            ref(db, "users/" + user.uid),
            {
                uid: user.uid,
                name: name,
                email: email,
                role: "staff",
                createdAt: new Date().toISOString()
            }
        );


        alert(
            "Registration successful! You can now login."
        );


        await signOut(auth);

        registerForm.reset();

        showOnly(loginPage);

    } catch (error) {

        console.error(error);

        registerError.textContent =
            firebaseErrorMessage(error.code);
    }
});


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        loginError.textContent =
            "Please enter your email and password.";

        return;
    }


    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        pendingUser =
            credential.user;


        // Show OTP screen
        otpEmail.textContent =
            pendingUser.email;


        showOnly(otpPage);


        // Send OTP to Gmail
        await sendOTP(pendingUser.email);

    } catch (error) {

        console.error(error);

        loginError.textContent =
            firebaseErrorMessage(error.code);
    }
});


// =====================================================
// SEND OTP
// =====================================================

async function sendOTP(email) {

    otpError.textContent = "";
    otpMessage.textContent = "";

    if (
        !OTP_API_URL ||
        OTP_API_URL.includes("PASTE_YOUR")
    ) {

        otpError.textContent =
            "OTP service is not configured yet.";

        return;
    }


    try {

        otpMessage.textContent =
            "Sending verification code...";


        const response =
            await fetch(OTP_API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({
                    action: "sendOTP",
                    email: email
                })
            });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to send OTP."
            );
        }


        otpMessage.textContent =
            "OTP sent! Check your Gmail inbox or spam folder.";

        otpInput.value = "";

        otpInput.focus();


        // OTP expires after 5 minutes
        otpExpiresAt =
            Date.now() + (5 * 60 * 1000);

    } catch (error) {

        console.error(error);

        otpMessage.textContent = "";

        otpError.textContent =
            "Could not send OTP. Please try again.";
    }
}


// =====================================================
// VERIFY OTP
// =====================================================

otpForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    otpError.textContent = "";

    otpMessage.textContent = "";


    const code =
        otpInput.value.trim();


    if (!/^\d{6}$/.test(code)) {

        otpError.textContent =
            "Please enter the 6-digit OTP.";

        return;
    }


    if (Date.now() > otpExpiresAt) {

        otpError.textContent =
            "OTP has expired. Please request a new OTP.";

        return;
    }


    if (!pendingUser) {

        otpError.textContent =
            "Login session expired. Please login again.";

        return;
    }


    try {

        const response =
            await fetch(OTP_API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({

                    action: "verifyOTP",

                    email:
                        pendingUser.email,

                    code: code
                })
            });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Invalid OTP."
            );
        }


        // OTP verified
        otpMessage.textContent =
            "Verification successful!";


        await loadDashboard(pendingUser);


        setTimeout(() => {

            showOnly(dashboardPage);

        }, 500);


    } catch (error) {

        console.error(error);

        otpError.textContent =
            error.message ||
            "Invalid or expired OTP.";
    }
});


// =====================================================
// RESEND OTP
// =====================================================

resendOtpBtn.addEventListener(
    "click",
    async () => {

        if (!pendingUser) {

            otpError.textContent =
                "Please login again.";

            return;
        }


        await sendOTP(
            pendingUser.email
        );
    }
);


// =====================================================
// BACK TO LOGIN
// =====================================================

document
    .getElementById("backToLoginBtn")
    .addEventListener("click", async () => {

        pendingUser = null;

        await signOut(auth);

        showOnly(loginPage);
    });


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard(user) {

    dashboardUserName.textContent =
        user.displayName ||
        "Staff";

    dashboardUserEmail.textContent =
        user.email;


    try {

        const productsSnapshot =
            await get(
                ref(db, "bakeryProducts")
            );


        if (!productsSnapshot.exists()) {

            totalProducts.textContent = "0";
            totalStock.textContent = "0";
            lowStock.textContent = "0";
            estimatedValue.textContent = "₱0.00";

            lowStockList.innerHTML =
                `<p class="empty">
                    No products available.
                 </p>`;

            return;
        }


        const products =
            productsSnapshot.val();


        let productCount = 0;
        let stockCount = 0;
        let lowStockCount = 0;
        let totalValue = 0;

        let lowProducts = [];


        Object.values(products).forEach(product => {

            productCount++;


            const quantity =
                Number(product.quantity) || 0;


            const price =
                Number(product.price) || 0;


            const threshold =
                Number(product.threshold) || 5;


            stockCount += quantity;

            totalValue +=
                quantity * price;


            if (quantity <= threshold) {

                lowStockCount++;

                lowProducts.push(product);
            }
        });


        totalProducts.textContent =
            productCount;


        totalStock.textContent =
            stockCount;


        lowStock.textContent =
            lowStockCount;


        estimatedValue.textContent =
            "₱" +
            totalValue.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2
                }
            );


        displayLowStock(lowProducts);


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


// =====================================================
// LOW STOCK DISPLAY
// =====================================================

function displayLowStock(products) {

    if (products.length === 0) {

        lowStockList.innerHTML =
            `<p class="empty">
                No low stock products.
             </p>`;

        return;
    }


    lowStockList.innerHTML =
        products.map(product => {

            return `
                <div style="
                    padding:12px;
                    margin-bottom:8px;
                    border-radius:8px;
                    background:#fff4ed;
                ">
                    <strong>
                        ${escapeHTML(
                            product.name || "Product"
                        )}
                    </strong>

                    <br>

                    <small>
                        Stock:
                        ${Number(product.quantity) || 0}
                    </small>
                </div>
            `;

        }).join("");
}


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

            pendingUser = null;

            loginForm.reset();

            showOnly(loginPage);

        } catch (error) {

            console.error(error);
        }
    });


// =====================================================
// FIREBASE AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        // IMPORTANT:
        // Do NOT automatically open dashboard here.
        // The OTP must be verified first.

        if (!user && !pendingUser) {

            showOnly(loginPage);
        }
    }
);


// =====================================================
// FIREBASE ERROR MESSAGES
// =====================================================

function firebaseErrorMessage(code) {

    switch (code) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/email-already-in-use":
            return "Email is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return "Authentication error. Please try again.";
    }
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
