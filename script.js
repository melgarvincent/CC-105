// =====================================================
// FIREBASE REALTIME DATABASE ONLY
// NO FIREBASE AUTHENTICATION
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_PROJECT.appspot.com",

    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

    appId: "YOUR_APP_ID"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentUser = null;

let products = [];


// =====================================================
// PAGE SWITCHING
// =====================================================

function showPage(pageName) {

    document
        .querySelectorAll(".content-page")
        .forEach(page => {

            page.classList.add("hidden");

        });


    const selectedPage =
        document.getElementById(pageName + "Page");

    if (selectedPage) {

        selectedPage.classList.remove("hidden");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.page === pageName
            ) {

                button.classList.add("active");

            }

        });


    if (pageName === "dashboard") {

        updateDashboard();

    }


    if (pageName === "inventory") {

        displayInventory();

    }


    if (pageName === "activity") {

        loadActivityLogs();

    }


    if (pageName === "users") {

        updateAccount();

    }

}


// =====================================================
// SHOW REGISTER
// =====================================================

function showRegister() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.remove("hidden");


    document
        .getElementById("loginError")
        .textContent = "";

}


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");


    document
        .getElementById("registerError")
        .textContent = "";

}


// Make available if needed
window.showRegister = showRegister;
window.showLogin = showLogin;


// =====================================================
// REGISTER
// =====================================================

document
    .getElementById("registerForm")
    .addEventListener("submit", async function(event) {

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


        const button =
            document
                .getElementById("registerBtn");


        error.textContent = "";


        // Check password
        if (password.length < 6) {

            error.textContent =
                "Password must be at least 6 characters.";

            return;

        }


        // Check confirm password
        if (password !== confirmPassword) {

            error.textContent =
                "Passwords do not match.";

            return;

        }


        button.disabled = true;

        button.textContent = "Creating...";


        try {

            // Get all users
            const usersRef =
                ref(db, "users");

            const snapshot =
                await get(usersRef);


            let users =
                snapshot.exists()
                    ? snapshot.val()
                    : {};


            // Check duplicate email
            for (const key in users) {

                if (
                    users[key].email &&
                    users[key].email.toLowerCase() === email
                ) {

                    error.textContent =
                        "Email already registered.";

                    button.disabled = false;

                    button.textContent = "Register";

                    return;

                }

            }


            // Create new user
            const newUserRef =
                push(usersRef);


            const userData = {

                name: name,

                email: email,

                password: password,

                role: "STAFF",

                createdAt:
                    new Date().toISOString()

            };


            await set(
                newUserRef,
                userData
            );


            // Activity
            await addActivity(
                "REGISTER",
                name,
                "New account registered"
            );


            alert(
                "Registration successful! You can now login."
            );


            document
                .getElementById("registerForm")
                .reset();


            showLogin();


        } catch (error) {

            console.error(error);


            document
                .getElementById("registerError")
                .textContent =
                "Registration failed: " +
                error.message;

        }


        button.disabled = false;

        button.textContent = "Register";

    });


// =====================================================
// LOGIN
// =====================================================

document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        console.log("LOGIN BUTTON TRIGGERED");


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


        const button =
            document
                .getElementById("loginBtn");


        error.textContent = "";


        button.disabled = true;

        button.textContent = "Logging in...";


        try {

            console.log("Reading users from Firebase...");


            const usersRef =
                ref(db, "users");


            const snapshot =
                await get(usersRef);


            console.log(
                "Firebase users:",
                snapshot.val()
            );


            if (!snapshot.exists()) {

                error.textContent =
                    "No registered users found.";

                button.disabled = false;

                button.textContent = "Login";

                return;

            }


            const users =
                snapshot.val();


            let foundUser = null;


            for (const key in users) {

                const user =
                    users[key];


                if (
                    user.email &&
                    user.email.toLowerCase() === email &&
                    user.password === password
                ) {

                    foundUser = {

                        id: key,

                        ...user

                    };

                    break;

                }

            }


            // WRONG LOGIN
            if (!foundUser) {

                error.textContent =
                    "Incorrect email or password.";

                button.disabled = false;

                button.textContent = "Login";

                return;

            }


            // LOGIN SUCCESS
            currentUser = foundUser;


            sessionStorage.setItem(
                "currentUser",
                JSON.stringify(currentUser)
            );


            console.log(
                "LOGIN SUCCESS:",
                currentUser
            );


            await addActivity(
                "LOGIN",
                currentUser.name,
                "User logged into the system"
            );


            // Hide login
            document
                .getElementById("loginPage")
                .classList.add("hidden");


            // Show system
            document
                .getElementById("systemPage")
                .classList.remove("hidden");


            // Update information
            updateUserInformation();


            // Load inventory
            await loadProducts();


            // Show dashboard
            showPage("dashboard");


        } catch (firebaseError) {

            console.error(
                "LOGIN ERROR:",
                firebaseError
            );


            error.textContent =
                "Unable to login: " +
                firebaseError.message;

        }


        button.disabled = false;

        button.textContent = "Login";

    });


// =====================================================
// CHECK SESSION
// =====================================================

const savedUser =
    sessionStorage.getItem("currentUser");


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);


        document
            .getElementById("loginPage")
            .classList.add("hidden");


        document
            .getElementById("systemPage")
            .classList.remove("hidden");


        updateUserInformation();

        loadProducts().then(() => {

            showPage("dashboard");

        });

    } catch (error) {

        sessionStorage.removeItem(
            "currentUser"
        );

    }

}


// =====================================================
// USER INFORMATION
// =====================================================

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
        currentUser.role || "STAFF";


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
        currentUser.role || "STAFF";

}


// =====================================================
// ACCOUNT
// =====================================================

function updateAccount() {

    updateUserInformation();

}


// =====================================================
// NAVIGATION
// =====================================================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                showPage(
                    this.dataset.page
                );

            }
        );

    });


// =====================================================
// ADD PRODUCT PAGE BUTTON
// =====================================================

document
    .getElementById("inventoryAddBtn")
    .addEventListener("click", function() {

        showPage("addProduct");

    });


// =====================================================
// ADD PRODUCT
// =====================================================

document
    .getElementById("productForm")
    .addEventListener("submit", async function(event) {

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


        try {

            const productsRef =
                ref(db, "products");


            const newProductRef =
                push(productsRef);


            await set(
                newProductRef,
                {

                    name: name,

                    sku: sku,

                    category: category,

                    quantity: quantity,

                    price: price,

                    threshold: threshold,

                    createdBy:
                        currentUser.name,

                    createdAt:
                        new Date().toISOString()

                }
            );


            await addActivity(
                "ADD PRODUCT",
                currentUser.name,
                "Added " + name
            );


            document
                .getElementById("productMessage")
                .textContent =
                "Product added successfully!";


            document
                .getElementById("productForm")
                .reset();


            document
                .getElementById("lowStockThreshold")
                .value = 5;


            await loadProducts();


        } catch (error) {

            console.error(error);


            document
                .getElementById("productMessage")
                .textContent =
                "Error: " +
                error.message;

        }

    });


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    try {

        const productsRef =
            ref(db, "products");


        const snapshot =
            await get(productsRef);


        products = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            for (const key in data) {

                products.push({

                    id: key,

                    ...data[key]

                });

            }

        }


        displayInventory();

        updateDashboard();


    } catch (error) {

        console.error(
            "Products error:",
            error
        );

    }

}


// =====================================================
// DISPLAY INVENTORY
// =====================================================

function displayInventory() {

    const tbody =
        document
            .getElementById("inventoryTableBody");


    const search =
        document
            .getElementById("searchProduct")
            .value
            .toLowerCase();


    const category =
        document
            .getElementById("categoryFilter")
            .value;


    const filtered =
        products.filter(product => {

            const matchesSearch =
                String(product.name || "")
                    .toLowerCase()
                    .includes(search)
                ||
                String(product.sku || "")
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                category === "" ||
                product.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-table">

                    No products found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML = "";


    filtered.forEach(product => {

        const quantity =
            Number(product.quantity || 0);


        const threshold =
            Number(product.threshold || 5);


        const price =
            Number(product.price || 0);


        const isLow =
            quantity <= threshold;


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
                ${quantity}
            </td>

            <td>
                ₱${price.toFixed(2)}
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
                            : "IN STOCK"
                    }

                </span>

            </td>

            <td>

                <button
                    class="action-btn"
                    onclick="editProduct('${product.id}')">

                    ✏️

                </button>


                <button
                    class="action-btn delete"
                    onclick="deleteProduct('${product.id}')">

                    🗑️

                </button>

            </td>

        `;


        tbody.appendChild(row);

    });

}


// =====================================================
// SEARCH
// =====================================================

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        displayInventory
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        displayInventory
    );


// =====================================================
// EDIT PRODUCT
// =====================================================

window.editProduct = async function(id) {

    const product =
        products.find(
            p => p.id === id
        );


    if (!product) {
        return;
    }


    const newQuantity =
        prompt(
            "Enter new quantity:",
            product.quantity
        );


    if (newQuantity === null) {
        return;
    }


    const quantity =
        Number(newQuantity);


    if (
        isNaN(quantity) ||
        quantity < 0
    ) {

        alert(
            "Invalid quantity."
        );

        return;

    }


    try {

        await update(
            ref(db, "products/" + id),
            {

                quantity: quantity,

                updatedAt:
                    new Date().toISOString(),

                updatedBy:
                    currentUser.name

            }
        );


        await addActivity(
            "UPDATE PRODUCT",
            currentUser.name,
            "Updated " +
            product.name +
            " quantity"
        );


        await loadProducts();


    } catch (error) {

        alert(
            "Update failed: " +
            error.message
        );

    }

};


// =====================================================
// DELETE PRODUCT
// =====================================================

window.deleteProduct = async function(id) {

    const product =
        products.find(
            p => p.id === id
        );


    if (!product) {
        return;
    }


    const confirmDelete =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await remove(
            ref(db, "products/" + id)
        );


        await addActivity(
            "DELETE PRODUCT",
            currentUser.name,
            "Deleted " +
            product.name
        );


        await loadProducts();


    } catch (error) {

        alert(
            "Delete failed: " +
            error.message
        );

    }

};


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

    const totalProducts =
        products.length;


    let totalStock = 0;

    let lowStockCount = 0;

    let estimatedValue = 0;


    products.forEach(product => {

        const quantity =
            Number(product.quantity || 0);


        const price =
            Number(product.price || 0);


        const threshold =
            Number(product.threshold || 5);


        totalStock += quantity;


        estimatedValue +=
            quantity * price;


        if (quantity <= threshold) {

            lowStockCount++;

        }

    });


    document
        .getElementById("totalProducts")
        .textContent =
        totalProducts;


    document
        .getElementById("totalStock")
        .textContent =
        totalStock;


    document
        .getElementById("lowStock")
        .textContent =
        lowStockCount;


    document
        .getElementById("estimatedValue")
        .textContent =
        "₱" +
        estimatedValue.toFixed(2);


    displayLowStock();

}


// =====================================================
// LOW STOCK
// =====================================================

function displayLowStock() {

    const container =
        document
            .getElementById("lowStockList");


    const lowProducts =
        products.filter(product => {

            const quantity =
                Number(product.quantity || 0);


            const threshold =
                Number(product.threshold || 5);


            return quantity <= threshold;

        });


    if (lowProducts.length === 0) {

        container.innerHTML = `

            <p class="empty-message">

                No low stock products.

            </p>

        `;

        return;

    }


    container.innerHTML = "";


    lowProducts.forEach(product => {

        const item =
            document.createElement("div");


        item.className =
            "stock-item";


        item.innerHTML = `

            <strong>
                ${escapeHTML(product.name)}
            </strong>

            <small>
                Stock: ${product.quantity}
            </small>

            <span class="low-label">
                LOW STOCK
            </span>

        `;


        container.appendChild(item);

    });

}


// =====================================================
// ACTIVITY LOG
// =====================================================

async function addActivity(
    action,
    user,
    details
) {

    try {

        const activityRef =
            ref(db, "activityLogs");


        const newActivityRef =
            push(activityRef);


        await set(
            newActivityRef,
            {

                action: action,

                user: user,

                details: details,

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


// =====================================================
// LOAD ACTIVITY LOGS
// =====================================================

async function loadActivityLogs() {

    const tbody =
        document
            .getElementById("activityTableBody");


    try {

        const logsRef =
            ref(db, "activityLogs");


        const snapshot =
            await get(logsRef);


        if (!snapshot.exists()) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table">

                        No activity logs.

                    </td>

                </tr>

            `;

            return;

        }


        const data =
            snapshot.val();


        const logs = [];


        for (const key in data) {

            logs.push({

                id: key,

                ...data[key]

            });

        }


        logs.sort(
            (a, b) =>
                new Date(b.timestamp) -
                new Date(a.timestamp)
        );


        tbody.innerHTML = "";


        logs.forEach(log => {

            const row =
                document.createElement("tr");


            const date =
                new Date(
                    log.timestamp
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(log.action)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(log.user)}
                </td>

                <td>
                    ${escapeHTML(log.details)}
                </td>

                <td>
                    ${date.toLocaleString()}
                </td>

            `;


            tbody.appendChild(row);

        });


        // Recent activity
        displayRecentActivity(logs);


    } catch (error) {

        console.error(
            "Activity load error:",
            error
        );

    }

}


// =====================================================
// RECENT ACTIVITY
// =====================================================

function displayRecentActivity(logs) {

    const container =
        document
            .getElementById("recentActivity");


    const recent =
        logs.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <p class="empty-message">
                No recent activity.
            </p>

        `;

        return;

    }


    container.innerHTML = "";


    recent.forEach(log => {

        const item =
            document.createElement("div");


        item.className =
            "activity-item";


        const date =
            new Date(
                log.timestamp
            );


        item.innerHTML = `

            <strong>
                ${escapeHTML(log.action)}
            </strong>

            - ${escapeHTML(log.details)}

            <small>
                ${escapeHTML(log.user)}
                •
                ${date.toLocaleString()}
            </small>

        `;


        container.appendChild(item);

    });

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    if (currentUser) {

        await addActivity(
            "LOGOUT",
            currentUser.name,
            "User logged out"
        );

    }


    currentUser = null;

    products = [];


    sessionStorage.removeItem(
        "currentUser"
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


    document
        .getElementById("loginError")
        .textContent = "";

}


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


// =====================================================
// REGISTER / LOGIN PAGE BUTTONS
// =====================================================

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


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// START
// =====================================================

console.log(
    "Arbees Bakery System loaded successfully."
);
