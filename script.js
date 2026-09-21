// ============================================================
// ARBEES BAKERY SHOP
// Firebase Authentication + Realtime Database
// ============================================================

// ------------------------------------------------------------
// FIREBASE IMPORTS
// ------------------------------------------------------------

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove,
    update
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc",
    authDomain: "crudfirebase-b2a1f.firebaseapp.com",
    databaseURL: "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com",
    projectId: "crudfirebase-b2a1f",
    storageBucket: "crudfirebase-b2a1f.firebasestorage.app",
    messagingSenderId: "383674756572",
    appId: "1:383674756572:web:0585f268fb2cc8f5a6b319",
    measurementId: "G-QJXMR8ZQH8"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

let app;
let auth;
let db;

try {

    app = initializeApp(firebaseConfig);

    auth = getAuth(app);

    db = getDatabase(app);

    console.log("=================================");
    console.log("Firebase initialized successfully");
    console.log("Project:", firebaseConfig.projectId);
    console.log("Database:", firebaseConfig.databaseURL);
    console.log("=================================");

} catch (error) {

    console.error("Firebase initialization error:", error);

    alert(
        "Firebase failed to initialize.\n\n" +
        "Check your Firebase configuration and API key."
    );
}


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;

let editingProductId = null;

let productsData = {};

let activityData = {};

let inventoryListener = null;
let activityListener = null;
let userListener = null;

let currentPage = "dashboard";


// ============================================================
// DOM HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// PAGE ELEMENTS
// ============================================================

const loginPage = $("loginPage");
const registerPage = $("registerPage");
const otpPage = $("otpPage");
const gameApp = $("gameApp");


// ============================================================
// SHOW / HIDE ELEMENT
// ============================================================

function showElement(element) {

    if (!element) return;

    element.style.display = "";
}


function hideElement(element) {

    if (!element) return;

    element.style.display = "none";
}


// ============================================================
// SHOW LOGIN PAGE
// ============================================================

function showLogin() {

    hideElement(registerPage);
    hideElement(otpPage);
    hideElement(gameApp);

    showElement(loginPage);

    const email = $("loginEmail");

    if (email) {
        email.focus();
    }
}


// ============================================================
// SHOW REGISTER PAGE
// ============================================================

function showRegister() {

    hideElement(loginPage);
    hideElement(otpPage);
    hideElement(gameApp);

    showElement(registerPage);

    const name = $("registerName");

    if (name) {
        name.focus();
    }
}


// ============================================================
// SHOW SYSTEM
// ============================================================

function showSystem() {

    hideElement(loginPage);
    hideElement(registerPage);
    hideElement(otpPage);

    showElement(gameApp);

    showPage("dashboard");

    loadDashboard();
    loadInventory();
    loadActivity();
    loadUserProfile();
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

        currentUser = null;

        productsData = {};
        activityData = {};

        if (inventoryListener) {
            inventoryListener();
            inventoryListener = null;
        }

        if (activityListener) {
            activityListener();
            activityListener = null;
        }

        if (userListener) {
            userListener();
            userListener = null;
        }

        showLogin();

        console.log("User logged out.");

    } catch (error) {

        console.error("Logout error:", error);

        alert("Logout failed.\n\n" + getFirebaseErrorMessage(error));
    }
}


// ============================================================
// LOGIN
// ============================================================

async function loginUser() {

    const emailInput = $("loginEmail");
    const passwordInput = $("loginPassword");

    if (!emailInput || !passwordInput) {
        console.error("Login fields not found.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {

        alert("Please enter your email.");

        emailInput.focus();

        return;
    }

    if (!password) {

        alert("Please enter your password.");

        passwordInput.focus();

        return;
    }

    const loginButton =
        document.querySelector("#loginForm button[type='submit']") ||
        document.querySelector(".login-btn");

    if (loginButton) {
        loginButton.disabled = true;
    }

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        currentUser = userCredential.user;

        console.log(
            "Login successful:",
            currentUser.email
        );

        showSystem();

    } catch (error) {

        console.error("Login error:", error);

        alert(getFirebaseErrorMessage(error));

    } finally {

        if (loginButton) {
            loginButton.disabled = false;
        }
    }
}


// ============================================================
// REGISTER
// ============================================================

async function registerUser() {

    const nameInput = $("registerName");
    const emailInput = $("registerEmail");
    const passwordInput = $("registerPassword");
    const confirmInput = $("registerConfirmPassword");

    if (!nameInput || !emailInput || !passwordInput) {

        console.error("Registration fields not found.");

        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const confirmPassword =
        confirmInput
            ? confirmInput.value
            : password;

    if (!name) {

        alert("Please enter your name.");

        nameInput.focus();

        return;
    }

    if (!email) {

        alert("Please enter your email.");

        emailInput.focus();

        return;
    }

    if (!password) {

        alert("Please enter your password.");

        passwordInput.focus();

        return;
    }

    if (password.length < 6) {

        alert("Password must be at least 6 characters.");

        passwordInput.focus();

        return;
    }

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        if (confirmInput) {
            confirmInput.focus();
        }

        return;
    }

    const registerButton =
        document.querySelector(
            "#registerForm button[type='submit']"
        ) ||
        document.querySelector(".register-btn");

    if (registerButton) {
        registerButton.disabled = true;
    }

    try {

        // ------------------------------------------------------
        // CREATE FIREBASE AUTH ACCOUNT
        // ------------------------------------------------------

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        // ------------------------------------------------------
        // UPDATE AUTH PROFILE
        // ------------------------------------------------------

        await updateProfile(user, {
            displayName: name
        });

        // ------------------------------------------------------
        // SAVE USER INFORMATION TO RTDB
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // SAVE ACTIVITY
        // ------------------------------------------------------

        await addActivity(
            "New user registered",
            `${name} created an account.`
        );

        alert(
            "Registration successful!\n\n" +
            "Your account has been created."
        );

        // User is automatically signed in by Firebase after
        // createUserWithEmailAndPassword().
        currentUser = user;

        showSystem();

    } catch (error) {

        console.error("Registration error:", error);

        alert(getFirebaseErrorMessage(error));

    } finally {

        if (registerButton) {
            registerButton.disabled = false;
        }
    }
}


// ============================================================
// PASSWORD RESET
// ============================================================

async function resetPassword() {

    const emailInput = $("loginEmail");

    if (!emailInput) {
        return;
    }

    const email = emailInput.value.trim();

    if (!email) {

        alert(
            "Enter your email address first."
        );

        emailInput.focus();

        return;
    }

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        alert(
            "Password reset email sent.\n\n" +
            "Check your email."
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        alert(
            getFirebaseErrorMessage(error)
        );
    }
}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        console.log(
            "Authenticated user:",
            user.email
        );

        // If user is already authenticated and app is
        // currently showing login/register, open dashboard.
        if (
            loginPage &&
            getComputedStyle(loginPage).display !== "none"
        ) {

            showSystem();
        }

    } else {

        currentUser = null;

        console.log("No authenticated user.");

        // Don't force-hide pages during initial loading if the
        // HTML controls it. But make sure protected system
        // isn't accessible without authentication.
        if (gameApp) {
            hideElement(gameApp);
        }

        if (otpPage) {
            hideElement(otpPage);
        }

        if (registerPage) {
            hideElement(registerPage);
        }

        showElement(loginPage);
    }
});


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(pageName) {

    currentPage = pageName;

    // Your actual content sections use .content-page.
    const pages =
        document.querySelectorAll(".content-page");

    pages.forEach(page => {

        page.style.display = "none";

        page.classList.remove("active");
    });


    // Try common ID formats.
    let selectedPage =
        document.getElementById(pageName);

    if (!selectedPage) {

        selectedPage =
            document.getElementById(
                pageName + "Page"
            );
    }

    if (!selectedPage) {

        selectedPage =
            document.querySelector(
                `[data-page="${pageName}"]`
            );
    }

    if (selectedPage) {

        selectedPage.style.display = "";

        selectedPage.classList.add("active");
    }


    // Update sidebar navigation
    const navItems =
        document.querySelectorAll(
            "[data-page], .nav-item, .sidebar-item"
        );

    navItems.forEach(item => {

        const itemPage =
            item.dataset
                ? item.dataset.page
                : null;

        if (itemPage === pageName) {

            item.classList.add("active");

        } else {

            item.classList.remove("active");
        }
    });


    // Load/update page data
    if (pageName === "dashboard") {

        loadDashboard();
    }

    if (
        pageName === "inventory" ||
        pageName === "products"
    ) {

        loadInventory();
    }

    if (
        pageName === "activity" ||
        pageName === "activityLogs"
    ) {

        loadActivity();
    }

    if (
        pageName === "profile" ||
        pageName === "account"
    ) {

        loadUserProfile();
    }
}


// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

document.addEventListener("click", (event) => {

    const nav =
        event.target.closest("[data-page]");

    if (!nav) {
        return;
    }

    event.preventDefault();

    const page =
        nav.getAttribute("data-page");

    if (page) {
        showPage(page);
    }
});


// ============================================================
// INVENTORY
// ============================================================

function loadInventory() {

    if (!db) return;

    const inventoryRef =
        ref(db, "bakeryProducts");

    // Prevent duplicate listeners
    if (inventoryListener) {

        inventoryListener();

        inventoryListener = null;
    }

    inventoryListener =
        onValue(
            inventoryRef,
            (snapshot) => {

                productsData =
                    snapshot.val() || {};

                renderInventory(
                    productsData
                );

                updateDashboardStats(
                    productsData
                );

            },
            (error) => {

                console.error(
                    "Inventory read error:",
                    error
                );

                showDatabaseError(error);
            }
        );
}


// ============================================================
// RENDER INVENTORY TABLE
// ============================================================

function renderInventory(data) {

    const tbody =
        $("inventoryTableBody") ||
        $("inventoryBody") ||
        document.querySelector(
            "#inventoryTable tbody"
        );

    if (!tbody) {

        console.warn(
            "Inventory table body not found."
        );

        return;
    }

    tbody.innerHTML = "";

    const entries =
        Object.entries(data);

    if (entries.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(([id, product]) => {

        const row =
            document.createElement("tr");

        const quantity =
            Number(product.quantity || 0);

        const threshold =
            Number(product.threshold || 0);

        const price =
            Number(product.price || 0);

        const isLowStock =
            quantity <= threshold;

        const statusClass =
            isLowStock
                ? "low-stock"
                : "in-stock";

        const statusText =
            isLowStock
                ? "LOW STOCK"
                : "IN STOCK";

        row.innerHTML = `

            <td>${escapeHTML(product.sku || "-")}</td>

            <td>${escapeHTML(product.name || "-")}</td>

            <td>${escapeHTML(product.category || "-")}</td>

            <td>${quantity}</td>

            <td>₱${price.toFixed(2)}</td>

            <td>
                <span class="status ${statusClass}">
                    ${statusText}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="edit-btn"
                    onclick="window.editProduct('${id}')"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="window.deleteProduct('${id}')"
                >
                    Delete
                </button>

            </td>
        `;

        tbody.appendChild(row);
    });


    updateInventoryCount(entries.length);
}


// ============================================================
// INVENTORY COUNT
// ============================================================

function updateInventoryCount(count) {

    const elements = [

        $("totalProducts"),

        $("inventoryCount"),

        $("productCount")

    ];

    elements.forEach(element => {

        if (element) {

            element.textContent =
                count.toLocaleString();
        }
    });
}


// ============================================================
// ADD PRODUCT
// ============================================================

async function saveProduct() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }

    const sku =
        getValue("productSKU", "sku");

    const name =
        getValue("productName", "name");

    const category =
        getValue("productCategory", "category");

    const quantity =
        getNumber("productQuantity", "quantity");

    const price =
        getNumber("productPrice", "price");

    const threshold =
        getNumber(
            "productThreshold",
            "threshold"
        );


    if (!sku) {

        alert("Please enter the SKU.");

        return;
    }

    if (!name) {

        alert("Please enter the product name.");

        return;
    }

    if (!category) {

        alert("Please select or enter a category.");

        return;
    }

    if (quantity < 0) {

        alert("Quantity cannot be negative.");

        return;
    }

    if (price < 0) {

        alert("Price cannot be negative.");

        return;
    }

    if (threshold < 0) {

        alert("Threshold cannot be negative.");

        return;
    }


    try {

        const product = {

            sku: sku,

            name: name,

            category: category,

            quantity: quantity,

            price: price,

            threshold: threshold,

            updatedAt:
                new Date().toISOString(),

            updatedBy:
                currentUser.email
        };


        // ------------------------------------------------------
        // UPDATE EXISTING PRODUCT
        // ------------------------------------------------------

        if (editingProductId) {

            await update(
                ref(
                    db,
                    "bakeryProducts/" +
                    editingProductId
                ),
                product
            );

            await addActivity(
                "Product updated",
                `${name} was updated.`
            );

            alert(
                "Product updated successfully!"
            );

        }

        // ------------------------------------------------------
        // ADD NEW PRODUCT
        // ------------------------------------------------------

        else {

            const newProductRef =
                push(
                    ref(db, "bakeryProducts")
                );

            await set(
                newProductRef,
                {
                    ...product,

                    createdAt:
                        new Date().toISOString(),

                    createdBy:
                        currentUser.email
                }
            );

            await addActivity(
                "Product added",
                `${name} was added to inventory.`
            );

            alert(
                "Product added successfully!"
            );
        }


        clearProductForm();

        showPage("inventory");

    } catch (error) {

        console.error(
            "Save product error:",
            error
        );

        alert(
            "Unable to save product.\n\n" +
            getFirebaseErrorMessage(error)
        );
    }
}


// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(productId) {

    const product =
        productsData[productId];

    if (!product) {

        alert("Product not found.");

        return;
    }

    editingProductId = productId;


    setValue(
        "productSKU",
        product.sku || ""
    );

    setValue(
        "sku",
        product.sku || ""
    );


    setValue(
        "productName",
        product.name || ""
    );

    setValue(
        "name",
        product.name || ""
    );


    setValue(
        "productCategory",
        product.category || ""
    );

    setValue(
        "category",
        product.category || ""
    );


    setValue(
        "productQuantity",
        product.quantity ?? 0
    );

    setValue(
        "quantity",
        product.quantity ?? 0
    );


    setValue(
        "productPrice",
        product.price ?? 0
    );

    setValue(
        "price",
        product.price ?? 0
    );


    setValue(
        "productThreshold",
        product.threshold ?? 0
    );

    setValue(
        "threshold",
        product.threshold ?? 0
    );


    const title =
        $("productFormTitle");

    if (title) {

        title.textContent =
            "Edit Product";
    }


    const saveButton =
        $("saveProductBtn");

    if (saveButton) {

        saveButton.textContent =
            "Update Product";
    }


    // If your app has a separate add/edit page
    showPage("addProduct");

    // Alternative common page ID
    const productPage =
        $("addEditProduct");

    if (productPage) {

        showPage("addEditProduct");
    }
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }

    const product =
        productsData[productId];

    if (!product) {

        alert("Product not found.");

        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}" from inventory?`
        );

    if (!confirmed) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" +
                productId
            )
        );


        await addActivity(
            "Product deleted",
            `${product.name} was removed from inventory.`
        );


        alert(
            "Product deleted successfully!"
        );

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            "Unable to delete product.\n\n" +
            getFirebaseErrorMessage(error)
        );
    }
}


// ============================================================
// CLEAR PRODUCT FORM
// ============================================================

function clearProductForm() {

    editingProductId = null;


    const fieldIds = [

        "productSKU",
        "sku",

        "productName",
        "name",

        "productCategory",
        "category",

        "productQuantity",
        "quantity",

        "productPrice",
        "price",

        "productThreshold",
        "threshold"
    ];


    fieldIds.forEach(id => {

        const element = $(id);

        if (element) {

            if (
                element.tagName === "SELECT"
            ) {

                element.selectedIndex = 0;

            } else {

                element.value = "";
            }
        }
    });


    const title =
        $("productFormTitle");

    if (title) {

        title.textContent =
            "Add Product";
    }


    const saveButton =
        $("saveProductBtn");

    if (saveButton) {

        saveButton.textContent =
            "Add Product";
    }
}


// ============================================================
// DASHBOARD
// ============================================================

function loadDashboard() {

    if (!db) return;

    // Inventory listener already updates dashboard.
    // This function also reads data if dashboard is opened
    // before inventory has been loaded.

    const productsRef =
        ref(db, "bakeryProducts");

    onValue(
        productsRef,
        snapshot => {

            const data =
                snapshot.val() || {};

            updateDashboardStats(data);
        },
        error => {

            console.error(
                "Dashboard error:",
                error
            );
        },
        {
            onlyOnce: true
        }
    );
}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateDashboardStats(data) {

    const products =
        Object.values(data || {});


    const totalProducts =
        products.length;


    let totalStock = 0;

    let lowStockItems = 0;

    let estimatedValue = 0;


    products.forEach(product => {

        const quantity =
            Number(product.quantity || 0);

        const price =
            Number(product.price || 0);

        const threshold =
            Number(product.threshold || 0);


        totalStock += quantity;

        estimatedValue +=
            quantity * price;


        if (
            quantity <= threshold
        ) {

            lowStockItems++;
        }
    });


    setText(
        "totalProducts",
        totalProducts
    );

    setText(
        "totalStock",
        totalStock
    );

    setText(
        "lowStockItems",
        lowStockItems
    );

    setText(
        "estimatedValue",
        "₱" +
        estimatedValue.toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}


// ============================================================
// ACTIVITY LOGS
// ============================================================

function loadActivity() {

    if (!db) return;


    const activityRef =
        ref(db, "activityLogs");


    if (activityListener) {

        activityListener();

        activityListener = null;
    }


    activityListener =
        onValue(
            activityRef,
            snapshot => {

                activityData =
                    snapshot.val() || {};

                renderActivity(
                    activityData
                );
            },
            error => {

                console.error(
                    "Activity read error:",
                    error
                );
            }
        );
}


// ============================================================
// ADD ACTIVITY
// ============================================================

async function addActivity(
    action,
    details
) {

    if (!db) {
        return;
    }


    try {

        const activityRef =
            push(
                ref(db, "activityLogs")
            );


        await set(
            activityRef,
            {
                action: action,

                details: details,

                user:
                    currentUser
                        ? (
                            currentUser.email ||
                            currentUser.displayName ||
                            "User"
                        )
                        : "System",

                timestamp:
                    new Date().toISOString()
            }
        );

    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );
    }
}


// ============================================================
// RENDER ACTIVITY
// ============================================================

function renderActivity(data) {

    const tbody =
        $("activityTableBody") ||
        $("activityBody") ||
        document.querySelector(
            "#activityTable tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const entries =
        Object.entries(data || {})
            .sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a[1].timestamp || 0
                        );

                    const dateB =
                        new Date(
                            b[1].timestamp || 0
                        );

                    return dateB - dateA;
                }
            );


    if (entries.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No activity yet.
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(([id, activity]) => {

        const row =
            document.createElement("tr");


        const timestamp =
            activity.timestamp
                ? formatDate(
                    activity.timestamp
                )
                : "-";


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    activity.action || "-"
                )}
            </td>

            <td>
                ${escapeHTML(
                    activity.details || "-"
                )}
            </td>

            <td>
                ${escapeHTML(
                    activity.user || "-"
                )}
            </td>

            <td>
                ${timestamp}
            </td>

        `;


        tbody.appendChild(row);
    });
}


// ============================================================
// USER PROFILE
// ============================================================

function loadUserProfile() {

    if (!currentUser || !db) {
        return;
    }


    const userRef =
        ref(
            db,
            "users/" +
            currentUser.uid
        );


    if (userListener) {

        userListener();

        userListener = null;
    }


    userListener =
        onValue(
            userRef,
            snapshot => {

                const data =
                    snapshot.val() || {};


                const name =
                    data.name ||
                    currentUser.displayName ||
                    "User";


                const email =
                    data.email ||
                    currentUser.email ||
                    "";


                const role =
                    data.role ||
                    "staff";


                // Account/Profile text elements
                setText(
                    "profileName",
                    name
                );

                setText(
                    "profileEmail",
                    email
                );

                setText(
                    "profileRole",
                    role
                );


                // Dashboard/header user name
                setText(
                    "userName",
                    name
                );

                setText(
                    "currentUserName",
                    name
                );

                setText(
                    "headerUserName",
                    name
                );


                setText(
                    "userEmail",
                    email
                );


                // Input fields, if present
                setValue(
                    "profileNameInput",
                    name
                );

                setValue(
                    "profileEmailInput",
                    email
                );
            },
            error => {

                console.error(
                    "User profile error:",
                    error
                );
            }
        );
}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const name =
        getValue(
            "profileNameInput",
            "profileName"
        );


    if (!name) {

        alert("Please enter your name.");

        return;
    }


    try {

        await updateProfile(
            currentUser,
            {
                displayName: name
            }
        );


        await update(
            ref(
                db,
                "users/" +
                currentUser.uid
            ),
            {
                name: name,
                updatedAt:
                    new Date().toISOString()
            }
        );


        await addActivity(
            "Profile updated",
            "User profile was updated."
        );


        alert(
            "Profile updated successfully!"
        );


        loadUserProfile();

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );

        alert(
            getFirebaseErrorMessage(error)
        );
    }
}


// ============================================================
// SEARCH INVENTORY
// ============================================================

function searchInventory() {

    const searchInput =
        $("searchInput") ||
        $("inventorySearch") ||
        $("search");


    const categoryInput =
        $("categoryFilter") ||
        $("filterCategory");


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryInput
            ? categoryInput.value
                .trim()
                .toLowerCase()
            : "";


    const tbody =
        $("inventoryTableBody") ||
        $("inventoryBody") ||
        document.querySelector(
            "#inventoryTable tbody"
        );


    if (!tbody) {
        return;
    }


    const rows =
        tbody.querySelectorAll("tr");


    rows.forEach(row => {

        const text =
            row.textContent
                .toLowerCase();


        const categoryMatch =
            !category ||
            text.includes(category);


        const searchMatch =
            !searchTerm ||
            text.includes(searchTerm);


        row.style.display =
            categoryMatch &&
            searchMatch
                ? ""
                : "none";
    });
}


// ============================================================
// DATABASE ERROR
// ============================================================

function showDatabaseError(error) {

    console.error(
        "Firebase Database Error:",
        error
    );


    if (
        error &&
        error.code ===
        "PERMISSION_DENIED"
    ) {

        alert(
            "Firebase Database permission denied.\n\n" +
            "Check your Realtime Database Rules and make sure " +
            "the user is authenticated."
        );

        return;
    }


    alert(
        "Unable to load Firebase data.\n\n" +
        getFirebaseErrorMessage(error)
    );
}


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function getFirebaseErrorMessage(error) {

    if (!error) {

        return "An unknown error occurred.";
    }


    const code =
        error.code || "";


    switch (code) {

        case "auth/api-key-not-valid":

            return (
                "Firebase API key is not valid.\n\n" +
                "Check Firebase Project Settings → General → " +
                "Your apps → Web App configuration."
            );


        case "auth/invalid-api-key":

            return (
                "Firebase API key is invalid.\n\n" +
                "Copy the API key again from your Firebase Web App configuration."
            );


        case "auth/email-already-in-use":

            return (
                "This email is already registered."
            );


        case "auth/invalid-email":

            return (
                "The email address is invalid."
            );


        case "auth/weak-password":

            return (
                "Password is too weak. " +
                "Use at least 6 characters."
            );


        case "auth/invalid-credential":

            return (
                "Invalid email or password."
            );


        case "auth/user-not-found":

            return (
                "No account was found with this email."
            );


        case "auth/wrong-password":

            return (
                "Incorrect password."
            );


        case "auth/too-many-requests":

            return (
                "Too many attempts. " +
                "Please wait and try again."
            );


        case "auth/network-request-failed":

            return (
                "Network error. " +
                "Check your internet connection."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/Password Authentication is not enabled " +
                "in Firebase Authentication."
            );


        case "PERMISSION_DENIED":

            return (
                "Firebase Database permission denied."
            );


        case "permission-denied":

            return (
                "Firebase Database permission denied."
            );


        default:

            return (
                error.message ||
                "Something went wrong."
            );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// GET VALUE
// ============================================================

function getValue(...ids) {

    for (const id of ids) {

        const element = $(id);

        if (element) {

            return element.value.trim();
        }
    }

    return "";
}


// ============================================================
// GET NUMBER
// ============================================================

function getNumber(...ids) {

    const value =
        getValue(...ids);

    if (value === "") {
        return 0;
    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


// ============================================================
// SET VALUE
// ============================================================

function setValue(id, value) {

    const element = $(id);

    if (element) {

        element.value =
            value ?? "";
    }
}


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateValue) {

    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {

        return "-";
    }


    return date.toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ============================================================
// GLOBAL FUNCTIONS
// These allow inline onclick="" in your HTML to work.
// ============================================================

window.loginUser =
    loginUser;

window.registerUser =
    registerUser;

window.logoutUser =
    logoutUser;

window.showLogin =
    showLogin;

window.showRegister =
    showRegister;

window.showSystem =
    showSystem;

window.showPage =
    showPage;

window.saveProduct =
    saveProduct;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.clearProductForm =
    clearProductForm;

window.loadInventory =
    loadInventory;

window.loadDashboard =
    loadDashboard;

window.loadActivity =
    loadActivity;

window.loadUserProfile =
    loadUserProfile;

window.saveProfile =
    saveProfile;

window.searchInventory =
    searchInventory;

window.resetPassword =
    resetPassword;


// ============================================================
// FORM EVENT HANDLERS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ------------------------------------------------------
        // LOGIN FORM
        // ------------------------------------------------------

        const loginForm =
            $("loginForm");


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    loginUser();
                }
            );
        }


        // ------------------------------------------------------
        // REGISTER FORM
        // ------------------------------------------------------

        const registerForm =
            $("registerForm");


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    registerUser();
                }
            );
        }


        // ------------------------------------------------------
        // PRODUCT FORM
        // ------------------------------------------------------

        const productForm =
            $("productForm");


        if (productForm) {

            productForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    saveProduct();
                }
            );
        }


        // ------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------

        const searchInput =
            $("searchInput") ||
            $("inventorySearch") ||
            $("search");


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchInventory
            );
        }


        // ------------------------------------------------------
        // CATEGORY FILTER
        // ------------------------------------------------------

        const categoryFilter =
            $("categoryFilter") ||
            $("filterCategory");


        if (categoryFilter) {

            categoryFilter.addEventListener(
                "change",
                searchInventory
            );
        }


        // ------------------------------------------------------
        // SHOW LOGIN
        // ------------------------------------------------------

        const registerLink =
            $("registerLink");


        if (registerLink) {

            registerLink.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showRegister();
                }
            );
        }


        // ------------------------------------------------------
        // BACK TO LOGIN
        // ------------------------------------------------------

        const loginLink =
            $("loginLink");


        if (loginLink) {

            loginLink.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showLogin();
                }
            );
        }


        // ------------------------------------------------------
        // LOGOUT BUTTONS
        // ------------------------------------------------------

        const logoutButtons =
            document.querySelectorAll(
                ".logout-btn, #logoutBtn, #logoutButton"
            );


        logoutButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutUser();
                }
            );
        });


        // ------------------------------------------------------
        // FORGOT PASSWORD
        // ------------------------------------------------------

        const forgotPassword =
            $("forgotPassword");


        if (forgotPassword) {

            forgotPassword.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    resetPassword();
                }
            );
        }


        // ------------------------------------------------------
        // INITIAL PAGE
        // ------------------------------------------------------

        console.log(
            "Arbee's Bakery Shop script loaded."
        );
    }
);
