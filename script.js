/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
=====================================================

   IMPORTANT:
   Replace ALL values below with the config
   from Firebase Console > Project Settings > Your Apps
===================================================== */

const firebaseConfig = {

    apiKey: "PASTE_YOUR_REAL_API_KEY_HERE",

    authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",

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


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =====================================================
   GOOGLE APPS SCRIPT OTP URL
=====================================================

   After deploying your Apps Script as Web App,
   paste the URL here.

===================================================== */

const OTP_API_URL =
    "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";


/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;

let productsCache = {};

let currentProfile = {
    name: "",
    email: "",
    role: "Staff"
};


/* =====================================================
   DOM
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");


/* =====================================================
   PAGE SWITCHING
===================================================== */

function showOnly(page) {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");


    if (page === "login") {
        loginPage.classList.remove("hidden");
    }

    if (page === "register") {
        registerPage.classList.remove("hidden");
    }

    if (page === "otp") {
        otpPage.classList.remove("hidden");
    }

    if (page === "system") {
        systemPage.classList.remove("hidden");
    }
}


/* =====================================================
   LOGIN / REGISTER BUTTONS
===================================================== */

document
    .getElementById("showRegisterBtn")
    .addEventListener("click", () => {

        document.getElementById("loginError").textContent = "";

        showOnly("register");

    });


document
    .getElementById("showLoginBtn")
    .addEventListener("click", () => {

        document.getElementById("registerError").textContent = "";

        showOnly("login");

    });


/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        const loginBtn =
            document.getElementById("loginBtn");


        const errorBox =
            document.getElementById("loginError");


        errorBox.textContent = "";


        if (!email || !password) {

            errorBox.textContent =
                "Please enter your email and password.";

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent = "Logging in...";


        try {

            /*
             * Firebase email/password login
             */

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            currentUser =
                credential.user;


            /*
             * Save pending user
             */

            sessionStorage.setItem(
                "pendingEmail",
                currentUser.email
            );

            sessionStorage.setItem(
                "pendingUid",
                currentUser.uid
            );


            /*
             * Send OTP
             */

            await sendOTP(currentUser.email);


            /*
             * Show OTP page
             */

            document.getElementById(
                "otpEmail"
            ).textContent =
                currentUser.email;


            document.getElementById(
                "otpInput"
            ).value = "";


            document.getElementById(
                "otpError"
            ).textContent = "";


            document.getElementById(
                "otpMessage"
            ).textContent =
                "OTP sent successfully. Check your Gmail.";


            showOnly("otp");


        } catch (firebaseError) {

            console.error(
                "Login error:",
                firebaseError
            );


            errorBox.textContent =
                getFirebaseErrorMessage(
                    firebaseError
                );


        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent = "Login";

        }

    });


/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const name =
            document
                .getElementById("registerName")
                .value
                .trim();


        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        const registerBtn =
            document.getElementById("registerBtn");


        const errorBox =
            document.getElementById("registerError");


        errorBox.textContent = "";


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


        registerBtn.disabled = true;

        registerBtn.textContent =
            "Creating account...";


        try {

            /*
             * Create Firebase account
             */

            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            currentUser =
                credential.user;


            /*
             * Set display name
             */

            await updateProfile(
                currentUser,
                {
                    displayName: name
                }
            );


            /*
             * Save user profile in RTDB
             */

            await set(
                ref(
                    db,
                    `users/${currentUser.uid}`
                ),
                {
                    name: name,
                    email: email,
                    role: "Staff",
                    uid: currentUser.uid,
                    createdAt: Date.now()
                }
            );


            /*
             * Activity log
             */

            await addActivity(
                "REGISTER",
                "New account created"
            );


            /*
             * Save session
             */

            sessionStorage.setItem(
                "pendingEmail",
                email
            );

            sessionStorage.setItem(
                "pendingUid",
                currentUser.uid
            );


            /*
             * Send OTP
             */

            await sendOTP(email);


            document.getElementById(
                "otpEmail"
            ).textContent = email;


            document.getElementById(
                "otpInput"
            ).value = "";


            document.getElementById(
                "otpError"
            ).textContent = "";


            document.getElementById(
                "otpMessage"
            ).textContent =
                "Account created. OTP sent to your email.";


            showOnly("otp");


        } catch (firebaseError) {

            console.error(
                "Register error:",
                firebaseError
            );


            errorBox.textContent =
                getFirebaseErrorMessage(
                    firebaseError
                );


        } finally {

            registerBtn.disabled = false;

            registerBtn.textContent =
                "Create Account";

        }

    });


/* =====================================================
   SEND OTP
===================================================== */

async function sendOTP(email) {

    /*
     * If Apps Script URL is not configured,
     * stop here with clear error.
     */

    if (
        !OTP_API_URL ||
        OTP_API_URL.includes("PASTE_YOUR")
    ) {

        throw new Error(
            "OTP service is not configured. Paste your Google Apps Script Web App URL in script.js."
        );
    }


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
                    email: email
                })
            }
        );


    if (!response.ok) {

        throw new Error(
            "Unable to contact OTP service."
        );
    }


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.message ||
            "OTP could not be sent."
        );
    }


    return result;

}


/* =====================================================
   VERIFY OTP
===================================================== */

document
    .getElementById("otpForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const otp =
            document
                .getElementById("otpInput")
                .value
                .trim();


        const email =
            sessionStorage.getItem(
                "pendingEmail"
            );


        const errorBox =
            document.getElementById("otpError");


        const messageBox =
            document.getElementById("otpMessage");


        const verifyBtn =
            document.getElementById(
                "verifyOtpBtn"
            );


        errorBox.textContent = "";

        messageBox.textContent = "";


        if (!/^\d{6}$/.test(otp)) {

            errorBox.textContent =
                "Enter the 6-digit OTP.";

            return;
        }


        if (!email) {

            errorBox.textContent =
                "Session expired. Please login again.";

            return;
        }


        verifyBtn.disabled = true;

        verifyBtn.textContent =
            "Verifying...";


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
                            action: "verifyOtp",
                            email: email,
                            otp: otp
                        })
                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Invalid OTP."
                );
            }


            /*
             * OTP successful
             */

            sessionStorage.setItem(
                "otpVerified",
                "true"
            );


            messageBox.textContent =
                "Verification successful!";


            await loadCurrentUser();


            setTimeout(() => {

                showOnly("system");

                showSystemPage("dashboard");

                loadDashboard();

            }, 500);


        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );


            errorBox.textContent =
                error.message ||
                "OTP verification failed.";

        } finally {

            verifyBtn.disabled = false;

            verifyBtn.textContent =
                "Verify OTP";

        }

    });


/* =====================================================
   RESEND OTP
===================================================== */

document
    .getElementById("resendOtp")
    .addEventListener("click", async () => {

        const email =
            sessionStorage.getItem(
                "pendingEmail"
            );


        const errorBox =
            document.getElementById(
                "otpError"
            );


        const messageBox =
            document.getElementById(
                "otpMessage"
            );


        if (!email) {

            errorBox.textContent =
                "Session expired. Please login again.";

            return;
        }


        errorBox.textContent = "";

        messageBox.textContent =
            "Sending new OTP...";


        try {

            await sendOTP(email);


            messageBox.textContent =
                "New OTP sent to your Gmail.";


        } catch (error) {

            console.error(error);

            errorBox.textContent =
                error.message;

            messageBox.textContent = "";

        }

    });


/* =====================================================
   BACK TO LOGIN
===================================================== */

document
    .getElementById("backLogin")
    .addEventListener("click", async () => {

        try {
            await signOut(auth);
        } catch (error) {
            console.error(error);
        }


        sessionStorage.clear();

        showOnly("login");

    });


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


                document
                    .querySelectorAll(".nav-btn")
                    .forEach(btn => {
                        btn.classList.remove(
                            "active"
                        );
                    });


                button.classList.add("active");


                showSystemPage(page);

            }
        );

    });


/* =====================================================
   SHOW SYSTEM PAGE
===================================================== */

function showSystemPage(page) {

    const pages = {

        dashboard:
            "dashboardPage",

        inventory:
            "inventoryPage",

        addProduct:
            "addProductPage",

        activity:
            "activityPage",

        users:
            "usersPage"

    };


    Object.values(pages)
        .forEach(id => {

            document
                .getElementById(id)
                .classList.add("hidden");

        });


    if (pages[page]) {

        document
            .getElementById(
                pages[page]
            )
            .classList.remove("hidden");

    }


    const titles = {

        dashboard: "Dashboard",

        inventory: "Inventory",

        addProduct: "Add Product",

        activity: "Activity Logs",

        users: "Account"

    };


    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[page] || "Dashboard";


    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "inventory") {
        renderInventory();
    }

    if (page === "activity") {
        loadActivityLogs();
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
    .addEventListener("click", () => {

        resetProductForm();

        showSystemPage("addProduct");

        setActiveNav("addProduct");

    });


/* =====================================================
   CANCEL PRODUCT
===================================================== */

document
    .getElementById("cancelProductBtn")
    .addEventListener("click", () => {

        resetProductForm();

        showSystemPage("inventory");

        setActiveNav("inventory");

    });


/* =====================================================
   PRODUCT FORM
===================================================== */

document
    .getElementById("productForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        if (!currentUser) {

            alert("Please login first.");

            return;
        }


        const productId =
            document.getElementById(
                "editingProductId"
            ).value;


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


        const message =
            document.getElementById(
                "productMessage"
            );


        const saveBtn =
            document.getElementById(
                "saveProductBtn"
            );


        if (
            !name ||
            !sku ||
            !category ||
            quantity < 0 ||
            price < 0 ||
            threshold < 0
        ) {

            message.textContent =
                "Please complete all fields correctly.";

            message.style.color =
                "var(--red)";

            return;
        }


        saveBtn.disabled = true;

        saveBtn.textContent =
            productId
                ? "Updating..."
                : "Saving...";


        try {

            const product = {

                name: name,

                sku: sku,

                category: category,

                quantity: quantity,

                price: price,

                lowStockThreshold:
                    threshold,

                updatedAt: Date.now(),

                updatedBy:
                    currentUser.uid

            };


            if (productId) {

                /*
                 * UPDATE
                 */

                await set(
                    ref(
                        db,
                        `bakeryProducts/${productId}`
                    ),
                    product
                );


                await addActivity(
                    "UPDATE PRODUCT",
                    `${name} (${sku}) updated`
                );


            } else {

                /*
                 * ADD
                 */

                const newRef =
                    push(
                        ref(
                            db,
                            "bakeryProducts"
                        )
                    );


                product.createdAt =
                    Date.now();


                product.createdBy =
                    currentUser.uid;


                await set(
                    newRef,
                    product
                );


                await addActivity(
                    "ADD PRODUCT",
                    `${name} (${sku}) added`
                );

            }


            message.textContent =
                productId
                    ? "Product updated successfully!"
                    : "Product added successfully!";


            message.style.color =
                "var(--green)";


            resetProductForm();


            setTimeout(() => {

                showSystemPage(
                    "inventory"
                );

                setActiveNav(
                    "inventory"
                );

            }, 600);


        } catch (error) {

            console.error(
                "Product save error:",
                error
            );


            message.textContent =
                error.message;


            message.style.color =
                "var(--red)";

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                "Save Product";

        }

    });


/* =====================================================
   RESET PRODUCT FORM
===================================================== */

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
            "productFormTitle"
        )
        .textContent =
        "Add Product";


    document
        .getElementById(
            "lowStockThreshold"
        )
        .value = 5;


    document
        .getElementById(
            "productMessage"
        )
        .textContent = "";

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

window.editProduct = function (id) {

    const product =
        productsCache[id];


    if (!product) {

        alert("Product not found.");

        return;
    }


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


    showSystemPage(
        "addProduct"
    );


    setActiveNav(
        "addProduct"
    );

};


/* =====================================================
   DELETE PRODUCT
===================================================== */

window.deleteProduct = async function (id) {

    const product =
        productsCache[id];


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
                `bakeryProducts/${id}`
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            `${product.name} (${product.sku}) deleted`
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Unable to delete product: " +
            error.message
        );

    }

};


/* =====================================================
   LOAD PRODUCTS
===================================================== */

function loadProducts() {

    const productsRef =
        ref(
            db,
            "bakeryProducts"
        );


    onValue(
        productsRef,
        snapshot => {

            productsCache =
                snapshot.val() || {};


            renderInventory();

            loadDashboard();

        },
        error => {

            console.error(
                "Database read error:",
                error
            );

        }
    );

}


/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!tbody) {
        return;
    }


    const search =
        document
            .getElementById(
                "searchProduct"
            )
            .value
            .trim()
            .toLowerCase();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )
            .value;


    tbody.innerHTML = "";


    const entries =
        Object.entries(
            productsCache
        );


    const filtered =
        entries.filter(
            ([id, product]) => {

                const matchesSearch =
                    !search ||
                    String(
                        product.name || ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        product.sku || ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all" ||
                    product.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-text">
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
                    product.lowStockThreshold ?? 5
                );


            const isLow =
                quantity <= threshold;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(product.sku)}
                </td>

                <td>
                    ${escapeHTML(product.category)}
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
                        onclick="editProduct('${id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteProduct('${id}')"
                    >
                        Delete
                    </button>

                </td>
            `;


            tbody.appendChild(row);

        }
    );

}


/* =====================================================
   SEARCH / FILTER
===================================================== */

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


/* =====================================================
   DASHBOARD
===================================================== */

function loadDashboard() {

    const products =
        Object.values(
            productsCache
        );


    const totalProducts =
        products.length;


    const totalStock =
        products.reduce(
            (total, product) => {

                return total +
                    Number(
                        product.quantity || 0
                    );

            },
            0
        );


    const lowStockProducts =
        products.filter(
            product => {

                const quantity =
                    Number(
                        product.quantity || 0
                    );


                const threshold =
                    Number(
                        product.lowStockThreshold ?? 5
                    );


                return quantity <= threshold;

            }
        );


    const estimatedValue =
        products.reduce(
            (total, product) => {

                return total +
                    (
                        Number(
                            product.quantity || 0
                        ) *
                        Number(
                            product.price || 0
                        )
                    );

            },
            0
        );


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
        lowStockProducts.length;


    document.getElementById(
        "estimatedValue"
    ).textContent =
        "₱" +
        estimatedValue.toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    renderLowStock(
        lowStockProducts
    );

}


/* =====================================================
   LOW STOCK
===================================================== */

function renderLowStock(products) {

    const container =
        document.getElementById(
            "lowStockList"
        );


    if (!products.length) {

        container.innerHTML = `
            <p class="empty-text">
                No low stock products.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    products
        .slice(0, 8)
        .forEach(product => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "stock-item";


            item.innerHTML = `

                <span class="stock-name">
                    ${escapeHTML(product.name)}
                </span>

                <span class="stock-qty">
                    ${Number(product.quantity || 0)} left
                </span>

            `;


            container.appendChild(item);

        });

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


    try {

        const newActivity =
            push(
                ref(
                    db,
                    "activityLogs"
                )
            );


        await set(
            newActivity,
            {

                userId:
                    currentUser.uid,

                userName:
                    currentUser.displayName ||
                    currentProfile.name ||
                    currentUser.email,

                userEmail:
                    currentUser.email,

                action:
                    action,

                details:
                    details,

                timestamp:
                    Date.now()

            }
        );


    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );

    }

}


/* =====================================================
   LOAD ACTIVITY
===================================================== */

function loadActivityLogs() {

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


            const activities =
                Object.values(data)
                    .sort(
                        (a, b) =>
                            Number(
                                b.timestamp || 0
                            ) -
                            Number(
                                a.timestamp || 0
                            )
                    )
                    .slice(0, 100);


            const tbody =
                document.getElementById(
                    "activityTableBody"
                );


            tbody.innerHTML = "";


            if (!activities.length) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-text">
                            No activity logs.
                        </td>
                    </tr>
                `;

                return;
            }


            activities.forEach(activity => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${formatDate(activity.timestamp)}
                    </td>

                    <td>
                        ${escapeHTML(
                            activity.userName || "Unknown"
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                activity.action || ""
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            activity.details || ""
                        )}
                    </td>

                `;


                tbody.appendChild(row);

            });


            renderRecentActivity(
                activities
            );

        },
        error => {

            console.error(
                "Activity database error:",
                error
            );

        }
    );

}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

function renderRecentActivity(
    activities
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!activities.length) {

        container.innerHTML = `
            <p class="empty-text">
                No recent activity.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    activities
        .slice(0, 5)
        .forEach(activity => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(
                        activity.action || ""
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        activity.details || ""
                    )}
                </span>

                <span>
                    ${formatDate(
                        activity.timestamp
                    )}
                </span>

            `;


            container.appendChild(item);

        });

}


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadCurrentUser() {

    if (!currentUser) {
        return;
    }


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}`
                )
            );


        if (snapshot.exists()) {

            currentProfile =
                snapshot.val();

        } else {

            currentProfile = {

                name:
                    currentUser.displayName ||
                    "Staff",

                email:
                    currentUser.email,

                role:
                    "Staff",

                uid:
                    currentUser.uid

            };

        }


        updateUserUI();


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );


        currentProfile = {

            name:
                currentUser.displayName ||
                "Staff",

            email:
                currentUser.email,

            role:
                "Staff"

        };


        updateUserUI();

    }

}


/* =====================================================
   PROFILE UI
===================================================== */

function updateUserUI() {

    const name =
        currentProfile.name ||
        currentUser?.displayName ||
        "Staff";


    const email =
        currentProfile.email ||
        currentUser?.email ||
        "";


    const role =
        currentProfile.role ||
        "Staff";


    document.getElementById(
        "currentUserName"
    ).textContent = name;


    document.getElementById(
        "headerUserName"
    ).textContent = name;


    document.getElementById(
        "headerUserEmail"
    ).textContent = email;


    document.getElementById(
        "userRole"
    ).textContent = role;


    document.getElementById(
        "profileName"
    ).textContent = name;


    document.getElementById(
        "profileEmail"
    ).textContent = email;


    document.getElementById(
        "profileRole"
    ).textContent = role;

}


function loadProfile() {

    updateUserUI();

}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }


        currentUser = null;

        productsCache = {};

        sessionStorage.clear();

        showOnly("login");


        document.getElementById(
            "loginPassword"
        ).value = "";


        document.getElementById(
            "loginError"
        ).textContent = "";

    });


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            if (
                !systemPage.classList.contains(
                    "hidden"
                )
            ) {

                showOnly("login");

            }

            return;
        }


        currentUser = user;


        const otpVerified =
            sessionStorage.getItem(
                "otpVerified"
            ) === "true";


        /*
         * Only open dashboard after OTP
         */

        if (otpVerified) {

            await loadCurrentUser();

            showOnly("system");

            showSystemPage(
                "dashboard"
            );

        } else {

            /*
             * User is authenticated in Firebase
             * but has not completed OTP.
             */

            showOnly("login");

        }

    }
);


/* =====================================================
   SET ACTIVE NAV
===================================================== */

function setActiveNav(page) {

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });

}


/* =====================================================
   FIREBASE ERROR MESSAGES
===================================================== */

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-api-key":
            return "Firebase API key is invalid. Replace the firebaseConfig with the actual config from Firebase Console.";

        case "auth/api-key-not-valid":
            return "Firebase API key is invalid. Copy the correct Web API Key from Firebase Console.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/wrong-password":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        default:

            return error?.message ||
                "Something went wrong.";

    }

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }


    return new Date(
        Number(timestamp)
    ).toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =====================================================
   START DATABASE LISTENER
===================================================== */

loadProducts();

console.log(
    "Arbee's Bakery Shop system loaded."
);
