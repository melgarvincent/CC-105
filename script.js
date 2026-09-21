/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
    getDatabase,
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";



/* =====================================================
   FIREBASE CONFIG

   REPLACE THE PLACEHOLDERS WITH YOUR REAL
   FIREBASE PROJECT CONFIG.
===================================================== */

const firebaseConfig = {

    apiKey:
        "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT_ID.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_STORAGE_BUCKET",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};



/* =====================================================
   GOOGLE APPS SCRIPT OTP URL

   PASTE YOUR DEPLOYED /exec URL HERE.
===================================================== */

const OTP_API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";



/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


const db =
    getDatabase(app);



/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginPage =
    document.getElementById(
        "loginPage"
    );


const registerPage =
    document.getElementById(
        "registerPage"
    );


const otpPage =
    document.getElementById(
        "otpPage"
    );


const dashboardPage =
    document.getElementById(
        "dashboardPage"
    );



/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;

let otpExpiresAt = 0;



/* =====================================================
   PAGE SWITCHER
===================================================== */

function showPage(page) {

    loginPage.classList.add(
        "hidden"
    );

    registerPage.classList.add(
        "hidden"
    );

    otpPage.classList.add(
        "hidden"
    );

    dashboardPage.classList.add(
        "hidden"
    );


    page.classList.remove(
        "hidden"
    );
}



/* =====================================================
   REGISTER PAGE
===================================================== */

document
    .getElementById("showRegister")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "registerError"
                )
                .textContent = "";

            showPage(
                registerPage
            );
        }
    );



/* =====================================================
   LOGIN PAGE
===================================================== */

document
    .getElementById("showLogin")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "loginError"
                )
                .textContent = "";

            showPage(
                loginPage
            );
        }
    );



/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async (event) => {

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
                ).value.trim()
                .toLowerCase();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;



            if (
                password.length < 6
            ) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;
            }



            if (
                password !==
                confirmPassword
            ) {

                error.textContent =
                    "Passwords do not match.";

                return;
            }



            try {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;



                await updateProfile(
                    user,
                    {
                        displayName:
                            name
                    }
                );



                /* SAVE USER TO RTDB */

                await set(
                    ref(
                        db,
                        "users/" +
                        user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        name:
                            name,

                        email:
                            email,

                        role:
                            "staff",

                        createdAt:
                            new Date()
                                .toISOString()
                    }
                );



                await signOut(
                    auth
                );


                document
                    .getElementById(
                        "registerForm"
                    )
                    .reset();


                alert(
                    "Registration successful!"
                );


                showPage(
                    loginPage
                );

            }
            catch (error) {

                console.error(
                    error
                );


                document
                    .getElementById(
                        "registerError"
                    )
                    .textContent =
                    firebaseError(
                        error.code
                    );
            }

        }
    );



/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const error =
                document.getElementById(
                    "loginError"
                );


            const button =
                document.getElementById(
                    "loginBtn"
                );


            error.textContent = "";


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim()
                .toLowerCase();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;



            button.disabled = true;

            button.textContent =
                "Checking...";



            try {

                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                currentUser =
                    result.user;



                document
                    .getElementById(
                        "otpEmail"
                    )
                    .textContent =
                    currentUser.email;



                showPage(
                    otpPage
                );


                await sendOTP(
                    currentUser.email
                );

            }
            catch (error) {

                console.error(
                    error
                );


                document
                    .getElementById(
                        "loginError"
                    )
                    .textContent =
                    firebaseError(
                        error.code
                    );

            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Login";
            }

        }
    );



/* =====================================================
   SEND OTP
===================================================== */

async function sendOTP(email) {

    const message =
        document.getElementById(
            "otpMessage"
        );


    const error =
        document.getElementById(
            "otpError"
        );


    error.textContent = "";

    message.textContent =
        "Sending OTP to your Gmail...";



    if (
        OTP_API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

        message.textContent = "";

        error.textContent =
            "OTP service is not configured yet.";

        return;
    }



    try {

        const response =
            await fetch(
                OTP_API_URL,
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            action:
                                "sendOTP",

                            email:
                                email

                        })
                }
            );



        const result =
            await response.json();



        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "OTP failed."
            );
        }



        otpExpiresAt =
            Date.now() +
            (
                5 *
                60 *
                1000
            );


        message.textContent =
            "OTP sent! Check your Gmail Inbox or Spam.";

    }
    catch (error) {

        console.error(
            error
        );


        message.textContent = "";

        document
            .getElementById(
                "otpError"
            )
            .textContent =
            "Unable to send OTP. Check your Apps Script URL.";
    }
}



/* =====================================================
   VERIFY OTP
===================================================== */

document
    .getElementById("otpForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const code =
                document
                    .getElementById(
                        "otpInput"
                    )
                    .value.trim();


            const error =
                document.getElementById(
                    "otpError"
                );


            const message =
                document.getElementById(
                    "otpMessage"
                );


            const button =
                document.getElementById(
                    "verifyOtpBtn"
                );


            error.textContent = "";



            if (
                !/^\d{6}$/.test(
                    code
                )
            ) {

                error.textContent =
                    "Enter exactly 6 numbers.";

                return;
            }



            if (
                Date.now() >
                otpExpiresAt
            ) {

                error.textContent =
                    "OTP expired. Request a new OTP.";

                return;
            }



            if (
                !currentUser
            ) {

                error.textContent =
                    "Session expired. Login again.";

                return;
            }



            button.disabled = true;

            button.textContent =
                "Verifying...";



            try {

                const response =
                    await fetch(
                        OTP_API_URL,
                        {

                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body:
                                JSON.stringify({

                                    action:
                                        "verifyOTP",

                                    email:
                                        currentUser.email,

                                    code:
                                        code

                                })
                        }
                    );



                const result =
                    await response.json();



                if (
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Invalid OTP."
                    );
                }



                message.textContent =
                    "OTP verified successfully!";


                await loadDashboard();



                setTimeout(
                    () => {

                        showPage(
                            dashboardPage
                        );

                    },
                    600
                );

            }
            catch (error) {

                console.error(
                    error
                );


                error =
                    document.getElementById(
                        "otpError"
                    );


                error.textContent =
                    "Invalid OTP.";
            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Verify OTP";
            }

        }
    );



/* =====================================================
   RESEND OTP
===================================================== */

document
    .getElementById("resendOtp")
    .addEventListener(
        "click",
        async () => {

            if (
                currentUser
            ) {

                await sendOTP(
                    currentUser.email
                );
            }

        }
    );



/* =====================================================
   BACK TO LOGIN
===================================================== */

document
    .getElementById("backLogin")
    .addEventListener(
        "click",
        async () => {

            currentUser = null;


            await signOut(
                auth
            );


            showPage(
                loginPage
            );
        }
    );



/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

    if (
        !currentUser
    ) {
        return;
    }



    document
        .getElementById(
            "userName"
        )
        .textContent =
        currentUser.displayName ||
        "Staff";


    document
        .getElementById(
            "userEmail"
        )
        .textContent =
        currentUser.email;



    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "bakeryProducts"
                )
            );



        if (
            !snapshot.exists()
        ) {

            setDashboard(
                0,
                0,
                0,
                0
            );

            return;
        }



        const products =
            snapshot.val();



        let productCount = 0;

        let stockCount = 0;

        let lowCount = 0;

        let totalValue = 0;

        let lowProducts = [];



        Object.values(
            products
        ).forEach(
            product => {

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
                    quantity *
                    price;



                if (
                    quantity <=
                    threshold
                ) {

                    lowCount++;


                    lowProducts.push(
                        product
                    );
                }

            }
        );



        setDashboard(
            productCount,
            stockCount,
            lowCount,
            totalValue
        );


        displayLowStock(
            lowProducts
        );

    }
    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}



/* =====================================================
   DASHBOARD VALUES
===================================================== */

function setDashboard(
    products,
    stock,
    low,
    value
) {

    document
        .getElementById(
            "totalProducts"
        )
        .textContent =
        products;


    document
        .getElementById(
            "totalStock"
        )
        .textContent =
        stock;


    document
        .getElementById(
            "lowStock"
        )
        .textContent =
        low;


    document
        .getElementById(
            "estimatedValue"
        )
        .textContent =
        "₱" +
        Number(value)
            .toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits:
                        2
                }
            );
}



/* =====================================================
   LOW STOCK
===================================================== */

function displayLowStock(
    products
) {

    const box =
        document.getElementById(
            "lowStockList"
        );



    if (
        products.length === 0
    ) {

        box.innerHTML =
            "<p>No low stock products.</p>";

        return;
    }



    box.innerHTML =
        products
            .map(
                product => {

                    return `

                        <div class="low-item">

                            <strong>
                                ${escapeHTML(
                                    product.name ||
                                    "Product"
                                )}
                            </strong>

                            <br>

                            <small>
                                Stock:
                                ${
                                    Number(
                                        product.quantity
                                    ) || 0
                                }
                            </small>

                        </div>

                    `;
                }
            )
            .join("");
}



/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            await signOut(
                auth
            );


            currentUser = null;


            document
                .getElementById(
                    "loginForm"
                )
                .reset();


            showPage(
                loginPage
            );
        }
    );



/* =====================================================
   FIREBASE ERROR HANDLER
===================================================== */

function firebaseError(
    code
) {

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
            return "Password must be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        default:
            return "Authentication failed.";
    }
}



/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}



/* =====================================================
   START
===================================================== */

showPage(
    loginPage
);
