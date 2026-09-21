import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT_ID.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT_ID.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================

const OTP_API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


// =====================================================
// FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);


// =====================================================
// PAGES
// =====================================================

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const dashboardPage =
    document.getElementById("dashboardPage");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let otpExpiration = 0;


// =====================================================
// PAGE SWITCH
// =====================================================

function showPage(page) {

    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    otpPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");

    page.classList.remove("hidden");
}


// =====================================================
// LOGIN / REGISTER SWITCH
// =====================================================

document
    .getElementById("showRegister")
    .onclick = () => {

        document.getElementById("loginError")
            .textContent = "";

        showPage(registerPage);
    };


document
    .getElementById("showLogin")
    .onclick = () => {

        document.getElementById("registerError")
            .textContent = "";

        showPage(loginPage);
    };


document
    .getElementById("backLogin")
    .onclick = async () => {

        currentUser = null;

        await signOut(auth);

        showPage(loginPage);
    };


// =====================================================
// REGISTER
// =====================================================

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const error =
                document.getElementById(
                    "registerError"
                );

            error.textContent = "";

            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();

            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "registerPassword"
                ).value;

            const confirm =
                document.getElementById(
                    "confirmPassword"
                ).value;


            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            if (password !== confirm) {

                error.textContent =
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


                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                await set(
                    ref(
                        db,
                        "users/" + user.uid
                    ),
                    {
                        uid: user.uid,
                        name: name,
                        email: email,
                        role: "staff",
                        createdAt:
                            new Date().toISOString()
                    }
                );


                await signOut(auth);


                document
                    .getElementById("registerForm")
                    .reset();


                alert(
                    "Registration successful!"
                );


                showPage(loginPage);


            } catch (e) {

                console.error(e);

                error.textContent =
                    firebaseError(e.code);
            }
        }
    );


// =====================================================
// LOGIN
// =====================================================

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const error =
                document.getElementById(
                    "loginError"
                );

            error.textContent = "";


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            try {

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                currentUser =
                    credential.user;


                document
                    .getElementById(
                        "otpEmail"
                    )
                    .textContent =
                    currentUser.email;


                showPage(otpPage);


                await sendOTP(
                    currentUser.email
                );


            } catch (e) {

                console.error(e);

                error.textContent =
                    firebaseError(e.code);
            }
        }
    );


// =====================================================
// SEND OTP
// =====================================================

async function sendOTP(email) {

    const error =
        document.getElementById(
            "otpError"
        );

    const message =
        document.getElementById(
            "otpMessage"
        );


    error.textContent = "";

    message.textContent =
        "Sending OTP...";


    if (
        OTP_API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

        error.textContent =
            "Please configure the Google Apps Script URL in script.js.";

        message.textContent = "";

        return;
    }


    try {

        const response =
            await fetch(
                OTP_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body: JSON.stringify({

                        action: "sendOTP",

                        email: email

                    })
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );
        }


        otpExpiration =
            Date.now() +
            5 * 60 * 1000;


        message.textContent =
            "OTP sent to your Gmail. Check Inbox or Spam.";

    } catch (e) {

        console.error(e);

        message.textContent = "";

        error.textContent =
            "Unable to send OTP.";
    }
}


// =====================================================
// VERIFY OTP
// =====================================================

document
    .getElementById("otpForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const code =
                document.getElementById(
                    "otpInput"
                ).value.trim();


            const error =
                document.getElementById(
                    "otpError"
                );

            const message =
                document.getElementById(
                    "otpMessage"
                );


            error.textContent = "";
            message.textContent = "";


            if (!/^\d{6}$/.test(code)) {

                error.textContent =
                    "Enter the 6-digit OTP.";

                return;
            }


            if (
                Date.now() >
                otpExpiration
            ) {

                error.textContent =
                    "OTP expired. Please resend.";

                return;
            }


            try {

                const response =
                    await fetch(
                        OTP_API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body: JSON.stringify({

                                action: "verifyOTP",

                                email:
                                    currentUser.email,

                                code: code

                            })
                        }
                    );


                const result =
                    await response.json();


                if (!result.success) {

                    throw new Error(
                        result.message
                    );
                }


                message.textContent =
                    "OTP verified!";


                await loadDashboard();


                setTimeout(
                    () => {

                        showPage(
                            dashboardPage
                        );

                    },
                    500
                );


            } catch (e) {

                console.error(e);

                error.textContent =
                    e.message ||
                    "Invalid OTP.";
            }
        }
    );


// =====================================================
// RESEND OTP
// =====================================================

document
    .getElementById("resendOtp")
    .onclick = async () => {

        if (!currentUser) {

            showPage(loginPage);

            return;
        }


        await sendOTP(
            currentUser.email
        );
    };


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    if (!currentUser) return;


    document
        .getElementById("userName")
        .textContent =
        currentUser.displayName ||
        "Staff";


    document
        .getElementById("userEmail")
        .textContent =
        currentUser.email;


    try {

        const snapshot =
            await get(
                ref(db, "bakeryProducts")
            );


        if (!snapshot.exists()) {

            document
                .getElementById(
                    "totalProducts"
                )
                .textContent = "0";

            document
                .getElementById(
                    "totalStock"
                )
                .textContent = "0";

            document
                .getElementById(
                    "lowStock"
                )
                .textContent = "0";

            document
                .getElementById(
                    "estimatedValue"
                )
                .textContent = "₱0.00";

            return;
        }


        const products =
            snapshot.val();


        let productCount = 0;

        let stockCount = 0;

        let lowCount = 0;

        let totalValue = 0;

        let lowProducts = [];


        Object.values(products)
            .forEach(product => {

                productCount++;


                const quantity =
                    Number(
                        product.quantity
                    ) || 0;


                const price =
                    Number(
                        product.price
                    ) || 0;


                const threshold =
                    Number(
                        product.threshold
                    ) || 5;


                stockCount +=
                    quantity;


                totalValue +=
                    quantity * price;


                if (
                    quantity <=
                    threshold
                ) {

                    lowCount++;

                    lowProducts.push(
                        product
                    );
                }
            });


        document
            .getElementById(
                "totalProducts"
            )
            .textContent =
            productCount;


        document
            .getElementById(
                "totalStock"
            )
            .textContent =
            stockCount;


        document
            .getElementById(
                "lowStock"
            )
            .textContent =
            lowCount;


        document
            .getElementById(
                "estimatedValue"
            )
            .textContent =
            "₱" +
            totalValue.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2
                }
            );


        displayLowStock(
            lowProducts
        );


    } catch (e) {

        console.error(
            "Dashboard error:",
            e
        );
    }
}


// =====================================================
// LOW STOCK
// =====================================================

function displayLowStock(products) {

    const box =
        document.getElementById(
            "lowStockList"
        );


    if (products.length === 0) {

        box.innerHTML =
            "<p>No low stock products.</p>";

        return;
    }


    box.innerHTML =
        products.map(
            product => {

                return `
                    <div style="
                        padding:12px;
                        margin-bottom:8px;
                        background:#fff3e8;
                        border-radius:8px;
                    ">

                        <strong>
                            ${product.name || "Product"}
                        </strong>

                        <br>

                        <small>
                            Stock:
                            ${product.quantity || 0}
                        </small>

                    </div>
                `;
            }
        ).join("");
}


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    .onclick = async () => {

        await signOut(auth);

        currentUser = null;

        showPage(loginPage);
    };


// =====================================================
// FIREBASE ERROR
// =====================================================

function firebaseError(code) {

    switch (code) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-email":
            return "Invalid email.";

        case "auth/email-already-in-use":
            return "Email already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        default:
            return "Login failed. Please try again.";
    }
}


// =====================================================
// START
// =====================================================

showPage(loginPage);
