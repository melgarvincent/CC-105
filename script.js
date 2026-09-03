/* =========================================================
   ARBEES BAKERY SHOP
   WEB-BASED INVENTORY SYSTEM

   FIREBASE REALTIME DATABASE ONLY
   NO FIREBASE AUTHENTICATION
========================================================= */


// =========================================================
// FIREBASE IMPORTS
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc",

    authDomain:
        "crudfirebase-b2a1f.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com",

    projectId:
        "crudfirebase-b2a1f",

    storageBucket:
        "crudfirebase-b2a1f.firebasestorage.app",

    messagingSenderId:
        "383674756572",

    appId:
        "1:383674756572:web:0585f268fb2cc8f5a6b319",

    measurementId:
        "G-QJXMR8ZQH8"
};


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const app =
    initializeApp(firebaseConfig);

const db =
    getDatabase(app);


// =========================================================
// DATABASE REFERENCES
// =========================================================

const usersRef =
    ref(db, "users");

const productsRef =
    ref(db, "bakeryProducts");

const activityRef =
    ref(db, "activityLogs");


// =========================================================
// VARIABLES
// =========================================================

let users = [];

let products = [];

let activities = [];

let currentUser = null;


// =========================================================
// DOM ELEMENTS
// =========================================================

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const productForm =
    document.getElementById("productForm");


// =========================================================
// SHA-256 PASSWORD HASH
// =========================================================

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


// =========================================================
// LOAD USERS
// =========================================================

onValue(
    usersRef,
    snapshot => {

        const data =
            snapshot.val();

        users = [];

        if (data) {

            Object.keys(data).forEach(
                key => {

                    users.push({

                        id: key,

                        name:
                            data[key].name || "",

                        email:
                            data[key].email || "",

                        password:
                            data[key].password || "",

                        role:
                            data[key].role || "staff",

                        createdAt:
                            data[key].createdAt || ""

                    });

                }
            );
        }

        console.log(
            "Users loaded:",
            users.length
        );
    },

    error => {

        console.error(
            "Users database error:",
            error
        );

    }
);


// =========================================================
// LOAD PRODUCTS
// =========================================================

onValue(
    productsRef,
    snapshot => {

        const data =
            snapshot.val();

        products = [];

        if (data) {

            Object.keys(data).forEach(
                key => {

                    products.push({

                        id: key,

                        name:
                            data[key].name || "",

                        sku:
                            data[key].sku || "",

                        category:
                            data[key].category || "",

                        quantity:
                            Number(
                                data[key].quantity || 0
                            ),

                        price:
                            Number(
                                data[key].price || 0
                            ),

                        threshold:
                            Number(
                                data[key].threshold || 0
                            ),

                        createdBy:
                            data[key].createdBy || "",

                        createdAt:
                            data[key].createdAt || ""

                    });

                }
            );
        }

        updateDashboard();

        renderInventory();

    },

    error => {

        console.error(
            "Products database error:",
            error
        );

    }
);


// =========================================================
// LOAD ACTIVITY LOGS
// =========================================================

onValue(
    activityRef,
    snapshot => {

        const data =
            snapshot.val();

        activities = [];

        if (data) {

            Object.keys(data).forEach(
                key => {

                    activities.push({

                        id: key,

                        action:
                            data[key].action || "",

                        user:
                            data[key].user || "",

                        details:
                            data[key].details || "",

                        dateTime:
                            data[key].dateTime || ""

                    });

                }
            );
        }

        activities.sort(
            (a, b) =>
                new Date(b.dateTime) -
                new Date(a.dateTime)
        );

        renderActivities();

        renderRecentActivity();

    },

    error => {

        console.error(
            "Activity database error:",
            error
        );

    }
);


// =========================================================
// REGISTER
// =========================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

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

            const errorBox =
                document.getElementById(
                    "registerError"
                );

            const registerBtn =
                document.getElementById(
                    "registerBtn"
                );

            errorBox.textContent = "";


            // VALIDATION

            if (name.length < 2) {

                errorBox.textContent =
                    "Please enter your full name.";

                return;
            }


            if (password.length < 6) {

                errorBox.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            if (password !== confirmPassword) {

                errorBox.textContent =
                    "Passwords do not match.";

                return;
            }


            // CHECK EXISTING EMAIL

            const existingUser =
                users.find(
                    user =>
                        user.email === email
                );

            if (existingUser) {

                errorBox.textContent =
                    "This email is already registered.";

                return;
            }


            try {

                registerBtn.disabled = true;

                registerBtn.textContent =
                    "Creating Account...";


                // HASH PASSWORD

                const passwordHash =
                    await hashPassword(
                        password
                    );


                // CREATE USER ID

                const newUserRef =
                    push(usersRef);

                const userId =
                    newUserRef.key;


                // SAVE USER

                await set(
                    newUserRef,
                    {

                        name: name,

                        email: email,

                        password: passwordHash,

                        role: "staff",

                        createdAt:
                            new Date().toISOString()

                    }
                );


                // ACTIVITY

                await addActivity(
                    "REGISTER",
                    email,
                    "New staff account registered."
                );


                alert(
                    "Registration successful!"
                );


                registerForm.reset();

                showLogin();


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                errorBox.textContent =
                    "Unable to create account. Check your Firebase database rules.";

            } finally {

                registerBtn.disabled = false;

                registerBtn.textContent =
                    "Create Account";

            }

        }
    );
}


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

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

            const errorBox =
                document.getElementById(
                    "loginError"
                );

            const loginBtn =
                document.getElementById(
                    "loginBtn"
                );

            errorBox.textContent = "";


            if (!email || !password) {

                errorBox.textContent =
                    "Enter your email and password.";

                return;
            }


            try {

                loginBtn.disabled = true;

                loginBtn.textContent =
                    "Logging in...";


                // HASH ENTERED PASSWORD

                const passwordHash =
                    await hashPassword(
                        password
                    );


                // FIND USER

                const user =
                    users.find(
                        item =>
                            item.email === email
                    );


                if (!user) {

                    errorBox.textContent =
                        "Account does not exist.";

                    return;
                }


                // CHECK PASSWORD

                if (
                    user.password !==
                    passwordHash
                ) {

                    errorBox.textContent =
                        "Incorrect email or password.";

                    return;
                }


                // SAVE CURRENT USER

                currentUser = {

                    id: user.id,

                    name: user.name,

                    email: user.email,

                    role: user.role

                };


                // SESSION

                sessionStorage.setItem(
                    "arbeesUser",
                    JSON.stringify(
                        currentUser
                    )
                );


                // ACTIVITY

                await addActivity(
                    "LOGIN",
                    user.email,
                    "User logged into the system."
                );


                // SHOW SYSTEM

                showSystem();


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                errorBox.textContent =
                    "Unable to login. Please try again.";

            } finally {

                loginBtn.disabled = false;

                loginBtn.textContent =
                    "Login";

            }

        }
    );
}


// =========================================================
// CHECK EXISTING SESSION
// =========================================================

const savedUser =
    sessionStorage.getItem(
        "arbeesUser"
    );

if (savedUser) {

    try {

        currentUser =
            JSON.parse(
                savedUser
            );

        showSystem();

    } catch {

        sessionStorage.removeItem(
            "arbeesUser"
        );

    }
}


// =========================================================
// SHOW LOGIN
// =========================================================

function showLogin() {

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("systemPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

    document
        .getElementById("loginEmail")
        .focus();
}


// =========================================================
// SHOW REGISTER
// =========================================================

function showRegister() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("systemPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.remove("hidden");
}


// =========================================================
// SHOW SYSTEM
// =========================================================

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

    updateDashboard();

    renderInventory();

    renderActivities();

    renderRecentActivity();
}


// =========================================================
// BUTTONS: LOGIN / REGISTER
// =========================================================

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


// =========================================================
// USER INFORMATION
// =========================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }

    const nameElements = [
        "currentUserName",
        "profileName"
    ];

    nameElements.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    currentUser.name;

            }

        }
    );


    const emailElements = [
        "currentUserEmail",
        "profileEmail"
    ];

    emailElements.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    currentUser.email;

            }

        }
    );


    const roleElements = [
        "userRole",
        "profileRole"
    ];

    roleElements.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    currentUser.role.toUpperCase();

            }

        }
    );
}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    if (!currentUser) {
        return;
    }

    try {

        await addActivity(
            "LOGOUT",
            currentUser.email,
            "User logged out."
        );

    } catch (error) {

        console.error(error);

    }

    currentUser = null;

    sessionStorage.removeItem(
        "arbeesUser"
    );

    showLogin();
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


// =========================================================
// NAVIGATION
// =========================================================

document
    .querySelectorAll(".nav-btn")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    showPage(
                        page,
                        button
                    );

                }
            );

        }
    );


function showPage(
    page,
    activeButton
) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "addProductPage",
        "activityPage",
        "usersPage"
    ];


    pages.forEach(
        pageId => {

            const element =
                document.getElementById(
                    pageId
                );

            if (element) {

                element.classList.add(
                    "hidden"
                );

            }

        }
    );


    const selectedPage =
        document.getElementById(
            page + "Page"
        );

    if (selectedPage) {

        selectedPage.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }


    if (page === "dashboard") {

        updateDashboard();

    }

    if (page === "inventory") {

        renderInventory();

    }

    if (page === "activity") {

        renderActivities();

    }
}


// =========================================================
// ADD PRODUCT PAGE BUTTONS
// =========================================================

function openAddProduct() {

    const addButton =
        document.querySelector(
            '[data-page="addProduct"]'
        );

    showPage(
        "addProduct",
        addButton
    );
}


document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        openAddProduct
    );


document
    .getElementById("floatingAdd")
    .addEventListener(
        "click",
        openAddProduct
    );


// =========================================================
// ADD PRODUCT
// =========================================================

productForm.addEventListener(
    "submit",
    async event => {

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
                    .getElementById("productThreshold")
                    .value
            );


        if (!name) {

            alert(
                "Product name is required."
            );

            return;
        }


        if (!sku) {

            alert(
                "SKU is required."
            );

            return;
        }


        if (!category) {

            alert(
                "Please select a category."
            );

            return;
        }


        if (
            quantity < 0 ||
            price < 0 ||
            threshold < 0
        ) {

            alert(
                "Values cannot be negative."
            );

            return;
        }


        // CHECK DUPLICATE SKU

        const duplicate =
            products.some(
                product =>
                    product.sku.toLowerCase() ===
                    sku.toLowerCase()
            );

        if (duplicate) {

            alert(
                "SKU already exists."
            );

            return;
        }


        try {

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
                        currentUser.email,

                    createdAt:
                        new Date().toISOString()

                }
            );


            await addActivity(
                "ADD PRODUCT",
                currentUser.email,
                "Added product: " + name
            );


            alert(
                "Product added successfully!"
            );


            productForm.reset();

            document
                .getElementById(
                    "productThreshold"
                )
                .value = 5;


            const inventoryButton =
                document.querySelector(
                    '[data-page="inventory"]'
                );

            showPage(
                "inventory",
                inventoryButton
            );


        } catch (error) {

            console.error(
                "Product error:",
                error
            );

            alert(
                "Unable to save product. Check Firebase rules."
            );

        }

    }
);


// =========================================================
// RENDER INVENTORY
// =========================================================

function renderInventory() {

    const tableBody =
        document.getElementById(
            "inventoryTableBody"
        );

    if (!tableBody) {
        return;
    }


    const search =
        document
            .getElementById("searchProduct")
            ?.value
            .toLowerCase()
            .trim() || "";


    const category =
        document
            .getElementById("categoryFilter")
            ?.value || "";


    const filtered =
        products.filter(
            product => {

                const searchMatch =

                    product.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    product.sku
                        .toLowerCase()
                        .includes(search);


                const categoryMatch =
                    category === "" ||
                    product.category === category;


                return (
                    searchMatch &&
                    categoryMatch
                );

            }
        );


    tableBody.innerHTML = "";


    if (filtered.length === 0) {

        tableBody.innerHTML = `

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


    filtered.forEach(
        product => {

            const low =
                product.quantity <=
                product.threshold;


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
                    ₱${product.price.toFixed(2)}
                </td>

                <td>

                    <span class="
                        status
                        ${low
                            ? "status-low"
                            : "status-ok"}
                    ">

                        ${low
                            ? "LOW STOCK"
                            : "IN STOCK"}

                    </span>

                </td>

                <td>

                    <button
                        class="action-btn"
                        data-action="edit"
                        data-id="${product.id}">

                        ✏️

                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${product.id}">

                        🗑️

                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        }
    );
}


// =========================================================
// SEARCH & FILTER
// =========================================================

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


// =========================================================
// INVENTORY ACTIONS
// =========================================================

document
    .getElementById("inventoryTableBody")
    .addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button"
                );

            if (!button) {
                return;
            }


            const id =
                button.dataset.id;

            const action =
                button.dataset.action;


            if (action === "edit") {

                editProduct(id);

            }


            if (action === "delete") {

                deleteProduct(id);

            }

        }
    );


// =========================================================
// EDIT PRODUCT
// =========================================================

async function editProduct(id) {

    const product =
        products.find(
            item =>
                item.id === id
        );

    if (!product) {
        return;
    }


    const quantity =
        prompt(
            "Enter new stock quantity:",
            product.quantity
        );


    if (quantity === null) {
        return;
    }


    const newQuantity =
        Number(quantity);


    if (
        isNaN(newQuantity) ||
        newQuantity < 0
    ) {

        alert(
            "Enter a valid quantity."
        );

        return;
    }


    try {

        await update(
            ref(
                db,
                "bakeryProducts/" + id
            ),
            {

                quantity:
                    newQuantity,

                updatedBy:
                    currentUser.email,

                updatedAt:
                    new Date().toISOString()

            }
        );


        await addActivity(
            "UPDATE STOCK",
            currentUser.email,
            "Updated " +
            product.name +
            " stock to " +
            newQuantity
        );


        alert(
            "Stock updated successfully!"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to update stock."
        );

    }
}


// =========================================================
// DELETE PRODUCT
// =========================================================

async function deleteProduct(id) {

    const product =
        products.find(
            item =>
                item.id === id
        );

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
                "bakeryProducts/" + id
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            currentUser.email,
            "Deleted product: " +
            product.name
        );


        alert(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );

    }
}


// =========================================================
// DASHBOARD
// =========================================================

function updateDashboard() {

    let totalStock = 0;

    let lowStock = 0;

    let totalValue = 0;


    products.forEach(
        product => {

            totalStock +=
                product.quantity;


            totalValue +=
                product.quantity *
                product.price;


            if (
                product.quantity <=
                product.threshold
            ) {

                lowStock++;

            }

        }
    );


    const totalProducts =
        document.getElementById(
            "totalProducts"
        );

    const totalStockElement =
        document.getElementById(
            "totalStock"
        );

    const lowStockElement =
        document.getElementById(
            "lowStock"
        );

    const estimatedValue =
        document.getElementById(
            "estimatedValue"
        );


    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    if (totalStockElement) {

        totalStockElement.textContent =
            totalStock;

    }


    if (lowStockElement) {

        lowStockElement.textContent =
            lowStock;

    }


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


    renderLowStock();
}


// =========================================================
// LOW STOCK
// =========================================================

function renderLowStock() {

    const container =
        document.getElementById(
            "lowStockList"
        );

    if (!container) {
        return;
    }


    const lowProducts =
        products.filter(
            product =>
                product.quantity <=
                product.threshold
        );


    if (lowProducts.length === 0) {

        container.innerHTML = `

            <p class="empty-message">
                No low stock products.
            </p>

        `;

        return;
    }


    container.innerHTML =
        lowProducts
            .map(
                product => `

                    <div class="stock-item">

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            ${escapeHTML(product.category)}
                            • SKU:
                            ${escapeHTML(product.sku)}
                        </small>

                        <span class="low-label">

                            ${product.quantity}
                            pcs remaining

                        </span>

                    </div>

                `
            )
            .join("");
}


// =========================================================
// ACTIVITY LOG
// =========================================================

async function addActivity(
    action,
    user,
    details
) {

    try {

        const newActivityRef =
            push(activityRef);


        await set(
            newActivityRef,
            {

                action:
                    action,

                user:
                    user,

                details:
                    details,

                dateTime:
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


// =========================================================
// RENDER ACTIVITY TABLE
// =========================================================

function renderActivities() {

    const tableBody =
        document.getElementById(
            "activityTableBody"
        );

    if (!tableBody) {
        return;
    }


    if (activities.length === 0) {

        tableBody.innerHTML = `

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


    tableBody.innerHTML =
        activities
            .slice(0, 100)
            .map(
                activity => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    activity.action
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                activity.user
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                activity.details
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                activity.dateTime
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");
}


// =========================================================
// RECENT ACTIVITY
// =========================================================

function renderRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );

    if (!container) {
        return;
    }


    if (activities.length === 0) {

        container.innerHTML = `

            <p class="empty-message">
                No recent activity.
            </p>

        `;

        return;
    }


    container.innerHTML =
        activities
            .slice(0, 5)
            .map(
                activity => `

                    <div class="activity-item">

                        📝
                        ${escapeHTML(
                            activity.details
                        )}

                        <small>

                            ${escapeHTML(
                                activity.user
                            )}

                            •
                            ${formatDate(
                                activity.dateTime
                            )}

                        </small>

                    </div>

                `
            )
            .join("");
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    const parsed =
        new Date(date);

    if (isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleString(
        "en-PH"
    );
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================================
// INITIAL PAGE
// =========================================================

if (!currentUser) {

    showLogin();

}

console.log(
    "Arbees Bakery Inventory System loaded."
);
