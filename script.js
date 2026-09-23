// ============================================================
// ARBEES BAKERY SHOP
// Firebase Authentication + Realtime Database
// OTP REMOVED - Login goes directly to Dashboard
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
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


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc4",
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;
let editingProductId = null;
let products = [];


// ============================================================
// HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}

function show(id) {
    const element = $(id);
    if (element) {
        element.style.display = "";
    }
}

function hide(id) {
    const element = $(id);
    if (element) {
        element.style.display = "none";
    }
}

function setText(id, text) {
    const element = $(id);
    if (element) {
        element.textContent = text;
    }
}

function getValue(id) {
    const element = $(id);
    return element ? element.value.trim() : "";
}

function setValue(id, value) {
    const element = $(id);
    if (element) {
        element.value = value ?? "";
    }
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(pageId) {

    const pages = [
        "loginPage",
        "registerPage",
        "dashboardPage",
        "inventoryPage",
        "activityPage",
        "appPage",
        "mainApp"
    ];

    pages.forEach(id => {
        const element = $(id);

        if (element) {
            element.style.display = "none";
        }
    });

    const page = $(pageId);

    if (page) {
        page.style.display = "block";
    }

    // If main application wrapper exists
    if (pageId === "dashboardPage" ||
        pageId === "inventoryPage" ||
        pageId === "activityPage") {

        const appPage = $("appPage");

        if (appPage) {
            appPage.style.display = "block";
        }

        const mainApp = $("mainApp");

        if (mainApp) {
            mainApp.style.display = "block";
        }
    }
}


// ============================================================
// LOGIN / REGISTER PAGE SWITCH
// ============================================================

window.showLogin = function () {

    hide("registerPage");
    hide("dashboardPage");
    hide("inventoryPage");
    hide("activityPage");
    hide("appPage");
    hide("mainApp");

    show("loginPage");

    clearMessages();
};


window.showRegister = function () {

    hide("loginPage");

    show("registerPage");

    clearMessages();
};


function clearMessages() {

    const ids = [
        "loginError",
        "registerError",
        "loginMessage",
        "registerMessage"
    ];

    ids.forEach(id => {
        const element = $(id);

        if (element) {
            element.textContent = "";
            element.style.display = "";
        }
    });
}


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function getFirebaseErrorMessage(error) {

    if (!error) {
        return "Something went wrong.";
    }

    switch (error.code) {

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/email-already-in-use":
            return "Email is already registered.";

        case "auth/weak-password":
            return "Password should be at least 6 characters.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return error.message || "Something went wrong.";
    }
}


// ============================================================
// LOGIN
// ============================================================

const loginForm = $("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = getValue("loginEmail");
        const password = getValue("loginPassword");

        const errorElement =
            $("loginError") ||
            $("loginMessage");

        if (!email || !password) {

            if (errorElement) {
                errorElement.textContent =
                    "Please enter your email and password.";
            }

            return;
        }

        const loginButton =
            $("loginBtn") ||
            $("loginButton");

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = "LOGGING IN...";
        }

        try {

            // Firebase Email/Password Login
            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            currentUser = credential.user;

            console.log("Login successful:", currentUser.email);

            // DIRECTLY GO TO DASHBOARD
            // NO OTP
            await openDashboard();

        } catch (error) {

            console.error("Login error:", error);

            if (errorElement) {
                errorElement.textContent =
                    getFirebaseErrorMessage(error);
            }

        } finally {

            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = "LOGIN";
            }
        }
    });
}


// ============================================================
// REGISTER
// ============================================================

const registerForm = $("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            getValue("registerName") ||
            getValue("fullName") ||
            getValue("name");

        const email =
            getValue("registerEmail");

        const password =
            getValue("registerPassword");

        const confirmPassword =
            getValue("registerConfirmPassword") ||
            getValue("confirmPassword");

        const errorElement =
            $("registerError") ||
            $("registerMessage");

        if (!name || !email || !password || !confirmPassword) {

            if (errorElement) {
                errorElement.textContent =
                    "Please complete all fields.";
            }

            return;
        }

        if (password !== confirmPassword) {

            if (errorElement) {
                errorElement.textContent =
                    "Passwords do not match.";
            }

            return;
        }

        if (password.length < 6) {

            if (errorElement) {
                errorElement.textContent =
                    "Password must be at least 6 characters.";
            }

            return;
        }

        const registerButton =
            $("registerBtn") ||
            $("registerButton");

        if (registerButton) {
            registerButton.disabled = true;
            registerButton.textContent = "CREATING...";
        }

        try {

            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = credential.user;

            // Save display name in Firebase Authentication
            try {

                await updateProfile(user, {
                    displayName: name
                });

            } catch (profileError) {

                console.warn(
                    "Could not update Firebase profile:",
                    profileError
                );
            }


            // Save user profile in Realtime Database
            await set(
                ref(db, `users/${user.uid}`),
                {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: new Date().toISOString()
                }
            );


            // Activity log
            try {

                await push(
                    ref(db, "activityLogs"),
                    {
                        action: "REGISTER",
                        description:
                            `${name} created an account`,
                        userId: user.uid,
                        userEmail: email,
                        timestamp:
                            new Date().toISOString()
                    }
                );

            } catch (activityError) {

                console.warn(
                    "Activity log could not be saved:",
                    activityError
                );
            }


            alert(
                "Account created successfully! Please login."
            );

            await signOut(auth);

            showPage("loginPage");

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            if (errorElement) {
                errorElement.textContent =
                    getFirebaseErrorMessage(error);
            }

        } finally {

            if (registerButton) {
                registerButton.disabled = false;
                registerButton.textContent = "REGISTER";
            }
        }
    });
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword =
    $("forgotPassword") ||
    $("forgotPasswordLink");

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            const email =
                getValue("loginEmail");

            if (!email) {

                alert(
                    "Enter your email address first."
                );

                return;
            }

            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );

                alert(
                    "Password reset email sent. Check your inbox."
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
    );
}


// ============================================================
// DASHBOARD
// ============================================================

async function openDashboard() {

    showPage("dashboardPage");

    await loadProducts();
    await loadActivityLogs();

    updateDashboard();
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    return new Promise(resolve => {

        const productsRef =
            ref(db, "bakeryProducts");

        onValue(
            productsRef,
            snapshot => {

                products = [];

                if (snapshot.exists()) {

                    const data =
                        snapshot.val();

                    Object.entries(data).forEach(
                        ([id, product]) => {

                            products.push({
                                id,
                                ...product
                            });
                        }
                    );
                }

                renderInventory();
                updateDashboard();

                resolve();

            },
            error => {

                console.error(
                    "Products loading error:",
                    error
                );

                products = [];

                renderInventory();
                updateDashboard();

                resolve();
            },
            {
                onlyOnce: true
            }
        );
    });
}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateDashboard() {

    const totalProducts =
        products.length;

    const totalStock =
        products.reduce(
            (sum, product) =>
                sum + Number(product.quantity || 0),
            0
        );

    const lowStock =
        products.filter(product => {

            const quantity =
                Number(product.quantity || 0);

            const threshold =
                Number(product.threshold || 5);

            return quantity <= threshold;

        }).length;

    const estimatedValue =
        products.reduce(
            (sum, product) => {

                const quantity =
                    Number(product.quantity || 0);

                const price =
                    Number(product.price || 0);

                return sum + (quantity * price);

            },
            0
        );


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
        lowStock
    );

    setText(
        "estimatedValue",
        formatCurrency(estimatedValue)
    );


    renderRecentProducts();
}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {

    return "₱" +
        Number(value || 0).toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


// ============================================================
// RENDER INVENTORY
// ============================================================

function renderInventory() {

    const tableBody =
        $("inventoryTableBody") ||
        $("inventoryBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    if (products.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    products.forEach(product => {

        const quantity =
            Number(product.quantity || 0);

        const threshold =
            Number(product.threshold || 5);

        const status =
            quantity <= threshold
                ? "LOW STOCK"
                : "IN STOCK";

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${escapeHtml(product.sku || "")}</td>

            <td>${escapeHtml(product.name || "")}</td>

            <td>${escapeHtml(product.category || "")}</td>

            <td>${quantity}</td>

            <td>${formatCurrency(product.price)}</td>

            <td>
                <span class="status ${
                    quantity <= threshold
                        ? "low-stock"
                        : "in-stock"
                }">
                    ${status}
                </span>
            </td>

            <td>
                <button
                    class="edit-btn"
                    onclick="editProduct('${product.id}')">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteProduct('${product.id}')">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ============================================================
// RECENT PRODUCTS
// ============================================================

function renderRecentProducts() {

    const tableBody =
        $("recentInventoryBody") ||
        $("recentProductsBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    const recent =
        products.slice(-5).reverse();


    if (recent.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No inventory records yet.
                </td>
            </tr>
        `;

        return;
    }


    recent.forEach(product => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(product.sku || "")}</td>
            <td>${escapeHtml(product.name || "")}</td>
            <td>${escapeHtml(product.category || "")}</td>
            <td>${Number(product.quantity || 0)}</td>
            <td>${formatCurrency(product.price)}</td>
        `;

        tableBody.appendChild(row);
    });
}


// ============================================================
// ADD PRODUCT
// ============================================================

window.openAddProduct = function () {

    editingProductId = null;

    clearProductForm();

    const modal =
        $("productModal") ||
        $("addProductModal");

    if (modal) {
        modal.style.display = "flex";
    }

    setText(
        "modalTitle",
        "Add Product"
    );
};


window.showAddProduct = window.openAddProduct;


// ============================================================
// CLOSE PRODUCT MODAL
// ============================================================

window.closeProductModal = function () {

    const modal =
        $("productModal") ||
        $("addProductModal");

    if (modal) {
        modal.style.display = "none";
    }

    editingProductId = null;

    clearProductForm();
};


// ============================================================
// CLEAR PRODUCT FORM
// ============================================================

function clearProductForm() {

    setValue("productId", "");
    setValue("productSku", "");
    setValue("sku", "");

    setValue("productName", "");
    setValue("productCategory", "");
    setValue("productQuantity", "");
    setValue("productPrice", "");
    setValue("productThreshold", "5");

    setValue("skuInput", "");
    setValue("nameInput", "");
    setValue("categoryInput", "");
    setValue("quantityInput", "");
    setValue("priceInput", "");
    setValue("thresholdInput", "5");
}


// ============================================================
// EDIT PRODUCT
// ============================================================

window.editProduct = function (id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) {
        return;
    }

    editingProductId = id;


    setValue(
        "productSku",
        product.sku
    );

    setValue(
        "sku",
        product.sku
    );

    setValue(
        "productName",
        product.name
    );

    setValue(
        "productCategory",
        product.category
    );

    setValue(
        "productQuantity",
        product.quantity
    );

    setValue(
        "productPrice",
        product.price
    );

    setValue(
        "productThreshold",
        product.threshold || 5
    );


    const modal =
        $("productModal") ||
        $("addProductModal");

    if (modal) {
        modal.style.display = "flex";
    }

    setText(
        "modalTitle",
        "Edit Product"
    );
};


// ============================================================
// SAVE PRODUCT
// ============================================================

const productForm =
    $("productForm");

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const sku =
                getValue("productSku") ||
                getValue("sku") ||
                getValue("skuInput");

            const name =
                getValue("productName") ||
                getValue("nameInput");

            const category =
                getValue("productCategory") ||
                getValue("categoryInput");

            const quantityValue =
                getValue("productQuantity") ||
                getValue("quantityInput");

            const priceValue =
                getValue("productPrice") ||
                getValue("priceInput");

            const thresholdValue =
                getValue("productThreshold") ||
                getValue("thresholdInput") ||
                "5";


            if (!sku ||
                !name ||
                !category ||
                !quantityValue ||
                !priceValue) {

                alert(
                    "Please complete all product fields."
                );

                return;
            }


            const quantity =
                Number(quantityValue);

            const price =
                Number(priceValue);

            const threshold =
                Number(thresholdValue);


            if (
                !Number.isFinite(quantity) ||
                quantity < 0
            ) {

                alert(
                    "Quantity must be a valid number."
                );

                return;
            }


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                alert(
                    "Price must be a valid number."
                );

                return;
            }


            const productData = {

                sku,
                name,
                category,
                quantity,
                price,
                threshold,

                updatedAt:
                    new Date().toISOString(),

                updatedBy:
                    currentUser
                        ? currentUser.uid
                        : null
            };


            try {

                if (editingProductId) {

                    await update(
                        ref(
                            db,
                            `bakeryProducts/${editingProductId}`
                        ),
                        productData
                    );


                    await addActivity(
                        "UPDATE PRODUCT",
                        `Updated product: ${name}`
                    );

                } else {

                    productData.createdAt =
                        new Date().toISOString();

                    productData.createdBy =
                        currentUser
                            ? currentUser.uid
                            : null;


                    await push(
                        ref(db, "bakeryProducts"),
                        productData
                    );


                    await addActivity(
                        "ADD PRODUCT",
                        `Added product: ${name}`
                    );
                }


                alert(
                    editingProductId
                        ? "Product updated successfully!"
                        : "Product added successfully!"
                );


                closeProductModal();

                await loadProducts();

            } catch (error) {

                console.error(
                    "Save product error:",
                    error
                );

                alert(
                    "Unable to save product: " +
                    error.message
                );
            }
        }
    );
}


// ============================================================
// DELETE PRODUCT
// ============================================================

window.deleteProduct = async function (id) {

    const product =
        products.find(
            item => item.id === id
        );

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
            `Deleted product: ${product.name}`
        );


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            "Unable to delete product: " +
            error.message
        );
    }
};


// ============================================================
// ACTIVITY LOG
// ============================================================

async function addActivity(
    action,
    description
) {

    if (!currentUser) {
        return;
    }


    try {

        await push(
            ref(db, "activityLogs"),
            {
                action,
                description,

                userId:
                    currentUser.uid,

                userEmail:
                    currentUser.email,

                timestamp:
                    new Date().toISOString()
            }
        );

    } catch (error) {

        console.warn(
            "Activity log failed:",
            error
        );
    }
}


// ============================================================
// LOAD ACTIVITY LOGS
// ============================================================

let activityLogs = [];


async function loadActivityLogs() {

    return new Promise(resolve => {

        onValue(
            ref(db, "activityLogs"),

            snapshot => {

                activityLogs = [];


                if (snapshot.exists()) {

                    const data =
                        snapshot.val();


                    Object.entries(data).forEach(
                        ([id, log]) => {

                            activityLogs.push({
                                id,
                                ...log
                            });
                        }
                    );
                }


                activityLogs.sort(
                    (a, b) =>
                        new Date(
                            b.timestamp || 0
                        ) -
                        new Date(
                            a.timestamp || 0
                        )
                );


                renderActivityLogs();

                resolve();

            },

            error => {

                console.error(
                    "Activity logs error:",
                    error
                );

                activityLogs = [];

                renderActivityLogs();

                resolve();
            },

            {
                onlyOnce: true
            }
        );
    });
}


// ============================================================
// RENDER ACTIVITY LOGS
// ============================================================

function renderActivityLogs() {

    const tableBody =
        $("activityTableBody") ||
        $("activityLogsBody");

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (activityLogs.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No activity logs yet.
                </td>
            </tr>
        `;

        return;
    }


    activityLogs.forEach(log => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${formatDate(log.timestamp)}
            </td>

            <td>
                ${escapeHtml(log.action || "")}
            </td>

            <td>
                ${escapeHtml(log.description || "")}
            </td>

            <td>
                ${escapeHtml(log.userEmail || "")}
            </td>
        `;


        tableBody.appendChild(row);
    });
}


// ============================================================
// NAVIGATION
// ============================================================

window.showDashboard = async function () {

    showPage("dashboardPage");

    await loadProducts();
    await loadActivityLogs();

    updateDashboard();
};


window.showInventory = async function () {

    showPage("inventoryPage");

    await loadProducts();
};


window.showActivityLogs = async function () {

    showPage("activityPage");

    await loadActivityLogs();
};


// Alternative names
window.showDashboardPage =
    window.showDashboard;

window.showInventoryPage =
    window.showInventory;

window.showActivityPage =
    window.showActivityLogs;


// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        const target =
            event.target.closest(
                "[data-page]"
            );

        if (!target) {
            return;
        }


        const page =
            target.getAttribute(
                "data-page"
            );


        if (page === "dashboard") {
            window.showDashboard();
        }

        else if (page === "inventory") {
            window.showInventory();
        }

        else if (
            page === "activity" ||
            page === "activityLogs"
        ) {
            window.showActivityLogs();
        }
    }
);


// ============================================================
// SEARCH INVENTORY
// ============================================================

const searchInput =
    $("searchInput") ||
    $("inventorySearch") ||
    $("searchProduct");


if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterInventory
    );
}


function filterInventory() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const categoryFilter =
        $("categoryFilter");


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const tableBody =
        $("inventoryTableBody") ||
        $("inventoryBody");


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    const filtered =
        products.filter(product => {

            const matchesSearch =
                !search ||
                String(product.sku || "")
                    .toLowerCase()
                    .includes(search) ||
                String(product.name || "")
                    .toLowerCase()
                    .includes(search) ||
                String(product.category || "")
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                !category ||
                product.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );
        });


    filtered.forEach(product => {

        const quantity =
            Number(product.quantity || 0);

        const threshold =
            Number(product.threshold || 5);


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${escapeHtml(product.sku || "")}</td>
            <td>${escapeHtml(product.name || "")}</td>
            <td>${escapeHtml(product.category || "")}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="status ${
                    quantity <= threshold
                        ? "low-stock"
                        : "in-stock"
                }">
                    ${
                        quantity <= threshold
                            ? "LOW STOCK"
                            : "IN STOCK"
                    }
                </span>
            </td>
            <td>
                <button
                    class="edit-btn"
                    onclick="editProduct('${product.id}')">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteProduct('${product.id}')">
                    Delete
                </button>
            </td>
        `;


        tableBody.appendChild(row);
    });
}


const categoryFilter =
    $("categoryFilter");


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterInventory
    );
}


// ============================================================
// LOGOUT
// ============================================================

window.logout = async function () {

    try {

        await signOut(auth);

        currentUser = null;

        products = [];

        showPage("loginPage");

        clearMessages();

        console.log(
            "Logged out successfully."
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to logout: " +
            error.message
        );
    }
};


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }


    const date =
        new Date(timestamp);


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
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            currentUser = user;

            console.log(
                "Authenticated:",
                user.email
            );

            // Direct dashboard.
            // NO OTP CHECK.
            await openDashboard();

        } else {

            currentUser = null;

            hide("dashboardPage");
            hide("inventoryPage");
            hide("activityPage");
            hide("appPage");
            hide("mainApp");

            show("loginPage");
        }
    }
);


// ============================================================
// MODAL CLICK OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function (event) {

        const modal =
            $("productModal") ||
            $("addProductModal");


        if (
            modal &&
            event.target === modal
        ) {

            closeProductModal();
        }
    }
);


// ============================================================
// START
// ============================================================

console.log(
    "Arbee's Bakery Shop loaded successfully."
);

console.log(
    "OTP system: DISABLED"
);
