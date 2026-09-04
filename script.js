/* =====================================================
   ARBEES BAKERY SHOP
   FIREBASE REALTIME DATABASE ONLY
   NO FIREBASE AUTHENTICATION
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"
};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* =====================================================
   DATABASE REFERENCES
===================================================== */

const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");
const usersRef = ref(db, "users");


/* =====================================================
   CURRENT USER
===================================================== */

let currentUser = null;


/* =====================================================
   EMAIL KEY
   Firebase paths cannot contain "."
===================================================== */

function emailKey(email) {

    return email
        .trim()
        .toLowerCase()
        .replace(/\./g, "_")
        .replace(/#/g, "_")
        .replace(/\$/g, "_")
        .replace(/\[/g, "_")
        .replace(/\]/g, "_")
        .replace(/@/g, "_at_");

}


/* =====================================================
   PAGE SWITCH
===================================================== */

function showPage(page) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "addProductPage",
        "activityPage",
        "usersPage"
    ];

    pages.forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }

    });


    const target = document.getElementById(page + "Page");

    if (target) {
        target.classList.remove("hidden");
    }


    document.querySelectorAll(".nav-btn").forEach(btn => {

        btn.classList.remove("active");

        if (btn.dataset.page === page) {
            btn.classList.add("active");
        }

    });


    const titles = {
        dashboard: "Dashboard",
        inventory: "Inventory",
        addProduct: "Add Product",
        activity: "Activity Logs",
        users: "My Account"
    };


    document.getElementById("pageTitle").textContent =
        titles[page] || "Dashboard";


    if (page === "dashboard") {
        updateDashboard();
    }

    if (page === "inventory") {
        renderInventory();
    }

    if (page === "activity") {
        renderActivities();
    }

    if (page === "users") {
        loadProfile();
    }

}


/* Make available if needed */
window.showPage = showPage;


/* =====================================================
   REGISTER
===================================================== */

async function registerUser(event) {

    event.preventDefault();


    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const error =
        document.getElementById("registerError");


    error.textContent = "";


    if (!name || !email || !password) {

        error.textContent =
            "Please complete all fields.";

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

        const key = emailKey(email);

        const userRef = ref(db, "users/" + key);

        const snapshot = await get(userRef);


        if (snapshot.exists()) {

            error.textContent =
                "Email is already registered.";

            return;
        }


        await set(userRef, {

            name: name,

            email: email,

            password: password,

            role: "STAFF",

            createdAt: new Date().toISOString()

        });


        await addActivity(
            "Registered Account",
            name + " created a new account."
        );


        alert("Registration successful! You can now login.");


        document.getElementById("registerForm").reset();

        showLogin();

    }
    catch (err) {

        console.error(err);

        error.textContent =
            "Registration failed: " + err.message;

    }

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("loginPassword").value;

    const error =
        document.getElementById("loginError");


    error.textContent = "";


    if (!email || !password) {

        error.textContent =
            "Please enter email and password.";

        return;
    }


    try {

        const key = emailKey(email);

        const userRef =
            ref(db, "users/" + key);

        const snapshot =
            await get(userRef);


        if (!snapshot.exists()) {

            error.textContent =
                "Account not found.";

            return;
        }


        const user = snapshot.val();


        if (user.password !== password) {

            error.textContent =
                "Invalid email or password.";

            return;
        }


        currentUser = {

            name: user.name,

            email: user.email,

            role: user.role || "STAFF"

        };


        sessionStorage.setItem(
            "bakeryUser",
            JSON.stringify(currentUser)
        );


        document
            .getElementById("loginPage")
            .classList.add("hidden");


        document
            .getElementById("registerPage")
            .classList.add("hidden");


        document
            .getElementById("systemPage")
            .classList.remove("hidden");


        updateUserDisplay();

        await addActivity(
            "Login",
            currentUser.name + " logged into the system."
        );

        updateDashboard();


        document
            .getElementById("loginForm")
            .reset();

    }
    catch (err) {

        console.error(err);

        error.textContent =
            "Login failed: " + err.message;

    }

}


/* =====================================================
   SHOW REGISTER
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


/* =====================================================
   SHOW LOGIN
===================================================== */

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
   LOGOUT
===================================================== */

function logout() {

    sessionStorage.removeItem("bakeryUser");

    currentUser = null;


    document
        .getElementById("systemPage")
        .classList.add("hidden");


    document
        .getElementById("registerPage")
        .classList.add("hidden");


    document
        .getElementById("loginPage")
        .classList.remove("hidden");

}


window.logout = logout;


/* =====================================================
   UPDATE USER DISPLAY
===================================================== */

function updateUserDisplay() {

    if (!currentUser) return;


    document.getElementById("currentUserName").textContent =
        currentUser.name;

    document.getElementById("currentUserEmail").textContent =
        currentUser.email;

    document.getElementById("userRole").textContent =
        currentUser.role;

    document.getElementById("headerUserName").textContent =
        currentUser.name;

    document.getElementById("headerUserEmail").textContent =
        currentUser.email;

}


/* =====================================================
   PROFILE
===================================================== */

function loadProfile() {

    if (!currentUser) return;


    document.getElementById("profileName").textContent =
        currentUser.name;

    document.getElementById("profileEmail").textContent =
        currentUser.email;

    document.getElementById("profileRole").textContent =
        currentUser.role;

}


/* =====================================================
   ADD ACTIVITY
===================================================== */

async function addActivity(action, details) {

    try {

        const newActivity =
            push(activityRef);


        await set(newActivity, {

            user:
                currentUser ? currentUser.name : "System",

            email:
                currentUser ? currentUser.email : "",

            action: action,

            details: details,

            timestamp:
                new Date().toISOString()

        });

    }
    catch (err) {

        console.error(
            "Activity log error:",
            err
        );

    }

}


/* =====================================================
   ADD PRODUCT
===================================================== */

async function addProduct(event) {

    event.preventDefault();


    const message =
        document.getElementById("productMessage");


    const name =
        document.getElementById("productName").value.trim();

    const sku =
        document.getElementById("productSKU").value.trim();

    const category =
        document.getElementById("productCategory").value;

    const quantity =
        Number(document.getElementById("productQuantity").value);

    const price =
        Number(document.getElementById("productPrice").value);

    const threshold =
        Number(document.getElementById("lowStockThreshold").value);


    message.textContent = "";


    if (!name || !sku || !category) {

        message.textContent =
            "Please complete all fields.";

        message.style.color = "#d33";

        return;
    }


    if (quantity < 0 || price < 0 || threshold < 0) {

        message.textContent =
            "Invalid quantity, price, or threshold.";

        message.style.color = "#d33";

        return;
    }


    try {

        const newProduct =
            push(productsRef);


        await set(newProduct, {

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
            "Added Product",
            `${name} was added to inventory.`
        );


        message.textContent =
            "Product added successfully!";

        message.style.color = "#26834a";


        document
            .getElementById("productForm")
            .reset();


        document.getElementById(
            "lowStockThreshold"
        ).value = 5;


        updateDashboard();

    }
    catch (err) {

        console.error(err);

        message.textContent =
            "Failed to add product: " + err.message;

        message.style.color = "#d33";

    }

}


/* =====================================================
   GET PRODUCTS
===================================================== */

async function getProducts() {

    try {

        const snapshot =
            await get(productsRef);


        if (!snapshot.exists()) {
            return {};
        }


        return snapshot.val();

    }
    catch (err) {

        console.error(err);

        return {};

    }

}


/* =====================================================
   RENDER INVENTORY
===================================================== */

async function renderInventory() {

    const tbody =
        document.getElementById("inventoryTableBody");


    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                Loading...
            </td>
        </tr>
    `;


    const products =
        await getProducts();


    tbody.innerHTML = "";


    const search =
        document
            .getElementById("searchProduct")
            .value
            .toLowerCase()
            .trim();


    const category =
        document
            .getElementById("categoryFilter")
            .value;


    let count = 0;


    Object.entries(products).forEach(
        ([id, product]) => {

            const productName =
                String(product.name || "").toLowerCase();

            const productCategory =
                product.category || "";


            if (
                search &&
                !productName.includes(search)
            ) {
                return;
            }


            if (
                category !== "all" &&
                productCategory !== category
            ) {
                return;
            }


            count++;


            const quantity =
                Number(product.quantity || 0);

            const threshold =
                Number(product.threshold || 5);

            const price =
                Number(product.price || 0);


            const low =
                quantity <= threshold;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(product.name || "")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(product.sku || "-")}
                </td>

                <td>
                    ${escapeHTML(product.category || "-")}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ₱${price.toFixed(2)}
                </td>

                <td class="${low ? "status-low" : "status-good"}">
                    ${low ? "Low Stock" : "In Stock"}
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


    if (count === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No products found.
                </td>
            </tr>
        `;

    }


    document
        .querySelectorAll("[data-delete]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteProduct(button.dataset.delete)
            );

        });


    document
        .querySelectorAll("[data-edit]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editQuantity(button.dataset.edit)
            );

        });

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

async function editQuantity(id) {

    const productRef =
        ref(db, "bakeryProducts/" + id);


    const snapshot =
        await get(productRef);


    if (!snapshot.exists()) {

        alert("Product not found.");

        return;
    }


    const product =
        snapshot.val();


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
        Number.isNaN(quantity) ||
        quantity < 0
    ) {

        alert("Invalid quantity.");

        return;
    }


    try {

        await update(
            productRef,
            {
                quantity: quantity
            }
        );


        await addActivity(
            "Updated Product",
            `${product.name} quantity changed to ${quantity}.`
        );


        await renderInventory();

        await updateDashboard();


        alert("Quantity updated successfully.");

    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to update product: " +
            err.message
        );

    }

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    const productRef =
        ref(db, "bakeryProducts/" + id);


    const snapshot =
        await get(productRef);


    if (!snapshot.exists()) {

        alert("Product not found.");

        return;
    }


    const product =
        snapshot.val();


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(productRef);


        await addActivity(
            "Deleted Product",
            `${product.name} was removed from inventory.`
        );


        await renderInventory();

        await updateDashboard();


        alert("Product deleted.");

    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to delete product: " +
            err.message
        );

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

async function updateDashboard() {

    const products =
        await getProducts();


    const list =
        Object.values(products);


    let totalStock = 0;

    let estimatedValue = 0;

    let lowStockCount = 0;


    list.forEach(product => {

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


    document.getElementById(
        "totalProducts"
    ).textContent = list.length;


    document.getElementById(
        "totalStock"
    ).textContent = totalStock;


    document.getElementById(
        "lowStock"
    ).textContent = lowStockCount;


    document.getElementById(
        "estimatedValue"
    ).textContent =
        "₱" + estimatedValue.toFixed(2);


    renderLowStock(products);

    renderRecentActivity();

}


/* =====================================================
   LOW STOCK
===================================================== */

function renderLowStock(products) {

    const container =
        document.getElementById("lowStockList");


    container.innerHTML = "";


    const lowProducts =
        Object.values(products)
            .filter(product => {

                const quantity =
                    Number(product.quantity || 0);

                const threshold =
                    Number(product.threshold || 5);

                return quantity <= threshold;

            });


    if (lowProducts.length === 0) {

        container.innerHTML = `
            <p class="empty-text">
                No low stock products.
            </p>
        `;

        return;
    }


    lowProducts.forEach(product => {

        const item =
            document.createElement("div");


        item.className =
            "low-stock-item";


        item.innerHTML = `

            <strong>
                ${escapeHTML(product.name || "")}
            </strong>

            <span>
                Only ${Number(product.quantity || 0)} left
            </span>

        `;


        container.appendChild(item);

    });

}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

async function renderRecentActivity() {

    const container =
        document.getElementById("recentActivity");


    container.innerHTML = `
        <p class="empty-text">
            Loading...
        </p>
    `;


    try {

        const snapshot =
            await get(activityRef);


        if (!snapshot.exists()) {

            container.innerHTML = `
                <p class="empty-text">
                    No recent activity.
                </p>
            `;

            return;
        }


        const activities =
            Object.values(snapshot.val())
                .sort(
                    (a, b) =>
                        new Date(b.timestamp) -
                        new Date(a.timestamp)
                )
                .slice(0, 5);


        container.innerHTML = "";


        activities.forEach(activity => {

            const item =
                document.createElement("div");


            item.className =
                "activity-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(activity.action || "")}
                </strong>

                <span>
                    ${escapeHTML(activity.details || "")}
                </span>

            `;


            container.appendChild(item);

        });

    }
    catch (err) {

        console.error(err);

        container.innerHTML = `
            <p class="empty-text">
                Unable to load activity.
            </p>
        `;

    }

}


/* =====================================================
   ACTIVITY PAGE
===================================================== */

async function renderActivities() {

    const tbody =
        document.getElementById("activityTableBody");


    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center;">
                Loading...
            </td>
        </tr>
    `;


    try {

        const snapshot =
            await get(activityRef);


        tbody.innerHTML = "";


        if (!snapshot.exists()) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No activity logs.
                    </td>
                </tr>
            `;

            return;
        }


        const activities =
            Object.values(snapshot.val())
                .sort(
                    (a, b) =>
                        new Date(b.timestamp) -
                        new Date(a.timestamp)
                );


        activities.forEach(activity => {

            const row =
                document.createElement("tr");


            const date =
                activity.timestamp
                    ? new Date(
                        activity.timestamp
                    ).toLocaleString()
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>
                    ${escapeHTML(activity.user || "-")}
                </td>

                <td>
                    ${escapeHTML(activity.action || "-")}
                </td>

                <td>
                    ${escapeHTML(activity.details || "-")}
                </td>

            `;


            tbody.appendChild(row);

        });

    }
    catch (err) {

        console.error(err);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    Failed to load activity logs.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   HTML ESCAPE
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
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.page
                );

            }
        );

    });


/* =====================================================
   BUTTONS
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        loginUser
    );


document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        registerUser
    );


document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        addProduct
    );


document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        logout
    );


document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        () => showPage("addProduct")
    );


/* =====================================================
   CHECK SESSION
===================================================== */

const savedUser =
    sessionStorage.getItem("bakeryUser");


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);


        document
            .getElementById("loginPage")
            .classList.add("hidden");


        document
            .getElementById("registerPage")
            .classList.add("hidden");


        document
            .getElementById("systemPage")
            .classList.remove("hidden");


        updateUserDisplay();

        updateDashboard();

    }
    catch (err) {

        console.error(err);

        sessionStorage.removeItem(
            "bakeryUser"
        );

    }

}
