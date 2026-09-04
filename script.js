/* =====================================================
   FIREBASE REALTIME DATABASE ONLY
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

/*
   I-REPLACE NI NGA CONFIG SA IMONG FIREBASE CONFIG.

   Firebase Console
   -> Project Settings
   -> General
   -> Your apps
   -> Web app
   -> SDK setup and configuration
*/

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    databaseURL:
        "https://YOUR_PROJECT-default-rtdb.firebaseio.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId:
        "YOUR_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* =====================================================
   CURRENT USER
===================================================== */

let currentUser = null;

let products = {};

let activities = {};


/* =====================================================
   PAGE FUNCTIONS
===================================================== */

window.showRegister = function () {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.remove("hidden");

    document
        .getElementById("loginError")
        .textContent = "";

};


window.showLogin = function () {

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

    document
        .getElementById("registerError")
        .textContent = "";

};


/* =====================================================
   EMAIL KEY
===================================================== */

function emailKey(email) {

    return email
        .toLowerCase()
        .trim()
        .replace(/\./g, "_dot_")
        .replace(/#/g, "_hash_")
        .replace(/\$/g, "_dollar_")
        .replace(/\[/g, "_left_")
        .replace(/\]/g, "_right_")
        .replace(/\//g, "_slash_");

}


/* =====================================================
   PASSWORD HASH
===================================================== */

async function hashPassword(password) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );

    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

}


/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async function (event) {

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

            const error =
                document
                    .getElementById("registerError");


            error.textContent = "";


            /* PASSWORD CHECK */

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

                const userRef =
                    ref(
                        db,
                        "users/" +
                        emailKey(email)
                    );


                const snapshot =
                    await get(userRef);


                /* CHECK EXISTING ACCOUNT */

                if (snapshot.exists()) {

                    error.textContent =
                        "Email is already registered.";

                    return;
                }


                /* HASH PASSWORD */

                const passwordHash =
                    await hashPassword(password);


                /* CREATE USER */

                const userData = {

                    name: name,

                    email: email,

                    passwordHash: passwordHash,

                    role: "STAFF",

                    createdAt:
                        new Date()
                            .toISOString()

                };


                await set(
                    userRef,
                    userData
                );


                /* ACTIVITY */

                await addActivity(
                    "REGISTER",
                    name,
                    "New account registered."
                );


                alert(
                    "Account created successfully!"
                );


                document
                    .getElementById("registerForm")
                    .reset();


                showLogin();


            } catch (error) {

                console.error(error);

                errorMessage(
                    "registerError",
                    "Unable to register. Please check your Firebase Database configuration and rules."
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
        async function (event) {

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

            const error =
                document
                    .getElementById("loginError");


            error.textContent = "";


            try {

                const userRef =
                    ref(
                        db,
                        "users/" +
                        emailKey(email)
                    );


                const snapshot =
                    await get(userRef);


                /* USER NOT FOUND */

                if (!snapshot.exists()) {

                    error.textContent =
                        "Account not found. Please register first.";

                    return;
                }


                const user =
                    snapshot.val();


                /* HASH ENTERED PASSWORD */

                const enteredHash =
                    await hashPassword(password);


                /* CHECK PASSWORD */

                if (
                    enteredHash !==
                    user.passwordHash
                ) {

                    error.textContent =
                        "Wrong email or password.";

                    return;
                }


                /* LOGIN SUCCESS */

                currentUser = {

                    name: user.name,

                    email: user.email,

                    role:
                        user.role || "STAFF"

                };


                /* SAVE LOGIN */

                localStorage.setItem(
                    "arbeesCurrentUser",
                    JSON.stringify(currentUser)
                );


                /* ACTIVITY */

                await addActivity(
                    "LOGIN",
                    currentUser.name,
                    "User logged into the system."
                );


                /* SHOW SYSTEM */

                showSystem();


            } catch (error) {

                console.error(error);

                errorMessage(
                    "loginError",
                    "Unable to login. Check your Firebase Realtime Database configuration."
                );

            }

        }
    );


/* =====================================================
   SHOW SYSTEM
===================================================== */

function showSystem() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("systemPage")
        .classList.remove("hidden");


    updateUserInformation();

    loadProducts();

    loadActivities();

}


/* =====================================================
   UPDATE USER INFORMATION
===================================================== */

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    document
        .getElementById("currentUserName")
        .textContent =
        currentUser.name;


    document
        .getElementById("currentUserEmail")
        .textContent =
        currentUser.email;


    document
        .getElementById("userRole")
        .textContent =
        currentUser.role;


    document
        .getElementById("profileName")
        .textContent =
        currentUser.name;


    document
        .getElementById("profileEmail")
        .textContent =
        currentUser.email;


    document
        .getElementById("profileRole")
        .textContent =
        currentUser.role;

}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        logout
    );


document
    .getElementById("mobileLogout")
    .addEventListener(
        "click",
        logout
    );


async function logout() {

    if (currentUser) {

        await addActivity(
            "LOGOUT",
            currentUser.name,
            "User logged out."
        );

    }


    currentUser = null;

    localStorage.removeItem(
        "arbeesCurrentUser"
    );


    document
        .getElementById("systemPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");


    document
        .getElementById("loginForm")
        .reset();

}


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-btn")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        this.dataset.page;

                    showPage(page);


                    document
                        .querySelectorAll(".nav-btn")
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    this.classList.add(
                        "active"
                    );

                }
            );

        }
    );


function showPage(page) {

    document
        .querySelectorAll(".content-page")
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );


    const pageElement =
        document.getElementById(
            page + "Page"
        );


    if (pageElement) {

        pageElement.classList.remove(
            "hidden"
        );

    }


    if (page === "inventory") {

        renderInventory();

    }

}


/* =====================================================
   ADD PRODUCT BUTTON
===================================================== */

document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        function () {

            showPage("addProduct");

            document
                .querySelectorAll(".nav-btn")
                .forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );

            document
                .querySelector(
                    '[data-page="addProduct"]'
                )
                .classList.add(
                    "active"
                );

        }
    );


/* =====================================================
   PRODUCT FORM
===================================================== */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;
            }


            const name =
                document
                    .getElementById("productName")
                    .value
                    .trim();

            const sku =
                document
                    .getElementById("productSKU")
                    .value
                    .trim()
                    .toUpperCase();

            const category =
                document
                    .getElementById("productCategory")
                    .value;

            const quantity =
                Number(
                    document
                        .getElementById("productQuantity")
                        .value
                );

            const price =
                Number(
                    document
                        .getElementById("productPrice")
                        .value
                );

            const threshold =
                Number(
                    document
                        .getElementById("lowStockThreshold")
                        .value
                );


            if (!name ||
                !sku ||
                !category) {

                return;
            }


            try {

                const productRef =
                    push(
                        ref(
                            db,
                            "products"
                        )
                    );


                const product = {

                    name: name,

                    sku: sku,

                    category: category,

                    quantity: quantity,

                    price: price,

                    threshold: threshold,

                    createdBy:
                        currentUser.name,

                    createdAt:
                        new Date()
                            .toISOString()

                };


                await set(
                    productRef,
                    product
                );


                await addActivity(
                    "ADD PRODUCT",
                    currentUser.name,
                    "Added " +
                    name +
                    " (" +
                    sku +
                    ")"
                );


                document
                    .getElementById("productMessage")
                    .textContent =
                    "Product saved successfully!";


                document
                    .getElementById("productForm")
                    .reset();


                document
                    .getElementById("lowStockThreshold")
                    .value = 5;


                await loadProducts();


                setTimeout(
                    function () {

                        document
                            .getElementById(
                                "productMessage"
                            )
                            .textContent = "";

                    },
                    3000
                );


            } catch (error) {

                console.error(error);

                document
                    .getElementById("productMessage")
                    .textContent =
                    "Unable to save product.";

            }

        }
    );


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "products"
                )
            );


        products =
            snapshot.exists()
                ? snapshot.val()
                : {};


        renderInventory();

        updateDashboard();


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

    }

}


/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory() {

    const tbody =
        document
            .getElementById(
                "inventoryTableBody"
            );


    const search =
        document
            .getElementById(
                "searchProduct"
            )
            .value
            .toLowerCase();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )
            .value;


    tbody.innerHTML = "";


    const productArray =
        Object.entries(products);


    const filtered =
        productArray.filter(
            ([id, product]) => {

                const matchesSearch =
                    product.name
                        .toLowerCase()
                        .includes(search) ||

                    product.sku
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "" ||
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
                <td colspan="7"
                    class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(
        ([id, product]) => {

            const isLow =
                Number(product.quantity) <=
                Number(product.threshold);


            const row =
                document.createElement("tr");


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
                    ${product.quantity}
                </td>

                <td>
                    ₱${Number(product.price).toFixed(2)}
                </td>

                <td>

                    <span class="status ${
                        isLow
                            ? "status-low"
                            : "status-ok"
                    }">

                        ${
                            isLow
                                ? "LOW STOCK"
                                : "AVAILABLE"
                        }

                    </span>

                </td>

                <td>

                    <button
                        class="action-btn delete"
                        data-id="${id}">

                        🗑️

                    </button>

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    document
        .querySelectorAll(".action-btn.delete")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteProduct(
                            this.dataset.id
                        );

                    }
                );

            }
        );

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    if (!currentUser) {
        return;
    }


    const product =
        products[id];


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                "products/" + id
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            currentUser.name,
            "Deleted " +
            product.name +
            " (" +
            product.sku +
            ")"
        );


        await loadProducts();

        await loadActivities();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );

    }

}


/* =====================================================
   SEARCH
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
   UPDATE DASHBOARD
===================================================== */

function updateDashboard() {

    const array =
        Object.values(products);


    let totalStock = 0;

    let lowStock = 0;

    let estimatedValue = 0;


    array.forEach(
        product => {

            const quantity =
                Number(product.quantity);

            const price =
                Number(product.price);

            const threshold =
                Number(product.threshold);


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
        array.length;


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
        lowStock;


    document
        .getElementById(
            "estimatedValue"
        )
        .textContent =
        "₱" +
        estimatedValue.toFixed(2);


    updateLowStockList();

}


/* =====================================================
   LOW STOCK LIST
===================================================== */

function updateLowStockList() {

    const container =
        document
            .getElementById(
                "lowStockList"
            );


    const lowProducts =
        Object.values(products)
            .filter(
                product =>
                    Number(product.quantity) <=
                    Number(product.threshold)
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
        product => {

            container.innerHTML += `

                <div class="stock-item">

                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>

                    <small>
                        Stock:
                        ${product.quantity}
                    </small>

                    <span class="low-label">
                        LOW STOCK
                    </span>

                </div>

            `;

        }
    );

}


/* =====================================================
   ACTIVITY LOG
===================================================== */

async function addActivity(
    action,
    user,
    details
) {

    try {

        const activityRef =
            push(
                ref(
                    db,
                    "activities"
                )
            );


        await set(
            activityRef,
            {

                action: action,

                user: user,

                details: details,

                timestamp:
                    new Date()
                        .toISOString()

            }
        );

    } catch (error) {

        console.error(
            "Activity error:",
            error
        );

    }

}


/* =====================================================
   LOAD ACTIVITIES
===================================================== */

async function loadActivities() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "activities"
                )
            );


        activities =
            snapshot.exists()
                ? snapshot.val()
                : {};


        renderActivities();

        renderRecentActivities();


    } catch (error) {

        console.error(
            "Activity loading error:",
            error
        );

    }

}


/* =====================================================
   RENDER ACTIVITY TABLE
===================================================== */

function renderActivities() {

    const tbody =
        document
            .getElementById(
                "activityTableBody"
            );


    tbody.innerHTML = "";


    const array =
        Object.values(activities)
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            );


    if (array.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="empty-table">
                    No activity logs.
                </td>
            </tr>
        `;

        return;
    }


    array.forEach(
        activity => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(activity.action)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(activity.user)}
                </td>

                <td>
                    ${escapeHTML(activity.details)}
                </td>

                <td>
                    ${formatDate(activity.timestamp)}
                </td>

            `;


            tbody.appendChild(row);

        }
    );

}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

function renderRecentActivities() {

    const container =
        document
            .getElementById(
                "recentActivity"
            );


    const array =
        Object.values(activities)
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            )
            .slice(0, 5);


    if (array.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No recent activity.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    array.forEach(
        activity => {

            container.innerHTML += `

                <div class="activity-item">

                    <strong>
                        ${escapeHTML(activity.action)}
                    </strong>

                    <div>
                        ${escapeHTML(activity.details)}
                    </div>

                    <small>
                        ${escapeHTML(activity.user)}
                        •
                        ${formatDate(activity.timestamp)}
                    </small>

                </div>

            `;

        }
    );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }


    return new Date(timestamp)
        .toLocaleString();

}


/* =====================================================
   ERROR MESSAGE
===================================================== */

function errorMessage(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            message;

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   AUTO LOGIN FROM LOCAL STORAGE
===================================================== */

const savedUser =
    localStorage.getItem(
        "arbeesCurrentUser"
    );


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);

        showSystem();

    } catch {

        localStorage.removeItem(
            "arbeesCurrentUser"
        );

    }

}


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProducts();

        loadActivities();

    }
);
