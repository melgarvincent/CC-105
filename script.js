// ======================================================
// ARBEES BAKERY SHOP
// Firebase Realtime Database Only
// Login + Register + Security PIN
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Firebase references
const usersRef = ref(db, "users");
const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");

// ======================================================
// SECURITY PIN
// ======================================================

// CHANGE THIS PIN IF YOU WANT
const SECURITY_PIN = "123456";

// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;
let products = [];

// ======================================================
// PAGE ELEMENTS
// ======================================================

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const securityPage = document.getElementById("securityPage");
const systemPage = document.getElementById("systemPage");

// ======================================================
// PAGE FUNCTIONS
// ======================================================

function hideAllPages() {
    if (loginPage) loginPage.classList.add("hidden");
    if (registerPage) registerPage.classList.add("hidden");
    if (securityPage) securityPage.classList.add("hidden");
    if (systemPage) systemPage.classList.add("hidden");
}

function showLogin() {
    hideAllPages();

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");
    const error = document.getElementById("loginError");

    if (email) email.value = "";
    if (password) password.value = "";
    if (error) error.textContent = "";
}

function showRegister() {
    hideAllPages();

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    const error = document.getElementById("registerError");

    if (error) {
        error.textContent = "";
    }
}

function showSecurityPage() {
    hideAllPages();

    if (securityPage) {
        securityPage.classList.remove("hidden");
    }

    const pin = document.getElementById("securityPin");
    const error = document.getElementById("securityError");

    if (pin) {
        pin.value = "";
        setTimeout(() => pin.focus(), 100);
    }

    if (error) {
        error.textContent = "";
    }
}

function showSystem() {
    hideAllPages();

    if (systemPage) {
        systemPage.classList.remove("hidden");
    }

    updateUserInformation();
    loadProducts();
    loadActivityLogs();

    showPage("dashboard");
}

// Make available to HTML onclick if needed
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showSecurityPage = showSecurityPage;

// ======================================================
// REGISTER
// ======================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const error = document.getElementById("registerError");

        if (error) {
            error.textContent = "";
        }

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            error.textContent = "Please complete all fields.";
            return;
        }

        if (password.length < 6) {
            error.textContent =
                "Password must be at least 6 characters.";
            return;
        }

        if (password !== confirmPassword) {
            error.textContent =
                "Passwords do not match.";
            return;
        }

        try {
            // Convert email into safe Firebase key
            const userKey = email.replace(/\./g, "_");

            const userRef = ref(db, "users/" + userKey);

            // Check if user already exists
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                error.textContent =
                    "An account with this email already exists.";
                return;
            }

            // Save user
            await set(userRef, {
                name: name,
                email: email,
                password: password,
                role: "staff",
                createdAt: new Date().toISOString()
            });

            alert("Registration successful! You can now login.");

            // Clear form
            registerForm.reset();

            // Go back to login
            showLogin();

        } catch (err) {
            console.error("Registration Error:", err);

            error.textContent =
                "Registration failed. Please check your Firebase connection.";
        }
    });
}

// ======================================================
// LOGIN
// ======================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();

        const password = document
            .getElementById("loginPassword")
            .value;

        const error = document.getElementById("loginError");

        if (error) {
            error.textContent = "";
        }

        if (!email || !password) {
            error.textContent =
                "Please enter your email and password.";
            return;
        }

        try {
            const userKey = email.replace(/\./g, "_");

            const userRef = ref(db, "users/" + userKey);

            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                error.textContent =
                    "Account not found.";
                return;
            }

            const userData = snapshot.val();

            // Check password
            if (userData.password !== password) {
                error.textContent =
                    "Incorrect email or password.";
                return;
            }

            // ==========================================
            // ACCOUNT VERIFIED
            // ==========================================

            currentUser = {
                key: userKey,
                name: userData.name,
                email: userData.email,
                role: userData.role || "staff"
            };

            // Save login session
            sessionStorage.setItem(
                "arbeesCurrentUser",
                JSON.stringify(currentUser)
            );

            // Record login activity
            await addActivity(
                "Login",
                "User " + currentUser.name + " logged in."
            );

            // ==========================================
            // IMPORTANT:
            // DO NOT GO DIRECTLY TO DASHBOARD
            // GO TO SECURITY PIN FIRST
            // ==========================================

            showSecurityPage();

        } catch (err) {
            console.error("Login Error:", err);

            error.textContent =
                "Login failed. Please check your Firebase connection.";
        }
    });
}

// ======================================================
// SECURITY PIN
// ======================================================

const securityForm = document.getElementById("securityForm");

if (securityForm) {
    securityForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const pinInput =
            document.getElementById("securityPin");

        const error =
            document.getElementById("securityError");

        const pin = pinInput.value.trim();

        if (error) {
            error.textContent = "";
        }

        if (!pin) {
            error.textContent =
                "Please enter your security PIN.";
            return;
        }

        // Check PIN
        if (pin !== SECURITY_PIN) {
            error.textContent =
                "Incorrect security PIN. Please try again.";

            pinInput.value = "";
            pinInput.focus();

            return;
        }

        // ==========================================
        // SECURITY VERIFIED
        // ==========================================

        if (error) {
            error.textContent = "";
        }

        await addActivity(
            "Security Verification",
            "Security PIN verified for " +
            (currentUser ? currentUser.name : "User") +
            "."
        );

        pinInput.value = "";

        // Now allow access to the system
        showSystem();
    });
}

// ======================================================
// SECURITY BACK BUTTON
// ======================================================

const securityBackBtn =
    document.getElementById("securityBackBtn");

if (securityBackBtn) {
    securityBackBtn.addEventListener("click", function () {

        currentUser = null;

        sessionStorage.removeItem("arbeesCurrentUser");

        showLogin();
    });
}

// ======================================================
// NAVIGATION
// ======================================================

const navButtons =
    document.querySelectorAll("[data-page]");

navButtons.forEach(button => {

    button.addEventListener("click", function () {

        const pageName =
            this.getAttribute("data-page");

        showPage(pageName);
    });

});

// ======================================================
// SHOW SYSTEM PAGE
// ======================================================

function showPage(pageName) {

    // All pages
    const pages = document.querySelectorAll(".content-page");

    pages.forEach(page => {
        page.classList.add("hidden");
    });

    const selectedPage =
        document.getElementById(pageName + "Page");

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    // Update active navigation
    navButtons.forEach(button => {

        button.classList.remove("active");

        if (
            button.getAttribute("data-page") === pageName
        ) {
            button.classList.add("active");
        }

    });

    // Refresh data when opening pages
    if (pageName === "dashboard") {
        updateDashboard();
    }

    if (pageName === "inventory") {
        renderInventory();
    }

    if (pageName === "activity") {
        loadActivityLogs();
    }

    if (pageName === "users") {
        updateUserInformation();
    }
}

// ======================================================
// UPDATE USER INFORMATION
// ======================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }

    // Dashboard
    const currentUserName =
        document.getElementById("currentUserName");

    const userRole =
        document.getElementById("userRole");

    // Header
    const headerUserName =
        document.getElementById("headerUserName");

    const headerUserEmail =
        document.getElementById("headerUserEmail");

    // Account
    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const profileRole =
        document.getElementById("profileRole");

    if (currentUserName) {
        currentUserName.textContent =
            currentUser.name;
    }

    if (userRole) {
        userRole.textContent =
            currentUser.role;
    }

    if (headerUserName) {
        headerUserName.textContent =
            currentUser.name;
    }

    if (headerUserEmail) {
        headerUserEmail.textContent =
            currentUser.email;
    }

    if (profileName) {
        profileName.textContent =
            currentUser.name;
    }

    if (profileEmail) {
        profileEmail.textContent =
            currentUser.email;
    }

    if (profileRole) {
        profileRole.textContent =
            currentUser.role;
    }
}

// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const snapshot =
            await get(productsRef);

        products = [];

        if (snapshot.exists()) {

            const data = snapshot.val();

            Object.keys(data).forEach(key => {

                products.push({
                    id: key,
                    ...data[key]
                });

            });

        }

        renderInventory();
        updateDashboard();

    } catch (err) {

        console.error(
            "Load Products Error:",
            err
        );

    }
}

// ======================================================
// ADD PRODUCT
// ======================================================

const productForm =
    document.getElementById("productForm");

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document.getElementById("productName")
                    .value.trim();

            const sku =
                document.getElementById("productSKU")
                    .value.trim();

            const category =
                document.getElementById("productCategory")
                    .value;

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

            if (message) {
                message.textContent = "";
            }

            // Validation
            if (
                !name ||
                !sku ||
                !category ||
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                if (message) {
                    message.textContent =
                        "Please complete all product fields correctly.";
                }

                return;
            }

            try {

                const newProductRef =
                    push(productsRef);

                await set(newProductRef, {

                    name: name,
                    sku: sku,
                    category: category,
                    quantity: quantity,
                    price: price,
                    threshold: threshold,

                    createdAt:
                        new Date().toISOString(),

                    createdBy:
                        currentUser
                            ? currentUser.email
                            : "Unknown"

                });

                await addActivity(
                    "Add Product",
                    name +
                    " was added to inventory."
                );

                if (message) {
                    message.textContent =
                        "Product added successfully!";
                }

                productForm.reset();

                await loadProducts();

            } catch (err) {

                console.error(
                    "Add Product Error:",
                    err
                );

                if (message) {
                    message.textContent =
                        "Failed to add product.";
                }
            }
        }
    );
}

// ======================================================
// RENDER INVENTORY
// ======================================================

function renderInventory() {

    const tableBody =
        document.getElementById(
            "inventoryTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    const searchInput =
        document.getElementById(
            "searchProduct"
        );

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";

    const filteredProducts =
        products.filter(product => {

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

            return (
                matchesSearch &&
                matchesCategory
            );

        });

    if (filteredProducts.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    filteredProducts.forEach(product => {

        const row =
            document.createElement("tr");

        const isLowStock =
            Number(product.quantity) <=
            Number(product.threshold);

        row.innerHTML = `

            <td>${escapeHTML(product.sku)}</td>

            <td>${escapeHTML(product.name)}</td>

            <td>${escapeHTML(product.category)}</td>

            <td>${product.quantity}</td>

            <td>₱${Number(product.price).toFixed(2)}</td>

            <td>
                <span class="status ${isLowStock
                    ? "low-stock"
                    : "in-stock"}">
                    ${isLowStock
                        ? "LOW STOCK"
                        : "IN STOCK"}
                </span>
            </td>

            <td>
                <button
                    class="delete-btn"
                    data-id="${product.id}">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Delete buttons
    const deleteButtons =
        tableBody.querySelectorAll(
            ".delete-btn"
        );

    deleteButtons.forEach(button => {

        button.addEventListener(
            "click",
            async function () {

                const productId =
                    this.getAttribute("data-id");

                await deleteProduct(productId);

            }
        );

    });
}

// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    const confirmDelete =
        confirm(
            "Are you sure you want to delete " +
            product.name +
            "?"
        );

    if (!confirmDelete) {
        return;
    }

    try {

        const productRef =
            ref(
                db,
                "bakeryProducts/" +
                productId
            );

        await remove(productRef);

        await addActivity(
            "Delete Product",
            product.name +
            " was deleted from inventory."
        );

        await loadProducts();

    } catch (err) {

        console.error(
            "Delete Product Error:",
            err
        );

        alert(
            "Failed to delete product."
        );
    }
}

// ======================================================
// SEARCH INVENTORY
// ======================================================

const searchProduct =
    document.getElementById(
        "searchProduct"
    );

if (searchProduct) {

    searchProduct.addEventListener(
        "input",
        renderInventory
    );
}

// ======================================================
// CATEGORY FILTER
// ======================================================

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderInventory
    );
}

// ======================================================
// INVENTORY ADD BUTTON
// ======================================================

const inventoryAddBtn =
    document.getElementById(
        "inventoryAddBtn"
    );

if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function () {

            showPage("addProduct");

        }
    );
}

// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );

    const totalStock =
        document.getElementById(
            "totalStock"
        );

    const lowStock =
        document.getElementById(
            "lowStock"
        );

    const estimatedValue =
        document.getElementById(
            "estimatedValue"
        );

    const lowStockList =
        document.getElementById(
            "lowStockList"
        );

    // Total products
    if (totalProducts) {
        totalProducts.textContent =
            products.length;
    }

    // Total stock
    const stockTotal =
        products.reduce(
            (total, product) =>
                total +
                Number(product.quantity || 0),
            0
        );

    if (totalStock) {
        totalStock.textContent =
            stockTotal;
    }

    // Low stock
    const lowStockProducts =
        products.filter(product =>
            Number(product.quantity) <=
            Number(product.threshold)
        );

    if (lowStock) {
        lowStock.textContent =
            lowStockProducts.length;
    }

    // Estimated value
    const totalValue =
        products.reduce(
            (total, product) =>
                total +
                (
                    Number(product.quantity || 0) *
                    Number(product.price || 0)
                ),
            0
        );

    if (estimatedValue) {

        estimatedValue.textContent =
            "₱" +
            totalValue.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }

    // Low stock list
    if (lowStockList) {

        lowStockList.innerHTML = "";

        if (lowStockProducts.length === 0) {

            lowStockList.innerHTML =
                "<p>No low stock products.</p>";

        } else {

            lowStockProducts.forEach(product => {

                const item =
                    document.createElement("div");

                item.className =
                    "low-stock-item";

                item.innerHTML = `
                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>
                    <span>
                        ${product.quantity} left
                    </span>
                `;

                lowStockList.appendChild(item);

            });
        }
    }
}

// ======================================================
// ACTIVITY LOG
// ======================================================

async function addActivity(action, description) {

    try {

        const newActivityRef =
            push(activityRef);

        await set(newActivityRef, {

            action: action,

            description: description,

            user:
                currentUser
                    ? currentUser.email
                    : "Unknown",

            timestamp:
                new Date().toISOString()

        });

    } catch (err) {

        console.error(
            "Activity Error:",
            err
        );

    }
}

// ======================================================
// LOAD ACTIVITY LOGS
// ======================================================

async function loadActivityLogs() {

    const tableBody =
        document.getElementById(
            "activityTableBody"
        );

    const recentActivity =
        document.getElementById(
            "recentActivity"
        );

    try {

        const snapshot =
            await get(activityRef);

        const activities = [];

        if (snapshot.exists()) {

            const data =
                snapshot.val();

            Object.keys(data).forEach(key => {

                activities.push({
                    id: key,
                    ...data[key]
                });

            });

        }

        // Newest first
        activities.sort(
            (a, b) =>
                new Date(b.timestamp) -
                new Date(a.timestamp)
        );

        // ==========================================
        // ACTIVITY TABLE
        // ==========================================

        if (tableBody) {

            tableBody.innerHTML = "";

            if (activities.length === 0) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5"
                            style="text-align:center;">
                            No activity yet.
                        </td>
                    </tr>
                `;

            } else {

                activities.forEach(activity => {

                    const row =
                        document.createElement("tr");

                    const date =
                        new Date(
                            activity.timestamp
                        );

                    row.innerHTML = `

                        <td>
                            ${date.toLocaleDateString()}
                        </td>

                        <td>
                            ${date.toLocaleTimeString()}
                        </td>

                        <td>
                            ${escapeHTML(
                                activity.action || ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                activity.description || ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                activity.user || ""
                            )}
                        </td>

                    `;

                    tableBody.appendChild(row);

                });

            }
        }

        // ==========================================
        // RECENT ACTIVITY DASHBOARD
        // ==========================================

        if (recentActivity) {

            recentActivity.innerHTML = "";

            const recent =
                activities.slice(0, 5);

            if (recent.length === 0) {

                recentActivity.innerHTML =
                    "<p>No recent activity.</p>";

            } else {

                recent.forEach(activity => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "activity-item";

                    item.innerHTML = `
                        <strong>
                            ${escapeHTML(
                                activity.action || ""
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                activity.description || ""
                            )}
                        </p>
                    `;

                    recentActivity.appendChild(item);

                });

            }
        }

    } catch (err) {

        console.error(
            "Load Activity Error:",
            err
        );

    }
}

// ======================================================
// LOGOUT
// ======================================================

const logoutButtons =
    document.querySelectorAll(
        "#logoutBtn, .logout-btn, [data-action='logout']"
    );

logoutButtons.forEach(button => {

    button.addEventListener(
        "click",
        async function () {

            if (currentUser) {

                await addActivity(
                    "Logout",
                    "User " +
                    currentUser.name +
                    " logged out."
                );

            }

            currentUser = null;

            sessionStorage.removeItem(
                "arbeesCurrentUser"
            );

            products = [];

            showLogin();

        }
    );

});

// ======================================================
// RESTORE SESSION
// ======================================================

function restoreSession() {

    const savedUser =
        sessionStorage.getItem(
            "arbeesCurrentUser"
        );

    if (!savedUser) {

        showLogin();

        return;
    }

    try {

        currentUser =
            JSON.parse(savedUser);

        // IMPORTANT:
        // Existing session still needs PIN
        // before entering the system.
        showSecurityPage();

    } catch (err) {

        console.error(
            "Session Error:",
            err
        );

        sessionStorage.removeItem(
            "arbeesCurrentUser"
        );

        showLogin();
    }
}

// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ======================================================
// START APPLICATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        restoreSession();

    }
);
