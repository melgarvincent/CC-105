// ======================================================
// ARBEE'S BAKERY SHOP
// COMPLETE FIREBASE SCRIPT
// Login + Register + Forgot Password + Inventory CRUD
// ======================================================


// ======================================================
// FIREBASE IMPORTS
// ======================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue,
    get
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

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


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ======================================================
// DATABASE REFERENCES
// ======================================================

const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");
const usersRef = ref(db, "users");


// ======================================================
// VARIABLES
// ======================================================

let products = {};

let currentEditId = null;

let unsubscribeProducts = null;
let unsubscribeActivity = null;


// ======================================================
// GET ELEMENTS
// ======================================================

// ---------- LOGIN ----------

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const appPage = document.getElementById("app");

const loginForm = document.getElementById("loginForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const loginBtn = document.getElementById("loginBtn");

const loginMessage = document.getElementById("loginMessage");


// ---------- REGISTER ----------

const registerForm = document.getElementById("registerForm");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerConfirmPassword =
    document.getElementById("registerConfirmPassword");

const registerBtn = document.getElementById("registerBtn");

const registerMessage =
    document.getElementById("registerMessage");


// ---------- AUTH BUTTONS ----------

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

const showLoginBtn =
    document.getElementById("showLoginBtn");

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// ---------- USER ----------

const currentUserDisplay =
    document.getElementById("currentUserDisplay");


// ---------- DASHBOARD ----------

const totalProducts =
    document.getElementById("totalProducts");

const totalStock =
    document.getElementById("totalStock");

const lowStockItems =
    document.getElementById("lowStockItems");

const estimatedValue =
    document.getElementById("estimatedValue");

const dashboardTableBody =
    document.getElementById("dashboardTableBody");


// ---------- INVENTORY ----------

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const inventoryAddBtn =
    document.getElementById("inventoryAddBtn");

const inventoryTableBody =
    document.getElementById("inventoryTableBody");


// ---------- PRODUCT FORM ----------

const productForm =
    document.getElementById("productForm");

const editProductId =
    document.getElementById("editProductId");

const skuInput =
    document.getElementById("sku");

const productNameInput =
    document.getElementById("productName");

const categoryInput =
    document.getElementById("category");

const quantityInput =
    document.getElementById("quantity");

const priceInput =
    document.getElementById("price");

const thresholdInput =
    document.getElementById("threshold");

const productFormTitle =
    document.getElementById("productFormTitle");

const saveProductBtn =
    document.getElementById("saveProductBtn");

const cancelProductBtn =
    document.getElementById("cancelProductBtn");


// ---------- ACTIVITY ----------

const activityList =
    document.getElementById("activityList");


// ---------- TOAST ----------

const toast =
    document.getElementById("toast");


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function showMessage(element, message, type = "error") {

    if (!element) return;

    element.textContent = message;

    element.className = "";

    element.classList.add("message");

    if (type === "success") {
        element.classList.add("success");
    } else {
        element.classList.add("error");
    }
}


function clearMessage(element) {

    if (!element) return;

    element.textContent = "";
    element.className = "";
}


function showToast(message, type = "success") {

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;

    toast.className = "toast show";

    if (type === "error") {
        toast.classList.add("error");
    }

    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPeso(value) {

    const number = Number(value) || 0;

    return "₱" + number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(timestamp) {

    if (!timestamp) {
        return "Just now";
    }

    const date = new Date(timestamp);

    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


// ======================================================
// ERROR MESSAGE
// ======================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/operation-not-allowed":
            return "Email/Password login is not enabled in Firebase.";

        default:
            return error.message || "Something went wrong.";
    }
}


// ======================================================
// SHOW LOGIN PAGE
// ======================================================

function showLogin() {

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (appPage) {
        appPage.classList.add("hidden");
    }

    clearMessage(loginMessage);
    clearMessage(registerMessage);
}


// ======================================================
// SHOW REGISTER PAGE
// ======================================================

function showRegister() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    if (appPage) {
        appPage.classList.add("hidden");
    }

    clearMessage(loginMessage);
    clearMessage(registerMessage);
}


// ======================================================
// SHOW MAIN APP
// ======================================================

function showApp() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (appPage) {
        appPage.classList.remove("hidden");
    }
}


// ======================================================
// FORGOT PASSWORD
// ======================================================

if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener("click", async (event) => {

        event.preventDefault();

        const email = loginEmail
            ? loginEmail.value.trim()
            : "";

        // Check email
        if (!email) {

            showMessage(
                loginMessage,
                "Please enter your email address first."
            );

            if (loginEmail) {
                loginEmail.focus();
            }

            return;
        }


        // Check valid basic email format
        if (!email.includes("@")) {

            showMessage(
                loginMessage,
                "Please enter a valid email address."
            );

            return;
        }


        // Disable button while sending
        forgotPasswordBtn.disabled = true;

        const originalText =
            forgotPasswordBtn.textContent;

        forgotPasswordBtn.textContent =
            "Sending...";


        try {

            // Firebase password reset
            await sendPasswordResetEmail(auth, email);

            showMessage(
                loginMessage,
                "Password reset email sent! Check your Gmail inbox or spam folder.",
                "success"
            );

            showToast(
                "Password reset email sent!",
                "success"
            );

        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            showMessage(
                loginMessage,
                getFirebaseErrorMessage(error),
                "error"
            );

        } finally {

            forgotPasswordBtn.disabled = false;

            forgotPasswordBtn.textContent =
                originalText;
        }

    });

}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessage(loginMessage);

        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        if (!email || !password) {

            showMessage(
                loginMessage,
                "Please enter your email and password."
            );

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent = "Logging in...";


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage(
                loginMessage,
                "Login successful!",
                "success"
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            showMessage(
                loginMessage,
                getFirebaseErrorMessage(error)
            );

        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent = "Login";
        }

    });

}


// ======================================================
// REGISTER
// ======================================================

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessage(registerMessage);

        const name =
            registerName.value.trim();

        const email =
            registerEmail.value.trim();

        const password =
            registerPassword.value;

        const confirmPassword =
            registerConfirmPassword.value;


        // Required fields
        if (!name || !email || !password || !confirmPassword) {

            showMessage(
                registerMessage,
                "Please complete all fields."
            );

            return;
        }


        // Password match
        if (password !== confirmPassword) {

            showMessage(
                registerMessage,
                "Passwords do not match."
            );

            return;
        }


        // Minimum password
        if (password.length < 6) {

            showMessage(
                registerMessage,
                "Password must be at least 6 characters."
            );

            return;
        }


        registerBtn.disabled = true;

        registerBtn.textContent =
            "Creating account...";


        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            // Save user profile in RTDB
            await set(
                ref(db, "users/" + user.uid),
                {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: Date.now()
                }
            );


            // Activity log
            await addActivity(
                "Registered a new account",
                name + " (" + email + ")"
            );


            showMessage(
                registerMessage,
                "Account created successfully!",
                "success"
            );


            registerForm.reset();


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            showMessage(
                registerMessage,
                getFirebaseErrorMessage(error)
            );

        } finally {

            registerBtn.disabled = false;

            registerBtn.textContent =
                "Register";
        }

    });

}


// ======================================================
// SWITCH LOGIN / REGISTER
// ======================================================

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            showRegister();
        }
    );
}


if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            showLogin();
        }
    );
}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                showLogin();

                showToast(
                    "Logged out successfully.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                showToast(
                    "Unable to logout.",
                    "error"
                );
            }

        }
    );
}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log(
            "Logged in user:",
            user.email
        );


        showApp();


        if (currentUserDisplay) {

            currentUserDisplay.textContent =
                user.email;
        }


        loadProducts();

        loadActivityLogs();

        await updateDashboard();

    } else {

        console.log(
            "No user logged in."
        );


        showLogin();


        if (currentUserDisplay) {

            currentUserDisplay.textContent =
                "";
        }

    }

});


// ======================================================
// NAVIGATION
// ======================================================

const navButtons =
    document.querySelectorAll("[data-page]");


navButtons.forEach(button => {

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

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(page => {

        page.classList.remove("active");

        page.classList.add("hidden");

    });


    const selectedPage =
        document.getElementById(pageName);


    if (selectedPage) {

        selectedPage.classList.remove("hidden");

        selectedPage.classList.add("active");
    }


    // Update dashboard whenever opened
    if (pageName === "dashboard") {

        updateDashboard();
    }


    // Update inventory
    if (pageName === "inventory") {

        displayInventory();
    }


    // Update activity
    if (pageName === "activity") {

        loadActivityLogs();
    }

}


// ======================================================
// LOAD PRODUCTS
// ======================================================

function loadProducts() {

    if (unsubscribeProducts) {
        unsubscribeProducts();
    }


    unsubscribeProducts =
        onValue(
            productsRef,
            (snapshot) => {

                products =
                    snapshot.val() || {};

                displayInventory();

                updateDashboard();

            },
            (error) => {

                console.error(
                    "Products error:",
                    error
                );

                showToast(
                    "Unable to load inventory.",
                    "error"
                );
            }
        );
}


// ======================================================
// DISPLAY INVENTORY
// ======================================================

function displayInventory() {

    if (!inventoryTableBody) {
        return;
    }


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "all";


    inventoryTableBody.innerHTML = "";


    let entries =
        Object.entries(products);


    // Search
    entries =
        entries.filter(([id, product]) => {

            const sku =
                String(product.sku || "")
                    .toLowerCase();

            const name =
                String(product.name || "")
                    .toLowerCase();

            const category =
                String(product.category || "")
                    .toLowerCase();


            return (
                sku.includes(search) ||
                name.includes(search) ||
                category.includes(search)
            );

        });


    // Category filter
    if (
        selectedCategory &&
        selectedCategory !== "all"
    ) {

        entries =
            entries.filter(([id, product]) => {

                return (
                    String(product.category || "")
                        .toLowerCase()
                    ===
                    selectedCategory.toLowerCase()
                );

            });
    }


    if (entries.length === 0) {

        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(([id, product]) => {

        const quantity =
            Number(product.quantity) || 0;

        const threshold =
            Number(product.threshold) || 0;

        const price =
            Number(product.price) || 0;


        const isLowStock =
            quantity <= threshold;


        const status =
            isLowStock
                ? "LOW STOCK"
                : "IN STOCK";


        const statusClass =
            isLowStock
                ? "low-stock"
                : "in-stock";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.sku || "")}
            </td>

            <td>
                ${escapeHTML(product.name || "")}
            </td>

            <td>
                ${escapeHTML(product.category || "")}
            </td>

            <td>
                ${quantity}
            </td>

            <td>
                ${formatPeso(price)}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${status}
                </span>
            </td>

            <td>

                <button
                    class="action-btn edit-btn"
                    data-id="${id}"
                >
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-id="${id}"
                >
                    Delete
                </button>

            </td>
        `;


        inventoryTableBody.appendChild(row);

    });


    // Edit buttons
    document
        .querySelectorAll(".edit-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.id
                    );

                }
            );

        });


    // Delete buttons
    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.id
                    );

                }
            );

        });

}


// ======================================================
// SEARCH
// ======================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            displayInventory();

        }
    );
}


// ======================================================
// CATEGORY FILTER
// ======================================================

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        () => {

            displayInventory();

        }
    );
}


// ======================================================
// ADD PRODUCT BUTTON
// ======================================================

if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        () => {

            openAddProductForm();

        }
    );
}


// ======================================================
// OPEN ADD PRODUCT FORM
// ======================================================

function openAddProductForm() {

    currentEditId = null;


    if (productForm) {
        productForm.reset();
    }


    if (editProductId) {
        editProductId.value = "";
    }


    if (productFormTitle) {

        productFormTitle.textContent =
            "Add Product";
    }


    if (saveProductBtn) {

        saveProductBtn.textContent =
            "Save Product";
    }


    showPage("addProduct");
}


// ======================================================
// SAVE PRODUCT
// ======================================================

if (productForm) {

    productForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const sku =
                skuInput.value.trim();

            const name =
                productNameInput.value.trim();

            const category =
                categoryInput.value.trim();

            const quantity =
                Number(quantityInput.value);

            const price =
                Number(priceInput.value);

            const threshold =
                Number(thresholdInput.value);


            // Validation
            if (
                !sku ||
                !name ||
                !category ||
                Number.isNaN(quantity) ||
                Number.isNaN(price) ||
                Number.isNaN(threshold)
            ) {

                showToast(
                    "Please complete all product fields.",
                    "error"
                );

                return;
            }


            if (quantity < 0) {

                showToast(
                    "Quantity cannot be negative.",
                    "error"
                );

                return;
            }


            if (price < 0) {

                showToast(
                    "Price cannot be negative.",
                    "error"
                );

                return;
            }


            if (threshold < 0) {

                showToast(
                    "Threshold cannot be negative.",
                    "error"
                );

                return;
            }


            saveProductBtn.disabled = true;

            saveProductBtn.textContent =
                "Saving...";


            try {

                // UPDATE
                if (currentEditId) {

                    const productRef =
                        ref(
                            db,
                            "bakeryProducts/" +
                            currentEditId
                        );


                    await update(
                        productRef,
                        {
                            sku: sku,
                            name: name,
                            category: category,
                            quantity: quantity,
                            price: price,
                            threshold: threshold,
                            updatedAt: Date.now()
                        }
                    );


                    await addActivity(
                        "Updated product",
                        name
                    );


                    showToast(
                        "Product updated successfully!"
                    );

                }

                // ADD
                else {

                    const newProductRef =
                        push(productsRef);


                    await set(
                        newProductRef,
                        {
                            sku: sku,
                            name: name,
                            category: category,
                            quantity: quantity,
                            price: price,
                            threshold: threshold,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        }
                    );


                    await addActivity(
                        "Added new product",
                        name
                    );


                    showToast(
                        "Product added successfully!"
                    );

                }


                productForm.reset();

                currentEditId = null;

                showPage("inventory");


            } catch (error) {

                console.error(
                    "Save product error:",
                    error
                );

                showToast(
                    "Unable to save product.",
                    "error"
                );

            } finally {

                saveProductBtn.disabled = false;

                saveProductBtn.textContent =
                    "Save Product";

            }

        }
    );
}


// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id) {

    const product =
        products[id];


    if (!product) {

        showToast(
            "Product not found.",
            "error"
        );

        return;
    }


    currentEditId = id;


    editProductId.value = id;

    skuInput.value =
        product.sku || "";

    productNameInput.value =
        product.name || "";

    categoryInput.value =
        product.category || "";

    quantityInput.value =
        product.quantity ?? 0;

    priceInput.value =
        product.price ?? 0;

    thresholdInput.value =
        product.threshold ?? 0;


    if (productFormTitle) {

        productFormTitle.textContent =
            "Edit Product";
    }


    if (saveProductBtn) {

        saveProductBtn.textContent =
            "Update Product";
    }


    showPage("addProduct");
}


// ======================================================
// CANCEL PRODUCT
// ======================================================

if (cancelProductBtn) {

    cancelProductBtn.addEventListener(
        "click",
        () => {

            currentEditId = null;

            if (productForm) {
                productForm.reset();
            }

            showPage("inventory");

        }
    );
}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id) {

    const product =
        products[id];


    if (!product) {

        showToast(
            "Product not found.",
            "error"
        );

        return;
    }


    const confirmDelete =
        confirm(
            `Are you sure you want to delete "${product.name}"?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" + id
            )
        );


        await addActivity(
            "Deleted product",
            product.name
        );


        showToast(
            "Product deleted successfully!"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        showToast(
            "Unable to delete product.",
            "error"
        );

    }

}


// ======================================================
// DASHBOARD
// ======================================================

async function updateDashboard() {

    const entries =
        Object.entries(products);


    let productCount =
        entries.length;

    let stockCount = 0;

    let lowStockCount = 0;

    let totalValue = 0;


    entries.forEach(([id, product]) => {

        const quantity =
            Number(product.quantity) || 0;

        const price =
            Number(product.price) || 0;

        const threshold =
            Number(product.threshold) || 0;


        stockCount += quantity;

        totalValue +=
            quantity * price;


        if (quantity <= threshold) {

            lowStockCount++;

        }

    });


    if (totalProducts) {

        totalProducts.textContent =
            productCount;
    }


    if (totalStock) {

        totalStock.textContent =
            stockCount;
    }


    if (lowStockItems) {

        lowStockItems.textContent =
            lowStockCount;
    }


    if (estimatedValue) {

        estimatedValue.textContent =
            formatPeso(totalValue);
    }


    displayDashboardTable();
}


// ======================================================
// DASHBOARD TABLE
// ======================================================

function displayDashboardTable() {

    if (!dashboardTableBody) {
        return;
    }


    dashboardTableBody.innerHTML = "";


    const entries =
        Object.entries(products);


    // Show only first 10 products
    const firstProducts =
        entries.slice(0, 10);


    if (firstProducts.length === 0) {

        dashboardTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No products available.
                </td>
            </tr>
        `;

        return;
    }


    firstProducts.forEach(([id, product]) => {

        const quantity =
            Number(product.quantity) || 0;

        const threshold =
            Number(product.threshold) || 0;

        const price =
            Number(product.price) || 0;


        const isLowStock =
            quantity <= threshold;


        const status =
            isLowStock
                ? "LOW STOCK"
                : "IN STOCK";


        const statusClass =
            isLowStock
                ? "low-stock"
                : "in-stock";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.sku || "")}
            </td>

            <td>
                ${escapeHTML(product.name || "")}
            </td>

            <td>
                ${escapeHTML(product.category || "")}
            </td>

            <td>
                ${quantity}
            </td>

            <td>
                ${formatPeso(price)}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${status}
                </span>
            </td>

        `;


        dashboardTableBody.appendChild(row);

    });

}


// ======================================================
// ACTIVITY LOG
// ======================================================

async function addActivity(action, details) {

    try {

        const newActivityRef =
            push(activityRef);


        const user =
            auth.currentUser;


        await set(
            newActivityRef,
            {
                action: action,
                details: details || "",
                userEmail:
                    user
                        ? user.email
                        : "Unknown",
                timestamp: Date.now()
            }
        );

    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );

    }

}


// ======================================================
// LOAD ACTIVITY LOGS
// ======================================================

function loadActivityLogs() {

    if (!activityList) {
        return;
    }


    if (unsubscribeActivity) {
        unsubscribeActivity();
    }


    unsubscribeActivity =
        onValue(
            activityRef,
            (snapshot) => {

                const data =
                    snapshot.val() || {};


                activityList.innerHTML = "";


                const entries =
                    Object.entries(data)
                        .sort(
                            ([, a], [, b]) =>
                                (b.timestamp || 0) -
                                (a.timestamp || 0)
                        );


                if (entries.length === 0) {

                    activityList.innerHTML = `
                        <div class="empty-state">
                            No activity yet.
                        </div>
                    `;

                    return;
                }


                entries.forEach(
                    ([id, activity]) => {

                        const item =
                            document.createElement("div");


                        item.className =
                            "activity-item";


                        item.innerHTML = `

                            <div class="activity-content">

                                <strong>
                                    ${escapeHTML(
                                        activity.action || ""
                                    )}
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        activity.details || ""
                                    )}
                                </p>

                                <small>
                                    ${escapeHTML(
                                        activity.userEmail || ""
                                    )}
                                    •
                                    ${formatDate(
                                        activity.timestamp
                                    )}
                                </small>

                            </div>

                        `;


                        activityList.appendChild(item);

                    }
                );

            },
            (error) => {

                console.error(
                    "Activity loading error:",
                    error
                );

            }
        );
}


// ======================================================
// INITIAL PAGE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Start on login if not authenticated
        if (!auth.currentUser) {
            showLogin();
        }

    }
);
