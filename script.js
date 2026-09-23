/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc",

    authDomain:
        "crudfirebase-b2a1f.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com",

    projectId:
        "crudfirebase-b2a1f",

    storageBucket:
        "crudfirebase-b2a1f.firebasestorage.app",

    messagingSenderId:
        "383674756572",

    appId:
        "1:383674756572:web:0585f268fb2cc8f5a6b319",

    measurementId:
        "G-QJXMR8ZQH8"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================================
   FIREBASE CLOUD FUNCTIONS
========================================================= */

const functions = getFunctions(
    app,
    "us-central1"
);


const sendOtpFunction =
    httpsCallable(functions, "sendOtp");


const verifyOtpFunction =
    httpsCallable(functions, "verifyOtp");


const clearOtpFunction =
    httpsCallable(functions, "clearOtpVerification");


/* =========================================================
   DOM
========================================================= */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const appPage =
    document.getElementById("appPage");


/* =========================================================
   AUTH ELEMENTS
========================================================= */

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const otpForm =
    document.getElementById("otpForm");

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

const showLoginBtn =
    document.getElementById("showLoginBtn");

const cancelOtpBtn =
    document.getElementById("cancelOtpBtn");

const resendOtpBtn =
    document.getElementById("resendOtpBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================================================
   MESSAGES
========================================================= */

const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");

const otpMessage =
    document.getElementById("otpMessage");


/* =========================================================
   OTP VARIABLES
========================================================= */

let otpTimerInterval = null;

let otpSecondsRemaining = 300;

let resendSecondsRemaining = 60;

let otpChallengeActive = false;


/* =========================================================
   PRODUCT DATA
========================================================= */

let products = {};


/* =========================================================
   HELPER
========================================================= */

function showOnly(page) {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    appPage.classList.add("hidden");

    page.classList.remove("hidden");
}


function setMessage(element, message, type = "info") {

    element.textContent = message;

    element.className =
        `auth-message ${type}`;
}


function clearMessages() {

    setMessage(loginMessage, "");

    setMessage(registerMessage, "");

    setMessage(otpMessage, "");
}


function formatPeso(value) {

    return Number(value || 0).toLocaleString(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    );
}


function formatDate(timestamp) {

    if (!timestamp) {
        return "Unknown date";
    }

    return new Date(timestamp).toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

function getFirebaseErrorMessage(error) {

    const code = error?.code || "";

    switch (code) {

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        case "functions/unauthenticated":
            return "Please login first.";

        case "functions/resource-exhausted":
            return "Please wait before requesting another OTP.";

        case "functions/invalid-argument":
            return error?.message ||
                "Invalid OTP.";

        default:
            return error?.message ||
                "Something went wrong.";
    }
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearMessages();

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

        const loginBtn =
            document.getElementById("loginBtn");


        if (!email || !password) {

            setMessage(
                loginMessage,
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        try {

            loginBtn.disabled = true;

            loginBtn.textContent =
                "LOGGING IN...";


            /*
             * FIRST SECURITY STEP:
             * Email + Password
             */

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            /*
             * SECOND SECURITY STEP:
             * Send OTP to Gmail
             */

            await sendOtp();


            showOtpPage(email);


            setMessage(
                otpMessage,
                "OTP sent to your email.",
                "success"
            );


        } catch (error) {

            console.error(
                "Login / OTP Error:",
                error
            );


            /*
             * If OTP sending failed,
             * logout the authenticated user.
             */

            try {
                await signOut(auth);
            } catch (logoutError) {
                console.error(logoutError);
            }


            showOnly(loginPage);


            setMessage(
                loginMessage,
                getFirebaseErrorMessage(error),
                "error"
            );


        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "LOGIN";
        }

    }
);


/* =========================================================
   SEND OTP
========================================================= */

async function sendOtp() {

    const result =
        await sendOtpFunction({});


    const data =
        result.data || {};


    otpChallengeActive = true;


    startOtpTimer(
        Number(data.expiresInSeconds || 300)
    );


    startResendTimer(
        Number(data.resendInSeconds || 60)
    );


    return data;
}


/* =========================================================
   SHOW OTP PAGE
========================================================= */

function showOtpPage(email) {

    showOnly(otpPage);


    document
        .getElementById("otpEmailDisplay")
        .textContent = email;


    document
        .getElementById("otpInput")
        .value = "";


    setMessage(
        otpMessage,
        "",
        "info"
    );


    setTimeout(() => {

        document
            .getElementById("otpInput")
            .focus();

    }, 200);

}


/* =========================================================
   OTP TIMER
========================================================= */

function startOtpTimer(seconds) {

    clearInterval(otpTimerInterval);


    otpSecondsRemaining =
        Number(seconds);


    updateOtpTimer();


    otpTimerInterval =
        setInterval(
            () => {

                otpSecondsRemaining--;

                updateOtpTimer();


                if (
                    otpSecondsRemaining <= 0
                ) {

                    clearInterval(
                        otpTimerInterval
                    );

                    otpChallengeActive = false;

                    setMessage(
                        otpMessage,
                        "OTP expired. Please request a new OTP.",
                        "error"
                    );

                }

            },
            1000
        );
}


function updateOtpTimer() {

    const timer =
        document.getElementById(
            "otpTimer"
        );


    if (
        otpSecondsRemaining <= 0
    ) {

        timer.textContent =
            "OTP expired.";

        return;
    }


    const minutes =
        Math.floor(
            otpSecondsRemaining / 60
        );

    const seconds =
        otpSecondsRemaining % 60;


    timer.textContent =
        `OTP expires in ${
            String(minutes).padStart(2, "0")
        }:${
            String(seconds).padStart(2, "0")
        }`;
}


/* =========================================================
   RESEND TIMER
========================================================= */

let resendTimerInterval = null;


function startResendTimer(seconds) {

    clearInterval(
        resendTimerInterval
    );


    resendSecondsRemaining =
        Number(seconds);


    resendOtpBtn.disabled = true;

    updateResendButton();


    resendTimerInterval =
        setInterval(
            () => {

                resendSecondsRemaining--;

                updateResendButton();


                if (
                    resendSecondsRemaining <= 0
                ) {

                    clearInterval(
                        resendTimerInterval
                    );

                    resendOtpBtn.disabled =
                        false;

                    resendOtpBtn.textContent =
                        "Resend OTP";

                }

            },
            1000
        );
}


function updateResendButton() {

    if (
        resendSecondsRemaining > 0
    ) {

        resendOtpBtn.textContent =
            `Resend OTP (${resendSecondsRemaining}s)`;

    } else {

        resendOtpBtn.textContent =
            "Resend OTP";
    }
}


/* =========================================================
   VERIFY OTP
========================================================= */

otpForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const otp =
            document
                .getElementById("otpInput")
                .value
                .trim();


        if (!/^\d{6}$/.test(otp)) {

            setMessage(
                otpMessage,
                "Enter the 6-digit OTP.",
                "error"
            );

            return;
        }


        const verifyBtn =
            document.getElementById(
                "verifyOtpBtn"
            );


        try {

            verifyBtn.disabled = true;

            verifyBtn.textContent =
                "VERIFYING...";


            const result =
                await verifyOtpFunction({
                    otp: otp
                });


            if (
                !result.data ||
                result.data.success !== true
            ) {

                throw new Error(
                    "OTP verification failed."
                );

            }


            /*
             * Refresh Firebase ID token
             * so otpVerified custom claim
             * becomes available.
             */

            if (auth.currentUser) {

                await auth.currentUser
                    .getIdToken(true);

            }


            otpChallengeActive = false;


            clearInterval(
                otpTimerInterval
            );


            clearInterval(
                resendTimerInterval
            );


            setMessage(
                otpMessage,
                "Verification successful!",
                "success"
            );


            /*
             * NOW OPEN DASHBOARD
             */

            setTimeout(
                async () => {

                    showApp();

                    await loadProducts();

                    await loadActivityLogs();

                    updateDashboard();

                },
                400
            );


        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );


            setMessage(
                otpMessage,
                getFirebaseErrorMessage(error),
                "error"
            );


        } finally {

            verifyBtn.disabled = false;

            verifyBtn.textContent =
                "VERIFY OTP";
        }

    }
);


/* =========================================================
   RESEND OTP
========================================================= */

resendOtpBtn.addEventListener(
    "click",
    async function () {

        if (
            resendSecondsRemaining > 0
        ) {
            return;
        }


        try {

            resendOtpBtn.disabled = true;

            resendOtpBtn.textContent =
                "SENDING...";


            await sendOtp();


            setMessage(
                otpMessage,
                "A new OTP has been sent.",
                "success"
            );


        } catch (error) {

            console.error(error);


            resendOtpBtn.disabled = false;


            setMessage(
                otpMessage,
                getFirebaseErrorMessage(error),
                "error"
            );

        }

    }
);


/* =========================================================
   CANCEL OTP
========================================================= */

cancelOtpBtn.addEventListener(
    "click",
    async function () {

        try {

            if (auth.currentUser) {

                await clearOtpFunction({});

            }

        } catch (error) {

            console.error(
                "Clear OTP error:",
                error
            );

        }


        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }


        otpChallengeActive = false;


        clearInterval(
            otpTimerInterval
        );


        clearInterval(
            resendTimerInterval
        );


        showOnly(loginPage);

        clearMessages();

    }
);


/* =========================================================
   REGISTER
========================================================= */

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearMessages();


        const name =
            document
                .getElementById("registerName")
                .value
                .trim();


        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "registerConfirmPassword"
                )
                .value;


        const registerBtn =
            document.getElementById(
                "registerBtn"
            );


        if (
            password !== confirmPassword
        ) {

            setMessage(
                registerMessage,
                "Passwords do not match.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            setMessage(
                registerMessage,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }


        try {

            registerBtn.disabled = true;

            registerBtn.textContent =
                "CREATING ACCOUNT...";


            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            /*
             * Save profile to RTDB
             */

            await set(
                ref(
                    db,
                    `users/${user.uid}`
                ),
                {
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: Date.now()
                }
            );


            /*
             * Activity log is optional.
             * If security rules block it before OTP,
             * the account will still be created.
             */

            try {

                await addActivity(
                    `New account registered: ${email}`
                );

            } catch (activityError) {

                console.warn(
                    "Registration activity log skipped.",
                    activityError
                );

            }


            /*
             * Logout after registration.
             * User must login and complete OTP.
             */

            await signOut(auth);


            registerForm.reset();


            showOnly(loginPage);


            document
                .getElementById("loginEmail")
                .value = email;


            setMessage(
                loginMessage,
                "Account created successfully. Please login.",
                "success"
            );


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            setMessage(
                registerMessage,
                getFirebaseErrorMessage(error),
                "error"
            );

        } finally {

            registerBtn.disabled = false;

            registerBtn.textContent =
                "SIGN UP";
        }

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPasswordBtn.addEventListener(
    "click",
    async function () {

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        if (!email) {

            setMessage(
                loginMessage,
                "Enter your email first.",
                "error"
            );

            return;
        }


        try {

            forgotPasswordBtn.disabled =
                true;


            await sendPasswordResetEmail(
                auth,
                email
            );


            setMessage(
                loginMessage,
                "Password reset email sent. Check your Gmail.",
                "success"
            );


        } catch (error) {

            console.error(error);


            setMessage(
                loginMessage,
                getFirebaseErrorMessage(error),
                "error"
            );


        } finally {

            forgotPasswordBtn.disabled =
                false;
        }

    }
);


/* =========================================================
   SHOW REGISTER
========================================================= */

showRegisterBtn.addEventListener(
    "click",
    function () {

        clearMessages();

        showOnly(registerPage);

    }
);


/* =========================================================
   SHOW LOGIN
========================================================= */

showLoginBtn.addEventListener(
    "click",
    function () {

        clearMessages();

        showOnly(loginPage);

    }
);


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    showOnly(appPage);


    if (auth.currentUser) {

        document
            .getElementById(
                "currentUserEmail"
            )
            .textContent =
                auth.currentUser.email || "";

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-item[data-page]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        this.dataset.page;


                    document
                        .querySelectorAll(
                            ".nav-item[data-page]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    this.classList.add(
                        "active"
                    );


                    showContentPage(page);

                }
            );

        }
    );


function showContentPage(page) {

    document
        .querySelectorAll(".content-page")
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );


    const selected =
        document.getElementById(
            `${page}Page`
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );

    }


    const titles = {

        dashboard:
            "Dashboard",

        inventory:
            "Inventory",

        activity:
            "Activity Logs"

    };


    document
        .getElementById("pageTitle")
        .textContent =
            titles[page] || "Dashboard";


    if (page === "dashboard") {

        updateDashboard();

    }


    if (page === "inventory") {

        renderInventory();

    }


    if (page === "activity") {

        loadActivityLogs();

    }

}


/* =========================================================
   DASHBOARD VIEW ALL
========================================================= */

document
    .getElementById(
        "dashboardInventoryBtn"
    )
    .addEventListener(
        "click",
        function () {

            document
                .querySelectorAll(
                    ".nav-item[data-page]"
                )
                .forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


            const inventoryNav =
                document.querySelector(
                    '.nav-item[data-page="inventory"]'
                );


            if (inventoryNav) {

                inventoryNav.classList.add(
                    "active"
                );

            }


            showContentPage(
                "inventory"
            );

        }
    );


/* =========================================================
   INVENTORY DATA
========================================================= */

async function loadProducts() {

    return new Promise(
        resolve => {

            const productsRef =
                ref(
                    db,
                    "bakeryProducts"
                );


            onValue(
                productsRef,
                snapshot => {

                    products =
                        snapshot.val() || {};


                    renderInventory();

                    updateDashboard();

                    resolve();

                },
                {
                    onlyOnce: true
                }
            );

        }
    );
}


/* =========================================================
   RENDER INVENTORY
========================================================= */

function renderInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const search =
        (
            document
                .getElementById(
                    "searchProduct"
                )
                ?.value || ""
        )
        .toLowerCase()
        .trim();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )
            ?.value || "all";


    const entries =
        Object.entries(products);


    const filtered =
        entries.filter(
            ([key, product]) => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const sku =
                    String(
                        product.sku || ""
                    ).toLowerCase();


                const productCategory =
                    String(
                        product.category || ""
                    );


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    sku.includes(search);


                const matchesCategory =
                    category === "all" ||
                    productCategory === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:30px;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(
        ([key, product]) => {

            const quantity =
                Number(
                    product.quantity || 0
                );


            const threshold =
                Number(
                    product.threshold || 0
                );


            const isLow =
                quantity <= threshold;


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${escapeHtml(
                        product.sku || "-"
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(
                            product.name || "-"
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        product.category || "-"
                    )}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ${formatPeso(
                        product.price
                    )}
                </td>

                <td>
                    <span class="status ${
                        isLow
                            ? "low-stock"
                            : "in-stock"
                    }">
                        ${
                            isLow
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }
                    </span>
                </td>

                <td>

                    <button
                        class="action-btn edit-btn"
                        data-edit="${key}"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-delete="${key}"
                    >
                        Delete
                    </button>

                </td>
            `;


            tbody.appendChild(tr);

        }
    );


    /*
     * EDIT BUTTON
     */

    tbody
        .querySelectorAll(
            "[data-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditProduct(
                            button.dataset.edit
                        );

                    }
                );

            }
        );


    /*
     * DELETE BUTTON
     */

    tbody
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProduct(
                            button.dataset.delete
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SEARCH
========================================================= */

document
    .getElementById(
        "searchProduct"
    )
    .addEventListener(
        "input",
        renderInventory
    );


document
    .getElementById(
        "categoryFilter"
    )
    .addEventListener(
        "change",
        renderInventory
    );


/* =========================================================
   PRODUCT MODAL
========================================================= */

const productModal =
    document.getElementById(
        "productModal"
    );


document
    .getElementById(
        "openAddProductBtn"
    )
    .addEventListener(
        "click",
        openAddProduct
    );


document
    .getElementById(
        "closeProductModal"
    )
    .addEventListener(
        "click",
        closeProductModal
    );


document
    .getElementById(
        "cancelProductBtn"
    )
    .addEventListener(
        "click",
        closeProductModal
    );


function openAddProduct() {

    document
        .getElementById(
            "modalTitle"
        )
        .textContent =
            "Add Product";


    document
        .getElementById(
            "productForm"
        )
        .reset();


    document
        .getElementById(
            "editProductKey"
        )
        .value = "";


    document
        .getElementById(
            "productThreshold"
        )
        .value = 5;


    productModal.classList.remove(
        "hidden"
    );

}


function openEditProduct(key) {

    const product =
        products[key];


    if (!product) {
        return;
    }


    document
        .getElementById(
            "modalTitle"
        )
        .textContent =
            "Edit Product";


    document
        .getElementById(
            "editProductKey"
        )
        .value = key;


    document
        .getElementById(
            "productSku"
        )
        .value =
            product.sku || "";


    document
        .getElementById(
            "productName"
        )
        .value =
            product.name || "";


    document
        .getElementById(
            "productCategory"
        )
        .value =
            product.category || "";


    document
        .getElementById(
            "productQuantity"
        )
        .value =
            product.quantity ?? 0;


    document
        .getElementById(
            "productPrice"
        )
        .value =
            product.price ?? 0;


    document
        .getElementById(
            "productThreshold"
        )
        .value =
            product.threshold ?? 5;


    productModal.classList.remove(
        "hidden"
    );

}


function closeProductModal() {

    productModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   SAVE PRODUCT
========================================================= */

document
    .getElementById(
        "productForm"
    )
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const key =
                document
                    .getElementById(
                        "editProductKey"
                    )
                    .value;


            const product = {

                sku:
                    document
                        .getElementById(
                            "productSku"
                        )
                        .value
                        .trim(),

                name:
                    document
                        .getElementById(
                            "productName"
                        )
                        .value
                        .trim(),

                category:
                    document
                        .getElementById(
                            "productCategory"
                        )
                        .value,

                quantity:
                    Number(
                        document
                            .getElementById(
                                "productQuantity"
                            )
                            .value
                    ),

                price:
                    Number(
                        document
                            .getElementById(
                                "productPrice"
                            )
                            .value
                    ),

                threshold:
                    Number(
                        document
                            .getElementById(
                                "productThreshold"
                            )
                            .value
                    ),

                updatedAt:
                    Date.now()

            };


            if (!product.sku) {

                alert(
                    "Please enter SKU."
                );

                return;
            }


            if (!product.name) {

                alert(
                    "Please enter product name."
                );

                return;
            }


            if (!product.category) {

                alert(
                    "Please select category."
                );

                return;
            }


            if (
                product.quantity < 0 ||
                product.price < 0
            ) {

                alert(
                    "Quantity and price cannot be negative."
                );

                return;
            }


            const saveBtn =
                document
                    .getElementById(
                        "saveProductBtn"
                    );


            try {

                saveBtn.disabled = true;

                saveBtn.textContent =
                    "SAVING...";


                if (key) {

                    await update(
                        ref(
                            db,
                            `bakeryProducts/${key}`
                        ),
                        product
                    );


                    await addActivity(
                        `Updated product: ${product.name}`
                    );

                } else {

                    product.createdAt =
                        Date.now();


                    const newProductRef =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    await set(
                        newProductRef,
                        product
                    );


                    await addActivity(
                        `Added new product: ${product.name}`
                    );

                }


                closeProductModal();


                await loadProducts();


                alert(
                    "Product saved successfully!"
                );


            } catch (error) {

                console.error(
                    "Save product error:",
                    error
                );


                alert(
                    getFirebaseErrorMessage(
                        error
                    )
                );


            } finally {

                saveBtn.disabled = false;

                saveBtn.textContent =
                    "SAVE PRODUCT";

            }

        }
    );


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(key) {

    const product =
        products[key];


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                `bakeryProducts/${key}`
            )
        );


        await addActivity(
            `Deleted product: ${product.name}`
        );


        await loadProducts();


        alert(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            getFirebaseErrorMessage(
                error
            )
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const entries =
        Object.entries(products);


    const totalProducts =
        entries.length;


    let totalStock = 0;

    let lowStock = 0;

    let estimatedValue = 0;


    entries.forEach(
        ([key, product]) => {

            const quantity =
                Number(
                    product.quantity || 0
                );


            const price =
                Number(
                    product.price || 0
                );


            const threshold =
                Number(
                    product.threshold || 0
                );


            totalStock += quantity;

            estimatedValue +=
                quantity * price;


            if (
                quantity <= threshold
            ) {

                lowStock++;

            }

        }
    );


    document
        .getElementById(
            "totalProducts"
        )
        .textContent =
            totalProducts;


    document
        .getElementById(
            "totalStock"
        )
        .textContent =
            totalStock;


    document
        .getElementById(
            "lowStockItems"
        )
        .textContent =
            lowStock;


    document
        .getElementById(
            "estimatedValue"
        )
        .textContent =
            formatPeso(
                estimatedValue
            );


    renderDashboardTable();

}


/* =========================================================
   DASHBOARD TABLE
========================================================= */

function renderDashboardTable() {

    const tbody =
        document.getElementById(
            "dashboardTableBody"
        );


    tbody.innerHTML = "";


    const entries =
        Object.entries(products)
            .slice(-5)
            .reverse();


    if (entries.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;padding:25px;">
                    No inventory records yet.
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(
        ([key, product]) => {

            const quantity =
                Number(
                    product.quantity || 0
                );


            const threshold =
                Number(
                    product.threshold || 0
                );


            const isLow =
                quantity <= threshold;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        product.sku || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        product.name || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        product.category || "-"
                    )}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    <span class="status ${
                        isLow
                            ? "low-stock"
                            : "in-stock"
                    }">
                        ${
                            isLow
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }
                    </span>
                </td>

            `;


            tbody.appendChild(row);

        }
    );

}


/* =========================================================
   ACTIVITY LOG
========================================================= */

async function addActivity(message) {

    const user =
        auth.currentUser;


    if (!user) {
        return;
    }


    const activityRef =
        push(
            ref(
                db,
                "activityLogs"
            )
        );


    await set(
        activityRef,
        {

            message:
                message,

            userEmail:
                user.email || "",

            timestamp:
                Date.now()

        }
    );

}


/* =========================================================
   LOAD ACTIVITY LOGS
========================================================= */

async function loadActivityLogs() {

    return new Promise(
        resolve => {

            const activityRef =
                ref(
                    db,
                    "activityLogs"
                );


            onValue(
                activityRef,
                snapshot => {

                    const data =
                        snapshot.val() || {};


                    renderActivityLogs(
                        data
                    );


                    resolve();

                },
                {
                    onlyOnce: true
                }
            );

        }
    );

}


/* =========================================================
   RENDER ACTIVITY
========================================================= */

function renderActivityLogs(data) {

    const list =
        document.getElementById(
            "activityList"
        );


    list.innerHTML = "";


    const entries =
        Object.entries(data)
            .sort(
                (
                    [, a],
                    [, b]
                ) =>
                    Number(
                        b.timestamp || 0
                    )
                    -
                    Number(
                        a.timestamp || 0
                    )
            );


    if (entries.length === 0) {

        list.innerHTML = `
            <div style="
                text-align:center;
                padding:30px;
                color:#92745d;
            ">
                No activity logs yet.
            </div>
        `;

        return;
    }


    entries.forEach(
        ([key, activity]) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity-item";


            item.innerHTML = `

                <div class="activity-icon">
                    📋
                </div>

                <div class="activity-content">

                    <strong>
                        ${escapeHtml(
                            activity.message ||
                            "System activity"
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            activity.userEmail || ""
                        )}
                        •
                        ${formatDate(
                            activity.timestamp
                        )}
                    </small>

                </div>

            `;


            list.appendChild(item);

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener(
    "click",
    async function () {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmed) {
            return;
        }


        try {

            /*
             * Remove OTP verification claim
             * before logout.
             */

            if (auth.currentUser) {

                try {

                    await clearOtpFunction({});

                } catch (error) {

                    console.warn(
                        "Could not clear OTP claim:",
                        error
                    );

                }

            }


            await signOut(auth);


            otpChallengeActive = false;


            clearInterval(
                otpTimerInterval
            );


            clearInterval(
                resendTimerInterval
            );


            showOnly(loginPage);

            loginForm.reset();

            clearMessages();


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            showOnly(loginPage);

            return;
        }


        try {

            /*
             * Check custom claim.
             */

            const tokenResult =
                await user.getIdTokenResult();


            const otpVerified =
                tokenResult.claims
                    ?.otpVerified === true;


            if (otpVerified) {

                /*
                 * User already completed OTP.
                 */

                showApp();

                await loadProducts();

                await loadActivityLogs();

                updateDashboard();

                return;
            }


            /*
             * User is logged in with password
             * but OTP is not verified.
             */

            showOtpPage(
                user.email || ""
            );


            /*
             * If this was not caused by a normal
             * login flow, send an OTP.
             */

            if (!otpChallengeActive) {

                try {

                    await sendOtp();

                    setMessage(
                        otpMessage,
                        "A verification code was sent to your email.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Auto OTP error:",
                        error
                    );

                }

            }

        } catch (error) {

            console.error(
                "Auth state error:",
                error
            );

            showOnly(loginPage);

        }

    }
);


/* =========================================================
   CLOSE MODAL WHEN CLICK OUTSIDE
========================================================= */

productModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();

        }

    }
);


/* =========================================================
   INITIAL PAGE
========================================================= */

showOnly(loginPage);
