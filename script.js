/* =========================================================
   ARBEES BAKERY SHOP
   GOOGLE LOGIN + PHONE OTP + FIREBASE RTDB
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    RecaptchaVerifier,
    linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
   =========================================================

   IMPORTANT:
   Replace the values below with the Web App configuration
   from your Firebase Console.
*/

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain:
        "crudfirebase-b2a1f-default-rtdb.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "crudfirebase-b2a1f",

    storageBucket:
        "crudfirebase-b2a1f.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();


/* =========================================================
   DATABASE REFERENCES
   ========================================================= */

const usersRef =
    ref(db, "users");

const productsRef =
    ref(db, "bakeryProducts");

const activityRef =
    ref(db, "activityLogs");


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;

let confirmationResult = null;

let recaptchaVerifier = null;

let editingProductId = null;


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");


/* =========================================================
   HELPER
   ========================================================= */

function hideAllAuthPages() {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");
}


function showLogin() {

    hideAllAuthPages();

    loginPage.classList.remove("hidden");

}


function showRegister() {

    hideAllAuthPages();

    registerPage.classList.remove("hidden");

}


function showOTP() {

    hideAllAuthPages();

    otpPage.classList.remove("hidden");

}


function showSystem() {

    hideAllAuthPages();

    systemPage.classList.remove("hidden");

    showPage("dashboard");

    loadUserInformation();

    loadDashboard();

    loadInventory();

    loadActivity();

}


/* =========================================================
   LOGIN / REGISTER NAVIGATION
   ========================================================= */

document
    .getElementById("showRegisterBtn")
    .addEventListener("click", showRegister);


document
    .getElementById("showLoginBtn")
    .addEventListener("click", showLogin);


document
    .getElementById("otpBackBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.log(error);

        }

        currentUser = null;

        showLogin();

    });


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function googleLogin() {

    const loginError =
        document.getElementById("loginError");

    loginError.textContent = "";

    try {

        const result =
            await signInWithPopup(
                auth,
                googleProvider
            );

        currentUser =
            result.user;

        await saveUserToDatabase();

        showOTP();

        displayGoogleUser();

        await setupRecaptcha();

    } catch (error) {

        console.error(error);

        loginError.textContent =
            getFirebaseError(error);

    }

}


/* =========================================================
   GOOGLE REGISTER
   ========================================================= */

async function googleRegister() {

    const errorBox =
        document.getElementById("registerError");

    errorBox.textContent = "";

    try {

        const result =
            await signInWithPopup(
                auth,
                googleProvider
            );

        currentUser =
            result.user;

        await saveUserToDatabase();

        showOTP();

        displayGoogleUser();

        await setupRecaptcha();

    } catch (error) {

        console.error(error);

        errorBox.textContent =
            getFirebaseError(error);

    }

}


document
    .getElementById("googleLoginBtn")
    .addEventListener(
        "click",
        googleLogin
    );


document
    .getElementById("googleRegisterBtn")
    .addEventListener(
        "click",
        googleRegister
    );


/* =========================================================
   SAVE USER TO RTDB
   ========================================================= */

async function saveUserToDatabase() {

    if (!currentUser) return;

    const userRef =
        ref(
            db,
            `users/${currentUser.uid}`
        );

    const snapshot =
        await get(userRef);

    if (!snapshot.exists()) {

        await set(userRef, {

            uid:
                currentUser.uid,

            name:
                currentUser.displayName || "User",

            email:
                currentUser.email || "",

            photoURL:
                currentUser.photoURL || "",

            role:
                "staff",

            googleVerified:
                true,

            otpVerified:
                false,

            createdAt:
                new Date().toISOString()

        });

    } else {

        await set(userRef, {

            ...snapshot.val(),

            name:
                currentUser.displayName || snapshot.val().name,

            email:
                currentUser.email || snapshot.val().email,

            photoURL:
                currentUser.photoURL || snapshot.val().photoURL,

            googleVerified:
                true

        });

    }

}


/* =========================================================
   DISPLAY GOOGLE ACCOUNT
   ========================================================= */

function displayGoogleUser() {

    const box =
        document.getElementById(
            "googleUserInfo"
        );

    if (!currentUser) return;

    box.innerHTML = `

        <strong>Google Account</strong>

        <br>

        ${escapeHTML(
            currentUser.displayName || "User"
        )}

        <br>

        ${escapeHTML(
            currentUser.email || ""
        )}

    `;

}


/* =========================================================
   RECAPTCHA
   ========================================================= */

async function setupRecaptcha() {

    try {

        if (recaptchaVerifier) {

            recaptchaVerifier.clear();

        }

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {

                    size: "normal",

                    callback: () => {

                        console.log(
                            "reCAPTCHA verified"
                        );

                    },

                    "expired-callback": () => {

                        showOtpError(
                            "reCAPTCHA expired. Please verify again."
                        );

                    }

                }
            );

        await recaptchaVerifier.render();

    } catch (error) {

        console.error(
            "reCAPTCHA error:",
            error
        );

        showOtpError(
            "Unable to load Google verification."
        );

    }

}


/* =========================================================
   SEND OTP
   ========================================================= */

document
    .getElementById("phoneForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearOtpMessages();

            if (!currentUser) {

                showOtpError(
                    "Please login with Google first."
                );

                return;

            }

            const phoneNumber =
                document
                    .getElementById(
                        "phoneNumber"
                    )
                    .value
                    .trim();

            if (!phoneNumber.startsWith("+")) {

                showOtpError(
                    "Use international format. Example: +639171234567"
                );

                return;

            }

            try {

                if (!recaptchaVerifier) {

                    await setupRecaptcha();

                }

                confirmationResult =
                    await linkWithPhoneNumber(
                        currentUser,
                        phoneNumber,
                        recaptchaVerifier
                    );

                document
                    .getElementById(
                        "phoneForm"
                    )
                    .classList.add(
                        "hidden"
                    );

                document
                    .getElementById(
                        "otpForm"
                    )
                    .classList.remove(
                        "hidden"
                    );

                showOtpMessage(
                    "OTP sent to your phone."
                );

            } catch (error) {

                console.error(error);

                showOtpError(
                    getFirebaseError(error)
                );

                try {

                    if (recaptchaVerifier) {

                        recaptchaVerifier.clear();

                    }

                    await setupRecaptcha();

                } catch (e) {

                    console.log(e);

                }

            }

        }
    );


/* =========================================================
   VERIFY OTP
   ========================================================= */

document
    .getElementById("otpForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearOtpMessages();

            if (!confirmationResult) {

                showOtpError(
                    "Please request an OTP first."
                );

                return;

            }

            const code =
                document
                    .getElementById(
                        "otpCode"
                    )
                    .value
                    .trim();

            if (!/^\d{6}$/.test(code)) {

                showOtpError(
                    "Enter the 6-digit OTP."
                );

                return;

            }

            try {

                await confirmationResult.confirm(code);

                currentUser =
                    auth.currentUser;

                await markOtpVerified();

                await logActivity(
                    "OTP Verification",
                    "User successfully completed Google and OTP verification."
                );

                showOtpMessage(
                    "Verification successful!"
                );

                setTimeout(() => {

                    showSystem();

                }, 700);

            } catch (error) {

                console.error(error);

                showOtpError(
                    getFirebaseError(error)
                );

            }

        }
    );


/* =========================================================
   RESEND OTP
   ========================================================= */

document
    .getElementById("resendOtpBtn")
    .addEventListener(
        "click",
        async () => {

            document
                .getElementById(
                    "phoneForm"
                )
                .classList.remove(
                    "hidden"
                );

            document
                .getElementById(
                    "otpForm"
                )
                .classList.add(
                    "hidden"
                );

            clearOtpMessages();

            try {

                if (recaptchaVerifier) {

                    recaptchaVerifier.clear();

                }

                await setupRecaptcha();

            } catch (error) {

                console.error(error);

            }

        }
    );


/* =========================================================
   MARK OTP VERIFIED
   ========================================================= */

async function markOtpVerified() {

    if (!currentUser) return;

    const userRef =
        ref(
            db,
            `users/${currentUser.uid}`
        );

    const snapshot =
        await get(userRef);

    const oldData =
        snapshot.exists()
            ? snapshot.val()
            : {};

    await set(userRef, {

        ...oldData,

        uid:
            currentUser.uid,

        name:
            currentUser.displayName || "User",

        email:
            currentUser.email || "",

        googleVerified:
            true,

        otpVerified:
            true,

        phoneNumber:
            currentUser.phoneNumber || "",

        lastLogin:
            new Date().toISOString()

    });

}


/* =========================================================
   OTP MESSAGE
   ========================================================= */

function showOtpError(message) {

    const error =
        document.getElementById(
            "otpError"
        );

    error.textContent = message;

}


function showOtpMessage(message) {

    const messageBox =
        document.getElementById(
            "otpMessage"
        );

    messageBox.textContent =
        message;

}


function clearOtpMessages() {

    document.getElementById(
        "otpError"
    ).textContent = "";

    document.getElementById(
        "otpMessage"
    ).textContent = "";

}


/* =========================================================
   DASHBOARD NAVIGATION
   ========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                showPage(page);

            }
        );

    });


function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add(
                "hidden"
            );

        });

    const target =
        document.getElementById(
            `${pageName}Page`
        );

    if (target) {

        target.classList.remove(
            "hidden"
        );

    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

            if (
                button.dataset.page ===
                pageName
            ) {

                button.classList.add(
                    "active"
                );

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
        .getElementById(
            "pageTitle"
        )
        .textContent =
            titles[pageName] || "Dashboard";

}


/* =========================================================
   ADD PRODUCT
   ========================================================= */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (!currentUser) {

                return;

            }

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


            if (!name || !sku || !category) {

                showProductMessage(
                    "Please complete all fields.",
                    false
                );

                return;

            }


            try {

                const newProductRef =
                    push(productsRef);

                await set(
                    newProductRef,
                    {

                        name,

                        sku,

                        category,

                        quantity,

                        price,

                        threshold,

                        createdBy:
                            currentUser.uid,

                        createdAt:
                            new Date().toISOString()

                    }
                );


                await logActivity(
                    "Add Product",
                    `${name} was added to inventory.`
                );


                showProductMessage(
                    "Product successfully added!",
                    true
                );


                document
                    .getElementById(
                        "productForm"
                    )
                    .reset();


                document
                    .getElementById(
                        "lowStockThreshold"
                    )
                    .value = 5;


                await loadInventory();

                await loadDashboard();


            } catch (error) {

                console.error(error);

                showProductMessage(
                    error.message,
                    false
                );

            }

        }
    );


function showProductMessage(
    message,
    success
) {

    const box =
        document.getElementById(
            "productMessage"
        );

    box.textContent =
        message;

    box.style.color =
        success
            ? "#2e8b57"
            : "#d9534f";

}


/* =========================================================
   LOAD INVENTORY
   ========================================================= */

async function loadInventory() {

    const snapshot =
        await get(productsRef);

    const body =
        document.getElementById(
            "inventoryTableBody"
        );

    body.innerHTML = "";

    if (!snapshot.exists()) {

        body.innerHTML = `

            <tr>
                <td colspan="7">
                    No products found.
                </td>
            </tr>

        `;

        return;

    }


    const products =
        snapshot.val();


    Object.entries(products)
        .forEach(
            ([id, product]) => {

                const low =
                    Number(product.quantity)
                    <=
                    Number(product.threshold);


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHTML(product.name)}
                    </td>

                    <td>
                        ${escapeHTML(product.sku)}
                    </td>

                    <td>
                        ${escapeHTML(product.category)}
                    </td>

                    <td>
                        ${product.quantity}
                    </td>

                    <td>
                        ₱${Number(product.price).toFixed(2)}
                    </td>

                    <td>

                        <span class="status ${
                            low ? "low" : "ok"
                        }">

                            ${
                                low
                                    ? "LOW STOCK"
                                    : "IN STOCK"
                            }

                        </span>

                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            data-id="${id}"
                            data-name="${escapeHTML(product.name)}">

                            Delete

                        </button>

                    </td>

                `;


                body.appendChild(row);

            }
        );


    body
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteProduct(
                        button.dataset.id,
                        button.dataset.name
                    )
            );

        });

}


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

async function deleteProduct(
    id,
    name
) {

    const confirmed =
        confirm(
            `Delete ${name}?`
        );

    if (!confirmed) return;


    try {

        await remove(
            ref(
                db,
                `bakeryProducts/${id}`
            )
        );


        await logActivity(
            "Delete Product",
            `${name} was deleted.`
        );


        await loadInventory();

        await loadDashboard();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        filterInventory
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        filterInventory
    );


async function filterInventory() {

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


    const snapshot =
        await get(productsRef);

    const body =
        document.getElementById(
            "inventoryTableBody"
        );

    body.innerHTML = "";


    if (!snapshot.exists()) {

        return;

    }


    Object.entries(snapshot.val())
        .forEach(
            ([id, product]) => {

                const matchesSearch =
                    product.name
                        .toLowerCase()
                        .includes(search) ||
                    product.sku
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all" ||
                    product.category === category;


                if (
                    !matchesSearch ||
                    !matchesCategory
                ) {

                    return;

                }


                const low =
                    Number(product.quantity)
                    <=
                    Number(product.threshold);


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>${escapeHTML(product.name)}</td>

                    <td>${escapeHTML(product.sku)}</td>

                    <td>${escapeHTML(product.category)}</td>

                    <td>${product.quantity}</td>

                    <td>
                        ₱${Number(product.price).toFixed(2)}
                    </td>

                    <td>

                        <span class="status ${
                            low ? "low" : "ok"
                        }">

                            ${
                                low
                                    ? "LOW STOCK"
                                    : "IN STOCK"
                            }

                        </span>

                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            data-id="${id}"
                            data-name="${escapeHTML(product.name)}">

                            Delete

                        </button>

                    </td>

                `;


                body.appendChild(row);

            }
        );


    body
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteProduct(
                        button.dataset.id,
                        button.dataset.name
                    )
            );

        });

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

    const snapshot =
        await get(productsRef);


    let totalProducts = 0;

    let totalStock = 0;

    let lowStockCount = 0;

    let estimatedValue = 0;


    const lowProducts = [];


    if (snapshot.exists()) {

        const products =
            snapshot.val();


        Object.values(products)
            .forEach(product => {

                totalProducts++;

                totalStock +=
                    Number(product.quantity);

                estimatedValue +=
                    Number(product.quantity) *
                    Number(product.price);


                if (
                    Number(product.quantity)
                    <=
                    Number(product.threshold)
                ) {

                    lowStockCount++;

                    lowProducts.push(
                        product
                    );

                }

            });

    }


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
            `₱${estimatedValue.toFixed(2)}`;


    const list =
        document.getElementById(
            "lowStockList"
        );


    if (lowProducts.length === 0) {

        list.innerHTML = `
            <p class="empty-text">
                No low stock products.
            </p>
        `;

    } else {

        list.innerHTML =
            lowProducts
                .slice(0, 5)
                .map(
                    product => `

                        <p style="
                            padding:10px 0;
                            border-bottom:1px solid #eee;
                        ">

                            <strong>
                                ${escapeHTML(product.name)}
                            </strong>

                            <br>

                            <small>
                                Stock:
                                ${product.quantity}
                            </small>

                        </p>

                    `
                )
                .join("");

    }


    await loadRecentActivity();

}


/* =========================================================
   ACTIVITY LOG
   ========================================================= */

async function logActivity(
    action,
    details
) {

    if (!currentUser) return;


    try {

        const newLog =
            push(activityRef);


        await set(
            newLog,
            {

                user:
                    currentUser.displayName ||
                    currentUser.email ||
                    "User",

                uid:
                    currentUser.uid,

                action,

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


/* =========================================================
   LOAD ACTIVITY
   ========================================================= */

async function loadActivity() {

    const snapshot =
        await get(activityRef);

    const body =
        document.getElementById(
            "activityTableBody"
        );

    body.innerHTML = "";


    if (!snapshot.exists()) {

        body.innerHTML = `

            <tr>
                <td colspan="4">
                    No activity found.
                </td>
            </tr>

        `;

        return;

    }


    const logs =
        Object.values(
            snapshot.val()
        ).sort(
            (a, b) =>
                new Date(b.timestamp)
                -
                new Date(a.timestamp)
        );


    logs.forEach(log => {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${formatDate(log.timestamp)}
            </td>

            <td>
                ${escapeHTML(log.user || "User")}
            </td>

            <td>
                ${escapeHTML(log.action || "")}
            </td>

            <td>
                ${escapeHTML(log.details || "")}
            </td>

        `;


        body.appendChild(row);

    });

}


async function loadRecentActivity() {

    const snapshot =
        await get(activityRef);

    const box =
        document.getElementById(
            "recentActivity"
        );


    if (!snapshot.exists()) {

        box.innerHTML = `
            <p class="empty-text">
                No recent activity.
            </p>
        `;

        return;

    }


    const logs =
        Object.values(
            snapshot.val()
        ).sort(
            (a, b) =>
                new Date(b.timestamp)
                -
                new Date(a.timestamp)
        )
        .slice(0, 5);


    box.innerHTML =
        logs
            .map(
                log => `

                    <div style="
                        padding:10px 0;
                        border-bottom:1px solid #eee;
                    ">

                        <strong>
                            ${escapeHTML(log.action)}
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(log.details)}
                        </small>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

async function loadUserInformation() {

    if (!currentUser) return;


    const userRef =
        ref(
            db,
            `users/${currentUser.uid}`
        );


    const snapshot =
        await get(userRef);


    const data =
        snapshot.exists()
            ? snapshot.val()
            : {};


    const name =
        currentUser.displayName ||
        data.name ||
        "User";


    const email =
        currentUser.email ||
        data.email ||
        "";


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
            email;


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
            email;


    document
        .getElementById(
            "profileRole"
        )
        .textContent =
            data.role || "Staff";


    document
        .getElementById(
            "userRole"
        )
        .textContent =
            data.role || "Staff";


    if (currentUser.photoURL) {

        document
            .getElementById(
                "profileHeaderImage"
            )
            .src =
                currentUser.photoURL;

    }

}


/* =========================================================
   ADD BUTTON
   ========================================================= */

document
    .getElementById(
        "inventoryAddBtn"
    )
    .addEventListener(
        "click",
        () => {

            showPage("addProduct");

        }
    );


/* =========================================================
   LOGOUT
   ========================================================= */

document
    .getElementById(
        "logoutBtn"
    )
    .addEventListener(
        "click",
        async () => {

            try {

                if (currentUser) {

                    await logActivity(
                        "Logout",
                        "User logged out."
                    );

                }

                await signOut(auth);

                currentUser = null;

                showLogin();

            } catch (error) {

                console.error(error);

            }

        }
    );


/* =========================================================
   LOAD ACTIVITY WHEN PAGE OPENED
   ========================================================= */

document
    .querySelector(
        '[data-page="activity"]'
    )
    .addEventListener(
        "click",
        loadActivity
    );


/* =========================================================
   FIREBASE ERROR TRANSLATOR
   ========================================================= */

function getFirebaseError(error) {

    const code =
        error?.code || "";

    const messages = {

        "auth/popup-closed-by-user":
            "Google login was cancelled.",

        "auth/popup-blocked":
            "Your browser blocked the Google login popup.",

        "auth/cancelled-popup-request":
            "Another Google login is already running.",

        "auth/invalid-phone-number":
            "Invalid phone number.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/invalid-verification-code":
            "Incorrect OTP.",

        "auth/code-expired":
            "OTP expired. Please request a new OTP.",

        "auth/provider-already-linked":
            "This phone number is already linked.",

        "auth/credential-already-in-use":
            "This phone number is already used by another account.",

        "auth/operation-not-allowed":
            "This authentication method is not enabled in Firebase.",

        "auth/unauthorized-domain":
            "This website domain is not authorized in Firebase."

    };


    return (
        messages[code] ||
        error?.message ||
        "An authentication error occurred."
    );

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(date) {

    if (!date) return "";

    return new Date(date)
        .toLocaleString();

}


/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[char])
        );

}


/* =========================================================
   INITIAL STATE
   ========================================================= */

showLogin();
