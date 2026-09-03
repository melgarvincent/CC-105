/* =========================================================
   ARBEES BAKERY SHOP
   WEB-BASED INVENTORY SYSTEM
   Firebase Authentication + Realtime Database
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc",

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


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================================
   DATABASE REFERENCES
========================================================= */

const productsRef =
    ref(db, "bakeryProducts");

const activityRef =
    ref(db, "activityLogs");

const usersRef =
    ref(db, "users");


/* =========================================================
   VARIABLES
========================================================= */

let products = [];

let activities = [];

let currentUser = null;


/* =========================================================
   HELPER
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    const loginPage =
        getElement("loginPage");

    const registerPage =
        getElement("registerPage");

    const systemPage =
        getElement("systemPage");


    if (loginPage) {

        loginPage.classList.remove("hidden");

    }


    if (registerPage) {

        registerPage.classList.add("hidden");

    }


    if (systemPage) {

        systemPage.classList.add("hidden");

    }


    const error =
        getElement("loginError");

    if (error) {

        error.textContent = "";

    }

}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

    const loginPage =
        getElement("loginPage");

    const registerPage =
        getElement("registerPage");

    const systemPage =
        getElement("systemPage");


    if (loginPage) {

        loginPage.classList.add("hidden");

    }


    if (registerPage) {

        registerPage.classList.remove("hidden");

    }


    if (systemPage) {

        systemPage.classList.add("hidden");

    }


    const error =
        getElement("registerError");

    if (error) {

        error.textContent = "";

    }

}


/* =========================================================
   REGISTER / LOGIN BUTTON EVENTS
========================================================= */

const showRegisterBtn =
    getElement("showRegisterBtn");

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        showRegister
    );

}


const showLoginBtn =
    getElement("showLoginBtn");

if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );

}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    getElement("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                getElement("loginEmail")
                    .value
                    .trim();


            const password =
                getElement("loginPassword")
                    .value;


            const error =
                getElement("loginError");


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


                console.log(
                    "Login successful"
                );


            } catch (errorObject) {

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


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    getElement("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                getElement("registerName")
                    .value
                    .trim();


            const email =
                getElement("registerEmail")
                    .value
                    .trim();


            const password =
                getElement("registerPassword")
                    .value;


            const confirmPassword =
                getElement("confirmPassword")
                    .value;


            const error =
                getElement("registerError");


            if (error) {

                error.textContent = "";

            }


            /* NAME */

            if (!name) {

                error.textContent =
                    "Please enter your full name.";

                return;

            }


            /* EMAIL */

            if (!email) {

                error.textContent =
                    "Please enter your email.";

                return;

            }


            /* PASSWORD */

            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;

            }


            /* CONFIRM PASSWORD */

            if (password !== confirmPassword) {

                error.textContent =
                    "Passwords do not match.";

                return;

            }


            try {

                console.log(
                    "Creating Firebase account..."
                );


                /* CREATE ACCOUNT */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Firebase account created:",
                    user.uid
                );


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


                showLogin();


            } catch (errorObject) {

                console.error(
                    "Registration error:",
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


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async function(user) {

        currentUser = user;


        const loginPage =
            getElement("loginPage");

        const registerPage =
            getElement("registerPage");

        const systemPage =
            getElement("systemPage");


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

            if (systemPage) {

                systemPage.classList.remove("hidden");

            }


            /* USER INFORMATION */

            let userName =
                user.email || "User";

            let userRole =
                "STAFF";


            try {

                const userSnapshot =
                    await new Promise(
                        function(resolve) {

                            onValue(
                                ref(
                                    db,
                                    "users/" + user.uid
                                ),
                                resolve,
                                {
                                    onlyOnce: true
                                }
                            );

                        }
                    );


                const userData =
                    userSnapshot.val();


                if (userData) {

                    userName =
                        userData.name ||
                        user.email;

                    userRole =
                        userData.role ||
                        "staff";

                }


            } catch (errorObject) {

                console.error(
                    "User data error:",
                    errorObject
                );

            }


            const currentUserName =
                getElement("currentUserName");

            const currentUserEmail =
                getElement("currentUserEmail");

            const userRoleElement =
                getElement("userRole");


            if (currentUserName) {

                currentUserName.textContent =
                    userName;

            }


            if (currentUserEmail) {

                currentUserEmail.textContent =
                    user.email;

            }


            if (userRoleElement) {

                userRoleElement.textContent =
                    userRole.toUpperCase();

            }


            /* PROFILE */

            const profileName =
                getElement("profileName");

            const profileEmail =
                getElement("profileEmail");

            const profileRole =
                getElement("profileRole");


            if (profileName) {

                profileName.textContent =
                    userName;

            }


            if (profileEmail) {

                profileEmail.textContent =
                    user.email;

            }


            if (profileRole) {

                profileRole.textContent =
                    userRole.toUpperCase();

            }


            updateDashboard();


        } else {

            /* LOGGED OUT */

            if (systemPage) {

                systemPage.classList.add("hidden");

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


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (currentUser) {

            await addActivity(
                "User logged out: " +
                currentUser.email
            );

        }


        await signOut(auth);


    } catch (errorObject) {

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
    getElement("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}


const mobileLogout =
    getElement("mobileLogout");

if (mobileLogout) {

    mobileLogout.addEventListener(
        "click",
        logout
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(page) {

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
                getElement(pageID);


            if (element) {

                element.classList.add(
                    "hidden"
                );

            }

        }
    );


    const selectedPage =
        getElement(page + "Page");


    if (selectedPage) {

        selectedPage.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            function(button) {

                button.classList.remove(
                    "active"
                );

            }
        );


    const activeButton =
        document.querySelector(
            '.nav-btn[data-page="' +
            page +
            '"]'
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


document
    .querySelectorAll(".nav-btn")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


/* =========================================================
   ADD PRODUCT BUTTONS
========================================================= */

const inventoryAddBtn =
    getElement("inventoryAddBtn");


if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function() {

            showPage("addProduct");

        }
    );

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

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
                                data[key].sku || "",

                            name:
                                data[key].name || "",

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
            "Products Firebase error:",
            errorObject
        );

    }
);


/* =========================================================
   LOAD ACTIVITY
========================================================= */

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


/* =========================================================
   ADD ACTIVITY
========================================================= */

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
                        : "System",

                time:
                    new Date().toLocaleString()

            }
        );


    } catch (errorObject) {

        console.error(
            "Activity error:",
            errorObject
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

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
        getElement("totalProducts");

    const totalStockElement =
        getElement("totalStock");

    const lowStockElement =
        getElement("lowStock");

    const estimatedValue =
        getElement("estimatedValue");


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


/* =========================================================
   LOW STOCK
========================================================= */

function renderLowStock() {

    const container =
        getElement("lowStockList");


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


    if (lowProducts.length === 0) {

        container.innerHTML =
            `<p class="empty-message">
                No low stock products.
             </p>`;

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


/* =========================================================
   INVENTORY
========================================================= */

function renderInventory() {

    const tableBody =
        getElement("inventoryTableBody");


    if (!tableBody) {

        return;

    }


    const searchBox =
        getElement("searchProduct");


    const categoryFilter =
        getElement("categoryFilter");


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


    if (filteredProducts.length === 0) {

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


    filteredProducts.forEach(
        function(product) {

            const isLow =
                product.quantity <=
                product.threshold;


            const row =
                document.createElement("tr");


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
                        data-id="${product.id}"
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


            const editButton =
                row.querySelector(
                    ".action:not(.delete)"
                );


            const deleteButton =
                row.querySelector(
                    ".delete"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    function() {

                        editQuantity(
                            product.id
                        );

                    }
                );

            }


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    function() {

                        deleteProduct(
                            product.id
                        );

                    }
                );

            }


            tableBody.appendChild(row);

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

const searchProduct =
    getElement("searchProduct");


if (searchProduct) {

    searchProduct.addEventListener(
        "input",
        renderInventory
    );

}


const categoryFilter =
    getElement("categoryFilter");


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderInventory
    );

}


/* =========================================================
   ADD PRODUCT
========================================================= */

const productForm =
    getElement("productForm");


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
                getElement("productName")
                    .value
                    .trim();


            const sku =
                getElement("productSKU")
                    .value
                    .trim();


            const category =
                getElement("productCategory")
                    .value;


            const quantity =
                Number(
                    getElement(
                        "productQuantity"
                    ).value
                );


            const price =
                Number(
                    getElement(
                        "productPrice"
                    ).value
                );


            const threshold =
                Number(
                    getElement(
                        "lowStockThreshold"
                    ).value
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


                getElement(
                    "lowStockThreshold"
                ).value = 5;


                showPage("inventory");


            } catch (errorObject) {

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


/* =========================================================
   EDIT QUANTITY
========================================================= */

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
            "Updated stock of " +
            product.name +
            " to " +
            quantity +
            " by " +
            currentUser.email
        );


    } catch (errorObject) {

        console.error(
            "Update error:",
            errorObject
        );


        alert(
            "Unable to update product."
        );

    }

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

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


    } catch (errorObject) {

        console.error(
            "Delete error:",
            errorObject
        );


        alert(
            "Unable to delete product."
        );

    }

}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivities() {

    const recentActivity =
        getElement("recentActivity");


    const activityTable =
        getElement("activityTableBody");


    if (
        !recentActivity &&
        !activityTable
    ) {

        return;

    }


    if (activities.length === 0) {

        if (recentActivity) {

            recentActivity.innerHTML =
                `<p class="empty-message">
                    No recent activity.
                 </p>`;

        }


        if (activityTable) {

            activityTable.innerHTML =
                `<tr>
                    <td colspan="4"
                        class="empty-table">
                        No activity logs.
                    </td>
                 </tr>`;

        }

        return;

    }


    /* RECENT ACTIVITY */

    if (recentActivity) {

        recentActivity.innerHTML =
            activities
                .slice(0, 10)
                .map(
                    function(activity) {

                        return `

                            <div class="activity-item">

                                📝

                                <strong>
                                    ${escapeHTML(
                                        activity.message
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        activity.time
                                    )}
                                </small>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* ACTIVITY TABLE */

    if (activityTable) {

        activityTable.innerHTML =
            activities
                .slice(0, 50)
                .map(
                    function(activity) {

                        return `

                            <tr>

                                <td>
                                    📝
                                </td>

                                <td>
                                    ${escapeHTML(
                                        activity.user
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        activity.message
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        activity.time
                                    )}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

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


        case "auth/configuration-not-found":

            return "Firebase Authentication is not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.";


        case "auth/operation-not-allowed":

            return "Email/Password authentication is disabled. Enable it in Firebase Console → Authentication → Sign-in method.";


        case "auth/unauthorized-domain":

            return "This website domain is not authorized in Firebase Authentication.";


        default:

            return (
                errorObject.message ||
                "Something went wrong."
            );

    }

}
