/* =========================================================
   ARBEES BAKERY SHOP
   Firebase + Realtime Database + Email OTP
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


/* =========================================================
   🔴 IMPORTANT: PASTE YOUR REAL FIREBASE CONFIG HERE
=========================================================

   Firebase Console
   → Project Settings
   → General
   → Your apps
   → Web App
   → SDK setup and configuration
   → Config

   COPY THE WHOLE OBJECT.

========================================================= */

const firebaseConfig = {

    apiKey: "PASTE_YOUR_REAL_API_KEY_HERE",

    authDomain:
        "PASTE_YOUR_PROJECT_ID.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "PASTE_YOUR_REAL_PROJECT_ID",

    storageBucket:
        "PASTE_YOUR_REAL_STORAGE_BUCKET",

    messagingSenderId:
        "PASTE_YOUR_REAL_MESSAGING_SENDER_ID",

    appId:
        "PASTE_YOUR_REAL_APP_ID"
};


/* =========================================================
   GOOGLE APPS SCRIPT OTP URL
========================================================= */

const OTP_API_URL =
    "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";


/* =========================================================
   CHECK CONFIG
========================================================= */

function checkFirebaseConfig() {

    const invalid =
        !firebaseConfig.apiKey ||
        firebaseConfig.apiKey.includes("PASTE_") ||
        !firebaseConfig.projectId ||
        firebaseConfig.projectId.includes("PASTE_") ||
        !firebaseConfig.appId ||
        firebaseConfig.appId.includes("PASTE_");

    if (invalid) {

        console.error(
            "Firebase configuration is still using placeholders."
        );

        const errorBox =
            document.getElementById("loginError");

        if (errorBox) {

            errorBox.textContent =
                "Firebase is not configured yet. Paste your real Firebase Web Config into script.js.";
        }

        return false;
    }

    return true;
}


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

let app;
let auth;
let db;

try {

    if (checkFirebaseConfig()) {

        app = initializeApp(firebaseConfig);

        auth = getAuth(app);

        db = getDatabase(app);

        console.log(
            "Firebase initialized successfully."
        );
    }

} catch (error) {

    console.error(
        "Firebase initialization error:",
        error
    );

    const errorBox =
        document.getElementById("loginError");

    if (errorBox) {

        errorBox.textContent =
            "Firebase configuration error. Check your Web App config.";
    }
}


/* =========================================================
   ELEMENTS
========================================================= */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");


const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const otpForm =
    document.getElementById("otpForm");


/* =========================================================
   PAGE FUNCTIONS
========================================================= */

function showOnly(page) {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");


    page.classList.remove("hidden");
}


function showLogin() {

    showOnly(loginPage);

    clearMessages();

    document
        .getElementById("loginEmail")
        .focus();
}


function showRegister() {

    showOnly(registerPage);

    clearMessages();

    document
        .getElementById("registerName")
        .focus();
}


function showOtp(email) {

    showOnly(otpPage);

    document
        .getElementById("otpEmail")
        .textContent = email;

    document
        .getElementById("otpInput")
        .value = "";

    document
        .getElementById("otpInput")
        .focus();

    document
        .getElementById("otpError")
        .textContent = "";
}


function showSystem() {

    showOnly(systemPage);

    openPage("dashboard");

    loadDashboard();

    loadProfile();

    listenInventory();

    listenActivity();
}


function clearMessages() {

    const messages = [
        "loginError",
        "registerError",
        "otpError",
        "productMessage"
    ];

    messages.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent = "";
        }
    });
}


/* =========================================================
   ERROR HANDLER
========================================================= */

function getFirebaseErrorMessage(error) {

    console.error(error);

    switch (error.code) {

        case "auth/api-key-not-valid":
        case "auth/invalid-api-key":

            return `
                Firebase API key is invalid.
                Check the firebaseConfig in script.js.
            `;

        case "auth/invalid-email":

            return "Please enter a valid email address.";

        case "auth/invalid-credential":

            return "Invalid email or password.";

        case "auth/wrong-password":

            return "Incorrect password.";

        case "auth/user-not-found":

            return "No account found with this email.";

        case "auth/email-already-in-use":

            return "This email is already registered.";

        case "auth/weak-password":

            return "Password must be at least 6 characters.";

        case "auth/network-request-failed":

            return "Network error. Check your internet connection.";

        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";

        case "auth/operation-not-allowed":

            return `
                Email/Password Authentication is not enabled
                in Firebase Console.
            `;

        default:

            return error.message ||
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

        const errorBox =
            document.getElementById("loginError");

        const loginBtn =
            document.getElementById("loginBtn");

        errorBox.textContent = "";


        if (!auth) {

            errorBox.textContent =
                "Firebase is not configured. Check script.js.";

            return;
        }


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            errorBox.textContent =
                "Please enter your email and password.";

            return;
        }


        try {

            loginBtn.disabled = true;

            loginBtn.textContent =
                "LOGGING IN...";


            const result =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            /*
               Store temporary login information.
               User must still complete OTP.
            */

            sessionStorage.setItem(
                "pendingUid",
                user.uid
            );

            sessionStorage.setItem(
                "pendingEmail",
                user.email
            );


            /*
               Send OTP
            */

            const otpResult =
                await sendOtp(
                    user.email,
                    user.uid
                );


            if (!otpResult.success) {

                errorBox.textContent =
                    otpResult.message ||
                    "Unable to send OTP.";

                return;
            }


            showOtp(user.email);


        } catch (error) {

            errorBox.textContent =
                getFirebaseErrorMessage(error);

        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "LOGIN";
        }

    }
);


/* =========================================================
   REGISTER
========================================================= */

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "registerError"
            );

        const registerBtn =
            document.getElementById(
                "registerBtn"
            );

        errorBox.textContent = "";


        if (!auth || !db) {

            errorBox.textContent =
                "Firebase is not configured.";

            return;
        }


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
                .getElementById("confirmPassword")
                .value;


        if (password !== confirmPassword) {

            errorBox.textContent =
                "Passwords do not match.";

            return;
        }


        if (password.length < 6) {

            errorBox.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        try {

            registerBtn.disabled = true;

            registerBtn.textContent =
                "CREATING ACCOUNT...";


            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            /*
               Update Firebase Auth profile
            */

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            /*
               Save user information
               in Realtime Database
            */

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


            /*
               Activity log
            */

            await addActivity(
                "REGISTER",
                "New staff account created."
            );


            sessionStorage.setItem(
                "pendingUid",
                user.uid
            );

            sessionStorage.setItem(
                "pendingEmail",
                email
            );


            /*
               Send OTP
            */

            const otpResult =
                await sendOtp(
                    email,
                    user.uid
                );


            if (!otpResult.success) {

                errorBox.textContent =
                    otpResult.message ||
                    "Account created, but OTP could not be sent.";

                return;
            }


            showOtp(email);


        } catch (error) {

            errorBox.textContent =
                getFirebaseErrorMessage(error);

        } finally {

            registerBtn.disabled = false;

            registerBtn.textContent =
                "REGISTER";
        }

    }
);


/* =========================================================
   SEND OTP
========================================================= */

async function sendOtp(email, uid) {

    if (
        !OTP_API_URL ||
        OTP_API_URL.includes("PASTE_")
    ) {

        return {

            success: false,

            message:
                "OTP service is not configured. Paste your Google Apps Script Web App URL in script.js."

        };
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

                        action: "sendOtp",

                        email: email,

                        uid: uid

                    })

                }
            );


        const result =
            await response.json();


        return result;


    } catch (error) {

        console.error(
            "OTP send error:",
            error
        );

        return {

            success: false,

            message:
                "Could not connect to OTP service."

        };
    }
}


/* =========================================================
   VERIFY OTP
========================================================= */

otpForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "otpError"
            );

        const verifyBtn =
            document.getElementById(
                "verifyOtpBtn"
            );


        errorBox.textContent = "";


        const otp =
            document
                .getElementById("otpInput")
                .value
                .trim();


        const email =
            sessionStorage.getItem(
                "pendingEmail"
            );


        const uid =
            sessionStorage.getItem(
                "pendingUid"
            );


        if (!/^\d{6}$/.test(otp)) {

            errorBox.textContent =
                "Please enter the 6-digit OTP.";

            return;
        }


        if (!email || !uid) {

            errorBox.textContent =
                "Login session expired. Please login again.";

            return;
        }


        try {

            verifyBtn.disabled = true;

            verifyBtn.textContent =
                "VERIFYING...";


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

                            action: "verifyOtp",

                            email: email,

                            uid: uid,

                            otp: otp

                        })

                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                errorBox.textContent =
                    result.message ||
                    "Invalid OTP.";

                return;
            }


            /*
               OTP successful
            */

            sessionStorage.setItem(
                "otpVerified",
                "true"
            );


            sessionStorage.removeItem(
                "pendingEmail"
            );

            sessionStorage.removeItem(
                "pendingUid"
            );


            await addActivity(
                "LOGIN",
                "User logged in successfully with OTP verification."
            );


            showSystem();


        } catch (error) {

            console.error(
                error
            );

            errorBox.textContent =
                "Unable to verify OTP. Please try again.";

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

document
    .getElementById("resendOtp")
    .addEventListener(
        "click",
        async function () {

            const email =
                sessionStorage.getItem(
                    "pendingEmail"
                );

            const uid =
                sessionStorage.getItem(
                    "pendingUid"
                );


            if (!email || !uid) {

                document
                    .getElementById("otpError")
                    .textContent =
                    "Login session expired.";

                return;
            }


            const message =
                document.getElementById(
                    "otpMessage"
                );


            message.textContent =
                "Sending a new OTP...";


            const result =
                await sendOtp(
                    email,
                    uid
                );


            if (result.success) {

                message.textContent =
                    "A new OTP has been sent to your email.";

            } else {

                document
                    .getElementById("otpError")
                    .textContent =
                    result.message ||
                    "Unable to resend OTP.";
            }

        }
    );


/* =========================================================
   BACK TO LOGIN
========================================================= */

document
    .getElementById("backLogin")
    .addEventListener(
        "click",
        async function () {

            sessionStorage.clear();

            if (auth) {

                try {

                    await signOut(auth);

                } catch (error) {

                    console.error(error);
                }
            }

            showLogin();
        }
    );


/* =========================================================
   NAVIGATION BETWEEN LOGIN / REGISTER
========================================================= */

document
    .getElementById("showRegisterBtn")
    .addEventListener(
        "click",
        showRegister
    );


document
    .getElementById("showLoginBtn")
    .addEventListener(
        "click",
        showLogin
    );


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const page =
                    this.dataset.page;

                openPage(page);
            }
        );

    });


function openPage(pageName) {

    const pages = [

        "dashboard",

        "inventory",

        "addProduct",

        "activity",

        "users"

    ];


    pages.forEach(page => {

        const element =
            document.getElementById(
                page + "Page"
            );

        if (element) {

            element.classList.add("hidden");
        }

    });


    const target =
        document.getElementById(
            pageName + "Page"
        );


    if (target) {

        target.classList.remove("hidden");
    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.page ===
                pageName
            ) {

                button.classList.add("active");
            }

        });


    const titles = {

        dashboard:
            "Dashboard",

        inventory:
            "Inventory",

        addProduct:
            "Add Product",

        activity:
            "Activity Logs",

        users:
            "My Account"

    };


    document
        .getElementById("pageTitle")
        .textContent =
        titles[pageName] ||
        "Dashboard";
}


/* =========================================================
   ADD PRODUCT BUTTON
========================================================= */

document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            openPage("addProduct");
        }
    );


document
    .getElementById("cancelProductBtn")
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            openPage("inventory");
        }
    );


/* =========================================================
   PRODUCT FORM
========================================================= */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!auth || !db) {

                alert(
                    "Firebase is not configured."
                );

                return;
            }


            const user =
                auth.currentUser;


            if (!user) {

                alert(
                    "Please login first."
                );

                return;
            }


            const id =
                document
                    .getElementById(
                        "editingProductId"
                    )
                    .value;


            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const sku =
                document
                    .getElementById(
                        "productSKU"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "productCategory"
                    )
                    .value;


            const quantity =
                Number(
                    document
                        .getElementById(
                            "productQuantity"
                        )
                        .value
                );


            const price =
                Number(
                    document
                        .getElementById(
                            "productPrice"
                        )
                        .value
                );


            const threshold =
                Number(
                    document
                        .getElementById(
                            "lowStockThreshold"
                        )
                        .value
                );


            if (
                !name ||
                !sku ||
                !category ||
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                document
                    .getElementById(
                        "productMessage"
                    )
                    .textContent =
                    "Please complete all fields correctly.";

                return;
            }


            const button =
                document
                    .getElementById(
                        "saveProductBtn"
                    );


            try {

                button.disabled = true;

                button.textContent =
                    "SAVING...";


                const product = {

                    name: name,

                    sku: sku,

                    category: category,

                    quantity: quantity,

                    price: price,

                    lowStockThreshold:
                        threshold,

                    updatedAt:
                        new Date().toISOString(),

                    updatedBy:
                        user.uid
                };


                if (id) {

                    const existing =
                        await get(
                            ref(
                                db,
                                "bakeryProducts/" +
                                id
                            )
                        );


                    if (existing.exists()) {

                        const old =
                            existing.val();


                        product.createdAt =
                            old.createdAt ||
                            new Date().toISOString();

                        product.createdBy =
                            old.createdBy ||
                            user.uid;
                    }


                    await set(
                        ref(
                            db,
                            "bakeryProducts/" +
                            id
                        ),
                        product
                    );


                    await addActivity(
                        "UPDATE PRODUCT",
                        `${name} (${sku}) was updated.`
                    );


                } else {

                    product.createdAt =
                        new Date().toISOString();

                    product.createdBy =
                        user.uid;


                    const newProduct =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    await set(
                        newProduct,
                        product
                    );


                    await addActivity(
                        "ADD PRODUCT",
                        `${name} (${sku}) was added.`
                    );
                }


                document
                    .getElementById(
                        "productMessage"
                    )
                    .textContent =
                    "Product saved successfully.";


                resetProductForm();


                setTimeout(
                    () => {

                        openPage(
                            "inventory"
                        );

                    },
                    700
                );


            } catch (error) {

                console.error(error);

                document
                    .getElementById(
                        "productMessage"
                    )
                    .textContent =
                    "Unable to save product.";


            } finally {

                button.disabled = false;

                button.textContent =
                    "Save Product";
            }

        }
    );


/* =========================================================
   RESET PRODUCT FORM
========================================================= */

function resetProductForm() {

    document
        .getElementById("productForm")
        .reset();


    document
        .getElementById(
            "editingProductId"
        )
        .value = "";


    document
        .getElementById(
            "lowStockThreshold"
        )
        .value = 5;


    document
        .getElementById(
            "productFormTitle"
        )
        .textContent =
        "Add Product";


    document
        .getElementById(
            "saveProductBtn"
        )
        .textContent =
        "Save Product";


    document
        .getElementById(
            "productMessage"
        )
        .textContent = "";
}


/* =========================================================
   INVENTORY DATA
========================================================= */

let inventoryData = {};


function listenInventory() {

    if (!db) return;


    const productsRef =
        ref(
            db,
            "bakeryProducts"
        );


    onValue(
        productsRef,
        snapshot => {

            inventoryData =
                snapshot.val() || {};

            renderInventory();

            updateDashboardStats();

        },
        error => {

            console.error(
                "Inventory listener:",
                error
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


    tbody.innerHTML = "";


    const search =
        document
            .getElementById(
                "searchProduct"
            )
            .value
            .toLowerCase()
            .trim();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )
            .value;


    const entries =
        Object.entries(
            inventoryData
        );


    const filtered =
        entries.filter(
            ([id, product]) => {

                const matchesSearch =
                    !search ||
                    String(product.name || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(product.sku || "")
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    !category ||
                    product.category ===
                    category;


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
        ([id, product]) => {

            const quantity =
                Number(
                    product.quantity || 0
                );


            const threshold =
                Number(
                    product.lowStockThreshold ||
                    0
                );


            const isLow =
                quantity <= threshold;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(product.sku || "-")}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(product.name || "-")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(product.category || "-")}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ₱${Number(product.price || 0).toFixed(2)}
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
                        data-edit="${id}"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-delete="${id}"
                    >
                        Delete
                    </button>

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    document
        .querySelectorAll("[data-edit]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.edit
                    );

                }
            );

        });


    document
        .querySelectorAll("[data-delete]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.delete
                    );

                }
            );

        });
}


/* =========================================================
   SEARCH
========================================================= */

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        renderInventory
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        renderInventory
    );


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(id) {

    const product =
        inventoryData[id];


    if (!product) return;


    document
        .getElementById(
            "editingProductId"
        )
        .value = id;


    document
        .getElementById(
            "productName"
        )
        .value =
        product.name || "";


    document
        .getElementById(
            "productSKU"
        )
        .value =
        product.sku || "";


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
        product.quantity || 0;


    document
        .getElementById(
            "productPrice"
        )
        .value =
        product.price || 0;


    document
        .getElementById(
            "lowStockThreshold"
        )
        .value =
        product.lowStockThreshold ?? 5;


    document
        .getElementById(
            "productFormTitle"
        )
        .textContent =
        "Edit Product";


    document
        .getElementById(
            "saveProductBtn"
        )
        .textContent =
        "Update Product";


    openPage("addProduct");
}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(id) {

    if (!auth || !db) return;


    const product =
        inventoryData[id];


    if (!product) return;


    const confirmed =
        confirm(
            `Delete "${product.name}" from inventory?`
        );


    if (!confirmed) return;


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" + id
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            `${product.name} (${product.sku}) was deleted.`
        );


        alert(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );
    }
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const products =
        Object.values(
            inventoryData
        );


    let totalProducts =
        products.length;


    let totalStock = 0;

    let lowStockCount = 0;

    let estimatedValue = 0;


    products.forEach(
        product => {

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
                    product.lowStockThreshold ||
                    0
                );


            totalStock += quantity;


            estimatedValue +=
                quantity * price;


            if (
                quantity <= threshold
            ) {

                lowStockCount++;
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
            "lowStock"
        )
        .textContent =
        lowStockCount;


    document
        .getElementById(
            "estimatedValue"
        )
        .textContent =
        "₱" +
        estimatedValue.toFixed(2);


    renderLowStock();
}


/* =========================================================
   LOW STOCK
========================================================= */

function renderLowStock() {

    const container =
        document.getElementById(
            "lowStockList"
        );


    const lowProducts =
        Object.entries(
            inventoryData
        )
        .filter(
            ([id, product]) => {

                const quantity =
                    Number(
                        product.quantity || 0
                    );


                const threshold =
                    Number(
                        product.lowStockThreshold ||
                        0
                    );


                return (
                    quantity <= threshold
                );
            }
        );


    if (lowProducts.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No low stock products.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    lowProducts.forEach(
        ([id, product]) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "list-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>

                    <small>
                        ${escapeHTML(product.category || "")}
                    </small>

                </div>

                <strong style="color:#d9534f;">
                    ${Number(product.quantity || 0)}
                    left
                </strong>

            `;


            container.appendChild(item);
        }
    );
}


/* =========================================================
   ACTIVITY
========================================================= */

async function addActivity(
    action,
    details
) {

    if (!db || !auth) return;


    const user =
        auth.currentUser;


    if (!user) return;


    try {

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

                userId:
                    user.uid,

                userName:
                    user.displayName ||
                    "User",

                userEmail:
                    user.email,

                action:
                    action,

                details:
                    details,

                timestamp:
                    new Date().toISOString()

            }
        );

    } catch (error) {

        console.error(
            "Activity error:",
            error
        );
    }
}


let activityData = {};


function listenActivity() {

    if (!db) return;


    onValue(
        ref(
            db,
            "activityLogs"
        ),
        snapshot => {

            activityData =
                snapshot.val() || {};

            renderActivity();

            renderRecentActivity();

        }
    );
}


/* =========================================================
   RENDER ACTIVITY
========================================================= */

function renderActivity() {

    const tbody =
        document.getElementById(
            "activityTableBody"
        );


    tbody.innerHTML = "";


    const entries =
        Object.entries(
            activityData
        )
        .sort(
            (a, b) => {

                return (
                    new Date(
                        b[1].timestamp || 0
                    ) -
                    new Date(
                        a[1].timestamp || 0
                    )
                );

            }
        );


    if (entries.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;padding:30px;">
                    No activity yet.
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(
        ([id, activity]) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${formatDate(activity.timestamp)}
                </td>

                <td>
                    ${escapeHTML(activity.userName || "-")}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(activity.action || "-")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(activity.details || "-")}
                </td>

            `;


            tbody.appendChild(row);
        }
    );
}


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );


    const entries =
        Object.values(
            activityData
        )
        .sort(
            (a, b) => {

                return (
                    new Date(
                        b.timestamp || 0
                    ) -
                    new Date(
                        a.timestamp || 0
                    )
                );

            }
        )
        .slice(0, 5);


    if (entries.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No activity yet.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    entries.forEach(
        activity => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "list-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(activity.action || "-")}
                    </strong>

                    <small>
                        ${escapeHTML(activity.details || "-")}
                    </small>

                </div>

                <small>
                    ${formatDate(activity.timestamp)}
                </small>

            `;


            container.appendChild(item);
        }
    );
}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!auth || !db) return;


    const user =
        auth.currentUser;


    if (!user) return;


    let name =
        user.displayName ||
        "User";


    let role =
        "staff";


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" + user.uid
                )
            );


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            name =
                data.name ||
                name;


            role =
                data.role ||
                "staff";
        }

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );
    }


    document
        .getElementById(
            "currentUserName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "headerUserName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "headerUserEmail"
        )
        .textContent =
        user.email;


    document
        .getElementById(
            "userRole"
        )
        .textContent =
        role.toUpperCase();


    document
        .getElementById(
            "profileName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "profileEmail"
        )
        .textContent =
        user.email;


    document
        .getElementById(
            "profileRole"
        )
        .textContent =
        role.toUpperCase();
}


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async function () {

            try {

                if (auth) {

                    await signOut(auth);
                }


                sessionStorage.clear();

                showLogin();


                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value = "";


            } catch (error) {

                console.error(error);

            }

        }
    );


/* =========================================================
   AUTH STATE
========================================================= */

if (auth) {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                sessionStorage.clear();

                showLogin();

                return;
            }


            const verified =
                sessionStorage.getItem(
                    "otpVerified"
                );


            /*
               Do not show Dashboard
               unless OTP was completed.
            */

            if (verified === "true") {

                showSystem();

            } else {

                const email =
                    user.email;


                sessionStorage.setItem(
                    "pendingEmail",
                    email
                );

                sessionStorage.setItem(
                    "pendingUid",
                    user.uid
                );


                showOtp(email);
            }

        }
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function loadDashboard() {

    updateDashboardStats();

    renderLowStock();

    renderRecentActivity();
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) return "-";


    const date =
        new Date(timestamp);


    if (isNaN(date.getTime())) {

        return "-";
    }


    return date.toLocaleString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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
   START
========================================================= */

console.log(
    "Arbees Bakery Shop loaded."
);
