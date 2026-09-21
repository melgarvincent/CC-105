import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey: "PASTE_YOUR_API_KEY_HERE",

    authDomain:
        "crudfirebase-b2a1f-default.firebaseapp.com",

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


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();


/* =====================================================
   DOM
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");

const googleLoginBtn =
    document.getElementById("googleLoginBtn");

const loginError =
    document.getElementById("loginError");

const otpError =
    document.getElementById("otpError");

const otpMessage =
    document.getElementById("otpMessage");

const phoneStep =
    document.getElementById("phoneStep");

const otpStep =
    document.getElementById("otpStep");

const phoneNumber =
    document.getElementById("phoneNumber");

const otpCode =
    document.getElementById("otpCode");

const sendOtpBtn =
    document.getElementById("sendOtpBtn");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const resendOtpBtn =
    document.getElementById("resendOtpBtn");

const otpBackBtn =
    document.getElementById("otpBackBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentUser = null;

let confirmationResult = null;

let recaptchaVerifier = null;

let editingProductId = null;


/* =====================================================
   PAGE FUNCTIONS
===================================================== */

function showLogin() {

    loginPage.classList.remove("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");

}


function showOTP() {

    loginPage.classList.add("hidden");

    otpPage.classList.remove("hidden");

    systemPage.classList.add("hidden");

}


function showSystem() {

    loginPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.remove("hidden");

    loadDashboard();

}


/* =====================================================
   GOOGLE LOGIN
===================================================== */

googleLoginBtn.addEventListener(
    "click",
    async () => {

        loginError.textContent = "";

        googleLoginBtn.disabled = true;

        googleLoginBtn.textContent =
            "Connecting to Google...";

        try {

            const result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );

            currentUser = result.user;

            /*
             * Google authentication completed.
             * The user still needs phone OTP.
             */

            sessionStorage.setItem(
                "googleVerified",
                "true"
            );

            showOTP();

            prepareRecaptcha();

        } catch (error) {

            console.error(error);

            loginError.textContent =
                getAuthError(error);

        } finally {

            googleLoginBtn.disabled = false;

            googleLoginBtn.innerHTML =
                '<span class="google-icon">G</span> Continue with Google';

        }

    }
);


/* =====================================================
   RECAPTCHA
===================================================== */

function prepareRecaptcha() {

    if (recaptchaVerifier) {

        try {
            recaptchaVerifier.clear();
        } catch (e) {}

        recaptchaVerifier = null;
    }

    recaptchaVerifier =
        new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {

                size: "normal",

                callback: () => {

                    otpMessage.textContent =
                        "Verification completed. You can send the OTP.";

                },

                "expired-callback": () => {

                    otpMessage.textContent =
                        "reCAPTCHA expired. Please verify again.";

                }

            }
        );

    recaptchaVerifier.render();
}


/* =====================================================
   PHONE NUMBER FORMAT
===================================================== */

function formatPhilippineNumber(value) {

    let phone = value.trim();

    /*
     * 09171234567
     * becomes
     * +639171234567
     */

    if (phone.startsWith("09")) {

        phone =
            "+63" +
            phone.substring(1);

    }

    /*
     * 639171234567
     * becomes
     * +639171234567
     */

    if (phone.startsWith("639")) {

        phone =
            "+" +
            phone;

    }

    return phone;
}


/* =====================================================
   SEND OTP
===================================================== */

sendOtpBtn.addEventListener(
    "click",
    async () => {

        otpError.textContent = "";

        otpMessage.textContent = "";

        if (!currentUser) {

            otpError.textContent =
                "Please login with Google first.";

            return;
        }

        let phone =
            formatPhilippineNumber(
                phoneNumber.value
            );

        if (
            !phone.startsWith("+63") ||
            phone.length < 13
        ) {

            otpError.textContent =
                "Enter a valid Philippine number, example: +639171234567";

            return;
        }

        try {

            sendOtpBtn.disabled = true;

            sendOtpBtn.textContent =
                "Sending OTP...";


            if (!recaptchaVerifier) {

                prepareRecaptcha();

            }


            /*
             * Link the phone number to the
             * currently authenticated Google user.
             */

            confirmationResult =
                await linkWithPhoneNumber(
                    currentUser,
                    phone,
                    recaptchaVerifier
                );


            phoneStep.classList.add("hidden");

            otpStep.classList.remove("hidden");

            otpMessage.textContent =
                "OTP sent to " + phone;


        } catch (error) {

            console.error(error);

            otpError.textContent =
                getAuthError(error);

            resetRecaptcha();

        } finally {

            sendOtpBtn.disabled = false;

            sendOtpBtn.textContent =
                "Send OTP";

        }

    }
);


/* =====================================================
   VERIFY OTP
===================================================== */

verifyOtpBtn.addEventListener(
    "click",
    async () => {

        otpError.textContent = "";

        otpMessage.textContent = "";

        const code =
            otpCode.value.trim();

        if (!confirmationResult) {

            otpError.textContent =
                "Please request an OTP first.";

            return;
        }

        if (!/^\d{6}$/.test(code)) {

            otpError.textContent =
                "Enter the 6-digit OTP.";

            return;
        }

        try {

            verifyOtpBtn.disabled = true;

            verifyOtpBtn.textContent =
                "Verifying...";


            /*
             * Confirm the SMS code.
             */

            const result =
                await confirmationResult.confirm(code);

            currentUser = result.user;

            sessionStorage.setItem(
                "otpVerified",
                "true"
            );


            /*
             * Save user information to RTDB.
             */

            await saveUserToDatabase(
                currentUser
            );


            await addActivity(
                "Login",
                "Google authentication and OTP verification successful."
            );


            showSystem();

        } catch (error) {

            console.error(error);

            otpError.textContent =
                getAuthError(error);

        } finally {

            verifyOtpBtn.disabled = false;

            verifyOtpBtn.textContent =
                "Verify OTP";

        }

    }
);


/* =====================================================
   RESEND OTP
===================================================== */

resendOtpBtn.addEventListener(
    "click",
    async () => {

        otpStep.classList.add("hidden");

        phoneStep.classList.remove("hidden");

        otpCode.value = "";

        otpError.textContent = "";

        otpMessage.textContent =
            "Enter your phone number again.";

        resetRecaptcha();

        setTimeout(() => {

            prepareRecaptcha();

        }, 300);

    }
);


/* =====================================================
   BACK TO LOGIN
===================================================== */

otpBackBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(error);

        }

        sessionStorage.clear();

        currentUser = null;

        resetOTPPage();

        showLogin();

    }
);


/* =====================================================
   RESET RECAPTCHA
===================================================== */

function resetRecaptcha() {

    if (recaptchaVerifier) {

        try {

            recaptchaVerifier.clear();

        } catch (error) {

            console.error(error);

        }

        recaptchaVerifier = null;

    }

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    if (container) {

        container.innerHTML = "";

    }

}


/* =====================================================
   RESET OTP PAGE
===================================================== */

function resetOTPPage() {

    phoneStep.classList.remove("hidden");

    otpStep.classList.add("hidden");

    phoneNumber.value = "";

    otpCode.value = "";

    otpError.textContent = "";

    otpMessage.textContent = "";

    confirmationResult = null;

    resetRecaptcha();

}


/* =====================================================
   SAVE USER TO RTDB
===================================================== */

async function saveUserToDatabase(user) {

    const userRef =
        ref(db, "users/" + user.uid);

    const snapshot =
        await get(userRef);

    const oldData =
        snapshot.exists()
            ? snapshot.val()
            : {};

    await set(
        userRef,
        {

            uid: user.uid,

            name:
                user.displayName ||
                oldData.name ||
                "User",

            email:
                user.email ||
                oldData.email ||
                "",

            photoURL:
                user.photoURL ||
                oldData.photoURL ||
                "MY PICTURE.jpg",

            phoneNumber:
                user.phoneNumber ||
                oldData.phoneNumber ||
                "",

            role:
                oldData.role ||
                "staff",

            googleVerified: true,

            otpVerified: true,

            lastLogin:
                new Date().toISOString(),

            createdAt:
                oldData.createdAt ||
                new Date().toISOString()

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await addActivity(
                "Logout",
                "User logged out of the system."
            );

        } catch (error) {

            console.error(error);

        }

        await signOut(auth);

        sessionStorage.clear();

        currentUser = null;

        resetOTPPage();

        showLogin();

    }
);


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser = user;

        if (!user) {

            showLogin();

            return;

        }


        /*
         * If Google login happened but OTP
         * has not been completed, stay on OTP.
         */

        const otpVerified =
            sessionStorage.getItem(
                "otpVerified"
            );

        if (otpVerified === "true") {

            showSystem();

        } else {

            showOTP();

            prepareRecaptcha();

        }

    }
);


/* =====================================================
   NAVIGATION
===================================================== */

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


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.add("hidden");

        });


    const selected =
        document.getElementById(
            page + "Page"
        );

    if (selected) {

        selected.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    const activeButton =
        document.querySelector(
            `[data-page="${page}"]`
        );

    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }


    const titles = {

        dashboard: "Dashboard",

        inventory: "Inventory",

        addProduct: "Add Product",

        activity: "Activity Logs",

        users: "My Account"

    };

    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[page] || "Dashboard";


    if (page === "dashboard") {

        loadDashboard();

    }

    if (page === "inventory") {

        loadInventory();

    }

    if (page === "activity") {

        loadActivities();

    }

    if (page === "users") {

        loadProfile();

    }

}


/* =====================================================
   ADD PRODUCT BUTTON
===================================================== */

document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        () => {

            startAddProduct();

        }
    );


document
    .getElementById("cancelProductBtn")
    .addEventListener(
        "click",
        () => {

            startAddProduct();

            showPage("inventory");

        }
    );


/* =====================================================
   PRODUCT FORM
===================================================== */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const name =
                document.getElementById(
                    "productName"
                ).value.trim();

            const sku =
                document.getElementById(
                    "productSKU"
                ).value.trim();

            const category =
                document.getElementById(
                    "productCategory"
                ).value;

            const quantity =
                Number(
                    document.getElementById(
                        "productQuantity"
                    ).value
                );

            const price =
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                );

            const threshold =
                Number(
                    document.getElementById(
                        "lowStockThreshold"
                    ).value
                );


            if (
                !name ||
                !sku ||
                !category ||
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                showProductMessage(
                    "Please complete all fields.",
                    true
                );

                return;
            }


            try {

                let productId =
                    editingProductId;


                if (productId) {

                    const productRef =
                        ref(
                            db,
                            "bakeryProducts/" +
                            productId
                        );

                    await update(
                        productRef,
                        {

                            name,

                            sku,

                            category,

                            quantity,

                            price,

                            threshold,

                            updatedAt:
                                new Date()
                                    .toISOString()

                        }
                    );


                    await addActivity(
                        "Update Product",
                        `${name} (${sku}) was updated.`
                    );


                    showProductMessage(
                        "Product updated successfully."
                    );


                } else {

                    const newProductRef =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    await set(
                        newProductRef,
                        {

                            name,

                            sku,

                            category,

                            quantity,

                            price,

                            threshold,

                            createdAt:
                                new Date()
                                    .toISOString(),

                            createdBy:
                                currentUser
                                    ? currentUser.uid
                                    : ""

                        }
                    );


                    await addActivity(
                        "Add Product",
                        `${name} (${sku}) was added.`
                    );


                    showProductMessage(
                        "Product added successfully."
                    );

                }


                document
                    .getElementById(
                        "productForm"
                    )
                    .reset();

                editingProductId = null;

                document.getElementById(
                    "productFormTitle"
                ).textContent =
                    "Add Product";


                await loadInventory();

                await loadDashboard();


            } catch (error) {

                console.error(error);

                showProductMessage(
                    error.message,
                    true
                );

            }

        }
    );


function showProductMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "productMessage"
        );

    element.textContent = message;

    element.style.color =
        isError
            ? "#d9534f"
            : "#2e8b57";

}


/* =====================================================
   START ADD PRODUCT
===================================================== */

function startAddProduct() {

    editingProductId = null;

    document
        .getElementById("productForm")
        .reset();

    document.getElementById(
        "productFormTitle"
    ).textContent =
        "Add Product";

    showPage("addProduct");

}


/* =====================================================
   LOAD INVENTORY
===================================================== */

async function loadInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );

    tbody.innerHTML = "";

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "bakeryProducts"
                )
            );


        if (!snapshot.exists()) {

            tbody.innerHTML = `
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

                    addProductRow(
                        tbody,
                        id,
                        product
                    );

                }
            );


        applyFilters();

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Error loading inventory.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   PRODUCT ROW
===================================================== */

function addProductRow(
    tbody,
    id,
    product
) {

    const quantity =
        Number(product.quantity || 0);

    const threshold =
        Number(product.threshold || 0);


    let statusText =
        "IN STOCK";

    let statusClass =
        "in-stock";


    if (quantity === 0) {

        statusText =
            "OUT OF STOCK";

        statusClass =
            "out-stock";

    } else if (
        quantity <= threshold
    ) {

        statusText =
            "LOW STOCK";

        statusClass =
            "low-stock";

    }


    const row =
        document.createElement("tr");


    row.dataset.name =
        (product.name || "")
            .toLowerCase();

    row.dataset.category =
        product.category || "";


    row.innerHTML = `

        <td>${escapeHTML(product.name || "")}</td>

        <td>${escapeHTML(product.sku || "")}</td>

        <td>${escapeHTML(product.category || "")}</td>

        <td>${quantity}</td>

        <td>
            ₱${Number(product.price || 0)
                .toFixed(2)}
        </td>

        <td>
            <span class="status ${statusClass}">
                ${statusText}
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


    row
        .querySelector(
            `[data-edit="${id}"]`
        )
        .addEventListener(
            "click",
            () => {

                editProduct(
                    id,
                    product
                );

            }
        );


    row
        .querySelector(
            `[data-delete="${id}"]`
        )
        .addEventListener(
            "click",
            () => {

                deleteProduct(
                    id,
                    product
                );

            }
        );

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(
    id,
    product
) {

    editingProductId = id;

    document.getElementById(
        "productName"
    ).value =
        product.name || "";

    document.getElementById(
        "productSKU"
    ).value =
        product.sku || "";

    document.getElementById(
        "productCategory"
    ).value =
        product.category || "";

    document.getElementById(
        "productQuantity"
    ).value =
        product.quantity || 0;

    document.getElementById(
        "productPrice"
    ).value =
        product.price || 0;

    document.getElementById(
        "lowStockThreshold"
    ).value =
        product.threshold ?? 5;

    document.getElementById(
        "productFormTitle"
    ).textContent =
        "Edit Product";


    showPage("addProduct");

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(
    id,
    product
) {

    const confirmDelete =
        confirm(
            `Delete ${product.name}?`
        );

    if (!confirmDelete) {

        return;

    }


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" +
                id
            )
        );


        await addActivity(
            "Delete Product",
            `${product.name} (${product.sku}) was deleted.`
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


/* =====================================================
   SEARCH + CATEGORY
===================================================== */

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        applyFilters
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        applyFilters
    );


function applyFilters() {

    const search =
        document.getElementById(
            "searchProduct"
        ).value
            .toLowerCase()
            .trim();

    const category =
        document.getElementById(
            "categoryFilter"
        ).value;


    document
        .querySelectorAll(
            "#inventoryTableBody tr"
        )
        .forEach(row => {

            const name =
                row.dataset.name || "";

            const rowCategory =
                row.dataset.category || "";


            const matchesSearch =
                name.includes(search);

            const matchesCategory =
                category === "all" ||
                rowCategory === category;


            row.style.display =
                matchesSearch &&
                matchesCategory
                    ? ""
                    : "none";

        });

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    if (!currentUser) {

        return;

    }


    document.getElementById(
        "currentUserName"
    ).textContent =
        currentUser.displayName ||
        "User";


    document.getElementById(
        "headerUserName"
    ).textContent =
        currentUser.displayName ||
        "User";


    document.getElementById(
        "headerUserEmail"
    ).textContent =
        currentUser.email ||
        "";


    const photo =
        currentUser.photoURL ||
        "MY PICTURE.jpg";


    document.getElementById(
        "headerUserPhoto"
    ).src = photo;


    document.getElementById(
        "profilePhoto"
    ).src = photo;


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "bakeryProducts"
                )
            );


        let totalProducts = 0;

        let totalStock = 0;

        let lowStock = 0;

        let estimatedValue = 0;


        const lowStockProducts = [];


        if (snapshot.exists()) {

            const products =
                snapshot.val();


            Object.values(products)
                .forEach(product => {

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


                    totalProducts++;

                    totalStock += quantity;

                    estimatedValue +=
                        quantity * price;


                    if (
                        quantity <= threshold
                    ) {

                        lowStock++;

                        lowStockProducts
                            .push(product);

                    }

                });

        }


        document.getElementById(
            "totalProducts"
        ).textContent =
            totalProducts;


        document.getElementById(
            "totalStock"
        ).textContent =
            totalStock;


        document.getElementById(
            "lowStock"
        ).textContent =
            lowStock;


        document.getElementById(
            "estimatedValue"
        ).textContent =
            "₱" +
            estimatedValue.toFixed(2);


        displayLowStock(
            lowStockProducts
        );


        await loadRecentActivity();

    } catch (error) {

        console.error(error);

    }

}


/* =====================================================
   LOW STOCK
===================================================== */

function displayLowStock(products) {

    const container =
        document.getElementById(
            "lowStockList"
        );


    if (!products.length) {

        container.innerHTML = `
            <p class="empty">
                No low-stock products.
            </p>
        `;

        return;
    }


    container.innerHTML =
        products
            .slice(0, 5)
            .map(product => `

                <div style="
                    padding:10px 0;
                    border-bottom:1px solid #eee;
                ">

                    <strong>
                        ${escapeHTML(product.name || "")}
                    </strong>

                    <span style="
                        float:right;
                        color:#a75b00;
                    ">
                        ${product.quantity}
                    </span>

                </div>

            `)
            .join("");

}


/* =====================================================
   ACTIVITY LOG
===================================================== */

async function addActivity(
    action,
    details
) {

    if (!currentUser) {

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

            userId:
                currentUser.uid,

            user:
                currentUser.displayName ||
                currentUser.email ||
                "User",

            action,

            details,

            timestamp:
                new Date()
                    .toISOString()

        }
    );

}


/* =====================================================
   LOAD ACTIVITY
===================================================== */

async function loadActivities() {

    const tbody =
        document.getElementById(
            "activityTableBody"
        );


    tbody.innerHTML = "";


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "activityLogs"
                )
            );


        if (!snapshot.exists()) {

            tbody.innerHTML = `
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
            )
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            );


        logs.forEach(log => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${formatDate(log.timestamp)}
                </td>

                <td>
                    ${escapeHTML(log.user || "")}
                </td>

                <td>
                    ${escapeHTML(log.action || "")}
                </td>

                <td>
                    ${escapeHTML(log.details || "")}
                </td>

            `;


            tbody.appendChild(row);

        });


    } catch (error) {

        console.error(error);

    }

}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

async function loadRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "activityLogs"
                )
            );


        if (!snapshot.exists()) {

            container.innerHTML = `
                <p class="empty">
                    No recent activity.
                </p>
            `;

            return;

        }


        const logs =
            Object.values(
                snapshot.val()
            )
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            )
            .slice(0, 5);


        container.innerHTML =
            logs.map(log => `

                <div style="
                    padding:10px 0;
                    border-bottom:1px solid #eee;
                ">

                    <strong>
                        ${escapeHTML(log.action || "")}
                    </strong>

                    <br>

                    <small>
                        ${escapeHTML(log.details || "")}
                    </small>

                    <br>

                    <small style="color:#888">
                        ${formatDate(log.timestamp)}
                    </small>

                </div>

            `).join("");


    } catch (error) {

        console.error(error);

    }

}


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

    if (!currentUser) {

        return;

    }


    document.getElementById(
        "profileName"
    ).textContent =
        currentUser.displayName ||
        "User";


    document.getElementById(
        "profileEmail"
    ).textContent =
        currentUser.email ||
        "";


    document.getElementById(
        "profilePhoto"
    ).src =
        currentUser.photoURL ||
        "MY PICTURE.jpg";


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            document.getElementById(
                "profileRole"
            ).textContent =
                data.role || "Staff";

        }

    } catch (error) {

        console.error(error);

    }

}


/* =====================================================
   HELPER
===================================================== */

function formatDate(timestamp) {

    if (!timestamp) {

        return "-";

    }

    return new Date(timestamp)
        .toLocaleString();

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getAuthError(error) {

    const code =
        error?.code || "";


    const errors = {

        "auth/popup-closed-by-user":
            "Google login was cancelled.",

        "auth/popup-blocked":
            "Your browser blocked the Google login popup.",

        "auth/network-request-failed":
            "Network error. Check your internet connection.",

        "auth/invalid-phone-number":
            "Invalid phone number.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/code-expired":
            "The OTP has expired. Request a new OTP.",

        "auth/invalid-verification-code":
            "Incorrect OTP code.",

        "auth/provider-already-linked":
            "This phone number is already linked to this account.",

        "auth/credential-already-in-use":
            "This phone number is already connected to another account.",

        "auth/operation-not-allowed":
            "This authentication provider is not enabled in Firebase."

    };


    return (
        errors[code] ||
        error?.message ||
        "Authentication failed."
    );

}
