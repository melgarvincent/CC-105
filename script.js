/* =====================================================
   ARBEES BAKERY SHOP
   FIREBASE INVENTORY SYSTEM
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

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


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);


/* =====================================================
   DATABASE REFERENCES
===================================================== */

const productsRef =
    ref(db, "bakeryProducts");

const activityRef =
    ref(db, "activityLogs");

const usersRef =
    ref(db, "users");


/* =====================================================
   VARIABLES
===================================================== */

let products = [];

let activities = [];

let currentUser = null;


/* =====================================================
   GET ELEMENTS
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const system =
    document.getElementById("system");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const productForm =
    document.getElementById("productForm");


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (system) {
        system.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    const error =
        document.getElementById("loginError");

    if (error) {
        error.textContent = "";
    }
}


/* =====================================================
   SHOW REGISTER
===================================================== */

function showRegister() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (system) {
        system.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    const error =
        document.getElementById("registerError");

    if (error) {
        error.textContent = "";
    }
}


/* =====================================================
   REGISTER / LOGIN BUTTONS
===================================================== */

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        showRegister
    );
}


const showLoginBtn =
    document.getElementById("showLoginBtn");

if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );
}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            const error =
                document
                    .getElementById("loginError");


            if (error) {
                error.textContent = "";
            }


            if (!email || !password) {

                if (error) {
                    error.textContent =
                        "Please enter your email and password.";
                }

                return;
            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                loginForm.reset();

            }

            catch (errorObject) {

                console.error(
                    "Login error:",
                    errorObject
                );

                if (error) {

                    error.textContent =
                        getFirebaseErrorMessage(
                            errorObject
                        );
                }
            }
        }
    );
}


/* =====================================================
   REGISTER
===================================================== */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

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
                    .trim();

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


            if (error) {
                error.textContent = "";
            }


            /* NAME */

            if (!name) {

                error.textContent =
                    "Please enter your full name.";

                return;
            }


            /* PASSWORD LENGTH */

            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            /* PASSWORD MATCH */

            if (password !== confirmPassword) {

                error.textContent =
                    "Passwords do not match.";

                return;
            }


            try {

                /* CREATE FIREBASE ACCOUNT */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* SAVE USER */

                await set(
                    ref(
                        db,
                        "users/" + user.uid
                    ),
                    {

                        name: name,

                        email: email,

                        role: "staff",

                        createdAt:
                            new Date().toISOString()

                    }
                );


                /* ACTIVITY */

                await addActivity(
                    "New user registered: " +
                    email
                );


                alert(
                    "Registration successful!"
                );


                registerForm.reset();


                /*
                    Firebase automatically logs
                    the new user in.

                    We let onAuthStateChanged
                    display the system.
                */

            }

            catch (errorObject) {

                console.error(
                    "Registration error:",
                    errorObject
                );

                error.textContent =
                    getFirebaseErrorMessage(
                        errorObject
                    );
            }
        }
    );
}


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async function(user) {

        currentUser = user;


        if (user) {

            console.log(
                "Logged in:",
                user.email
            );


            /* HIDE AUTH */

            if (loginPage) {
                loginPage.classList.add("hidden");
            }

            if (registerPage) {
                registerPage.classList.add("hidden");
            }


            /* SHOW SYSTEM */

            if (system) {
                system.classList.remove("hidden");
            }


            /* LOAD USER DATA */

            await loadCurrentUser(
                user.uid
            );


            updateDashboard();

            renderInventory();

            renderActivities();

        }

        else {

            /* LOGGED OUT */

            if (system) {
                system.classList.add("hidden");
            }

            if (registerPage) {
                registerPage.classList.add("hidden");
            }

            if (loginPage) {
                loginPage.classList.remove("hidden");
            }
        }
    }
);


/* =====================================================
   LOAD CURRENT USER
===================================================== */

async function loadCurrentUser(uid) {

    const userRef =
        ref(
            db,
            "users/" + uid
        );

    onValue(
        userRef,
        function(snapshot) {

            const data =
                snapshot.val();

            if (!data) {
                return;
            }


            const name =
                data.name || "User";

            const email =
                data.email ||
                currentUser?.email ||
                "";

            const role =
                data.role ||
                "staff";


            const currentUserName =
                document.getElementById(
                    "currentUserName"
                );

            const currentUserEmail =
                document.getElementById(
                    "currentUserEmail"
                );

            const userRole =
                document.getElementById(
                    "userRole"
                );

            const profileName =
                document.getElementById(
                    "profileName"
                );

            const profileEmail =
                document.getElementById(
                    "profileEmail"
                );

            const profileRole =
                document.getElementById(
                    "profileRole"
                );


            if (currentUserName) {
                currentUserName.textContent =
                    name;
            }

            if (currentUserEmail) {
                currentUserEmail.textContent =
                    email;
            }

            if (userRole) {
                userRole.textContent =
                    role.toUpperCase();
            }

            if (profileName) {
                profileName.textContent =
                    name;
            }

            if (profileEmail) {
                profileEmail.textContent =
                    email;
            }

            if (profileRole) {
                profileRole.textContent =
                    role.toUpperCase();
            }
        }
    );
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    try {

        if (currentUser) {

            await addActivity(
                "User logged out: " +
                currentUser.email
            );
        }

        await signOut(auth);

    }

    catch (errorObject) {

        console.error(
            "Logout error:",
            errorObject
        );

        alert(
            "Unable to logout."
        );
    }
}


const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );
}


const mobileLogout =
    document.getElementById("mobileLogout");

if (mobileLogout) {

    mobileLogout.addEventListener(
        "click",
        logout
    );
}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-btn")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

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
    button
) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "addProductPage",
        "activityPage",
        "usersPage",
        "settingsPage"
    ];


    pages.forEach(
        function(pageID) {

            const element =
                document.getElementById(
                    pageID
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
            function(btn) {

                btn.classList.remove(
                    "active"
                );
            }
        );


    if (button) {

        button.classList.add(
            "active"
        );
    }


    if (page === "dashboard") {

        updateDashboard();

    }

    else if (page === "inventory") {

        renderInventory();

    }

    else if (page === "activity") {

        renderActivities();

    }
}


/* =====================================================
   INVENTORY ADD BUTTON
===================================================== */

const inventoryAddBtn =
    document.getElementById(
        "inventoryAddBtn"
    );

if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function() {

            const addButton =
                document.querySelector(
                    '[data-page="addProduct"]'
                );

            showPage(
                "addProduct",
                addButton
            );
        }
    );
}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

onValue(
    productsRef,
    function(snapshot) {

        const data =
            snapshot.val();

        products = [];


        if (data) {

            Object.keys(data)
                .forEach(
                    function(key) {

                        products.push({

                            id: key,

                            sku:
                                data[key].sku ||
                                "",

                            name:
                                data[key].name ||
                                "",

                            category:
                                data[key].category ||
                                "",

                            quantity:
                                Number(
                                    data[key].quantity ||
                                    0
                                ),

                            price:
                                Number(
                                    data[key].price ||
                                    0
                                ),

                            threshold:
                                Number(
                                    data[key].threshold ||
                                    5
                                )
                        });
                    }
                );
        }


        updateDashboard();

        renderInventory();
    },

    function(errorObject) {

        console.error(
            "Products error:",
            errorObject
        );
    }
);


/* =====================================================
   LOAD ACTIVITY
===================================================== */

onValue(
    activityRef,
    function(snapshot) {

        const data =
            snapshot.val();

        activities = [];


        if (data) {

            Object.keys(data)
                .forEach(
                    function(key) {

                        activities.push({

                            id: key,

                            message:
                                data[key].message ||
                                "",

                            user:
                                data[key].user ||
                                "",

                            action:
                                data[key].action ||
                                "",

                            details:
                                data[key].details ||
                                data[key].message ||
                                "",

                            time:
                                data[key].time ||
                                ""

                        });
                    }
                );
        }


        activities.reverse();

        renderActivities();
    }
);


/* =====================================================
   ADD ACTIVITY
===================================================== */

async function addActivity(message) {

    try {

        const newActivity =
            push(activityRef);

        await set(
            newActivity,
            {

                message: message,

                user:
                    currentUser
                        ? currentUser.email
                        : "",

                action:
                    message.split(":")[0] ||
                    "Activity",

                details:
                    message,

                time:
                    new Date().toISOString()

            }
        );

    }

    catch (errorObject) {

        console.error(
            "Activity error:",
            errorObject
        );
    }
}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    let totalStock = 0;

    let lowStock = 0;

    let totalValue = 0;


    products.forEach(
        function(product) {

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


/* =====================================================
   LOW STOCK
===================================================== */

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
            function(product) {

                return (
                    product.quantity <=
                    product.threshold
                );
            }
        );


    if (
        lowProducts.length === 0
    ) {

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
                function(product) {

                    return `
                        <div class="stock-item">

                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    product.category
                                )}
                                • SKU:
                                ${escapeHTML(
                                    product.sku
                                )}
                            </small>

                            <span class="low-label">
                                ${product.quantity}
                                pcs remaining
                            </span>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =====================================================
   INVENTORY
===================================================== */

function renderInventory() {

    const table =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!table) {
        return;
    }


    const searchBox =
        document.getElementById(
            "searchProduct"
        );

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const search =
        searchBox
            ? searchBox.value
                .toLowerCase()
                .trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const filteredProducts =
        products.filter(
            function(product) {

                const name =
                    product.name
                        .toLowerCase();

                const sku =
                    product.sku
                        .toLowerCase();


                const searchMatch =
                    name.includes(search) ||
                    sku.includes(search);


                const categoryMatch =
                    category === "" ||
                    product.category === category;


                return (
                    searchMatch &&
                    categoryMatch
                );
            }
        );


    table.innerHTML = "";


    if (
        filteredProducts.length === 0
    ) {

        table.innerHTML = `
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


    filteredProducts.forEach(
        function(product) {

            const isLow =
                product.quantity <=
                product.threshold;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(
                            product.name
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        product.sku
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        product.category
                    )}
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
                        ${
                            isLow
                                ? "status-low"
                                : "status-ok"
                        }
                    ">

                        ${
                            isLow
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }

                    </span>

                </td>

                <td>

                    <button
                        class="action"
                        data-edit-id="${product.id}"
                        title="Edit Stock">
                        ✏️
                    </button>

                    <button
                        class="action delete"
                        data-delete-id="${product.id}"
                        title="Delete Product">
                        🗑️
                    </button>

                </td>
            `;


            table.appendChild(row);
        }
    );


    /* EDIT BUTTONS */

    table
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        editQuantity(
                            button.dataset.editId
                        );
                    }
                );
            }
        );


    /* DELETE BUTTONS */

    table
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        deleteProduct(
                            button.dataset.deleteId
                        );
                    }
                );
            }
        );
}


/* =====================================================
   SEARCH
===================================================== */

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


/* =====================================================
   ADD PRODUCT
===================================================== */

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;
            }


            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const sku =
                document
                    .getElementById(
                        "productSKU"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "productCategory"
                    )
                    .value;


            const quantity =
                Number(
                    document
                        .getElementById(
                            "productQuantity"
                        )
                        .value
                );


            const price =
                Number(
                    document
                        .getElementById(
                            "productPrice"
                        )
                        .value
                );


            const threshold =
                Number(
                    document
                        .getElementById(
                            "lowStockThreshold"
                        )
                        .value
                );


            /* VALIDATION */

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


            /* DUPLICATE SKU */

            const duplicate =
                products.some(
                    function(product) {

                        return (
                            product.sku
                                .toLowerCase() ===
                            sku.toLowerCase()
                        );
                    }
                );


            if (duplicate) {

                alert(
                    "SKU already exists."
                );

                return;
            }


            try {

                const newProduct =
                    push(productsRef);


                await set(
                    newProduct,
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
                    "Added product: " +
                    name +
                    " by " +
                    currentUser.email
                );


                alert(
                    "Product added successfully!"
                );


                productForm.reset();


                document
                    .getElementById(
                        "productQuantity"
                    )
                    .value = 0;


                document
                    .getElementById(
                        "productPrice"
                    )
                    .value = 0;


                document
                    .getElementById(
                        "lowStockThreshold"
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

            }

            catch (errorObject) {

                console.error(
                    "Add product error:",
                    errorObject
                );

                alert(
                    "Unable to save product: " +
                    errorObject.message
                );
            }
        }
    );
}


/* =====================================================
   EDIT QUANTITY
===================================================== */

async function editQuantity(id) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const product =
        products.find(
            function(item) {

                return item.id === id;
            }
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }


    const newQuantity =
        prompt(
            "Enter new quantity for " +
            product.name,
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
            "Please enter a valid quantity."
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

                quantity: quantity,

                updatedBy:
                    currentUser.email,

                updatedAt:
                    new Date().toISOString()

            }
        );


        await addActivity(
            "Updated stock: " +
            product.name +
            " to " +
            quantity +
            " by " +
            currentUser.email
        );

    }

    catch (errorObject) {

        console.error(
            "Update error:",
            errorObject
        );

        alert(
            "Unable to update product."
        );
    }
}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const product =
        products.find(
            function(item) {

                return item.id === id;
            }
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete " +
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
            "Deleted product: " +
            product.name +
            " by " +
            currentUser.email
        );


        alert(
            "Product deleted successfully."
        );

    }

    catch (errorObject) {

        console.error(
            "Delete error:",
            errorObject
        );

        alert(
            "Unable to delete product."
        );
    }
}


/* =====================================================
   ACTIVITY TABLE
===================================================== */

function renderActivities() {

    const table =
        document.getElementById(
            "activityTableBody"
        );

    const recentActivity =
        document.getElementById(
            "recentActivity"
        );


    if (!table && !recentActivity) {
        return;
    }


    if (activities.length === 0) {

        if (table) {

            table.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="empty-table">
                        No activity logs.
                    </td>
                </tr>
            `;
        }


        if (recentActivity) {

            recentActivity.innerHTML = `
                <p class="empty-message">
                    No recent activity.
                </p>
            `;
        }

        return;
    }


    /* ACTIVITY TABLE */

    if (table) {

        table.innerHTML =
            activities
                .slice(0, 50)
                .map(
                    function(activity) {

                        return `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        activity.action ||
                                        "Activity"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        activity.user ||
                                        "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        activity.details ||
                                        activity.message ||
                                        ""
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        activity.time
                                    )}
                                </td>

                            </tr>
                        `;
                    }
                )
                .join("");
    }


    /* RECENT ACTIVITY */

    if (recentActivity) {

        recentActivity.innerHTML =
            activities
                .slice(0, 5)
                .map(
                    function(activity) {

                        return `
                            <div class="activity-item">

                                📝
                                ${escapeHTML(
                                    activity.message
                                )}

                                <small>
                                    ${formatDate(
                                        activity.time
                                    )}
                                </small>

                            </div>
                        `;
                    }
                )
                .join("");
    }
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   FIREBASE ERROR MESSAGES
===================================================== */

function getFirebaseErrorMessage(
    errorObject
) {

    const code =
        errorObject.code || "";


    switch (code) {

        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/invalid-email":

            return "Invalid email address.";


        case "auth/user-not-found":

            return "Account does not exist.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/weak-password":

            return "Password must be at least 6 characters.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/network-request-failed":

            return "Network error. Check your internet connection.";


        case "auth/operation-not-allowed":

            return "Email/Password authentication is not enabled in Firebase.";


        default:

            return (
                errorObject.message ||
                "Something went wrong."
            );
    }
}
