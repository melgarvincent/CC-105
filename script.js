/* =========================================================
   ARBEES BAKERY SHOP
   Firebase Authentication + Realtime Database
========================================================= */

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
}
    from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
}
    from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


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
   LOGIN
========================================================= */

const loginForm =
    document.getElementById("loginForm");


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

            const errorElement =
                document.getElementById("loginError");

            errorElement.textContent = "";

            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            }

            catch (error) {

                console.error(
                    "Login Error:",
                    error
                );

                errorElement.textContent =
                    getFirebaseErrorMessage(error);

            }

        }
    );

}


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    document.getElementById("registerForm");


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

            const errorElement =
                document.getElementById(
                    "registerError"
                );

            errorElement.textContent = "";


            /* NAME */

            if (!name) {

                errorElement.textContent =
                    "Please enter your full name.";

                return;
            }


            /* PASSWORD LENGTH */

            if (password.length < 6) {

                errorElement.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            /* PASSWORD MATCH */

            if (password !== confirmPassword) {

                errorElement.textContent =
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


                /* SAVE USER DATA */

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
                            new Date().toLocaleString()

                    }
                );


                /* LOG ACTIVITY */

                await addActivity(
                    "New user registered: " +
                    email
                );


                alert(
                    "Registration successful!"
                );


                registerForm.reset();


                /* SHOW LOGIN */

                showLogin();

            }

            catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );

                errorElement.textContent =
                    getFirebaseErrorMessage(error);

            }

        }
    );

}


/* =========================================================
   SHOW LOGIN
========================================================= */

window.showLogin = function() {

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

};


/* =========================================================
   SHOW REGISTER
========================================================= */

window.showRegister = function() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.remove("hidden");

};


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async function(user) {

        currentUser = user;


        if (user) {

            console.log(
                "Logged in:",
                user.email
            );


            /* HIDE LOGIN */

            document
                .getElementById("loginPage")
                .classList.add("hidden");


            /* HIDE REGISTER */

            document
                .getElementById("registerPage")
                .classList.add("hidden");


            /* SHOW SYSTEM */

            document
                .getElementById("systemPage")
                .classList.remove("hidden");


            /* USER EMAIL */

            const emailElement =
                document.getElementById(
                    "currentUserEmail"
                );

            if (emailElement) {

                emailElement.textContent =
                    user.email;

            }


            /* LOAD USER PROFILE */

            loadUserProfile(user.uid);


            updateDashboard();

        }

        else {

            /* LOGGED OUT */

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

    }
);


/* =========================================================
   LOAD USER PROFILE
========================================================= */

function loadUserProfile(uid) {

    const userRef =
        ref(db, "users/" + uid);

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
                data.role || "staff";


            const nameElement =
                document.getElementById(
                    "currentUserName"
                );

            const emailElement =
                document.getElementById(
                    "currentUserEmail"
                );

            const roleElement =
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


            if (nameElement)
                nameElement.textContent = name;

            if (emailElement)
                emailElement.textContent = email;

            if (roleElement)
                roleElement.textContent =
                    role.toUpperCase();

            if (profileName)
                profileName.textContent = name;

            if (profileEmail)
                profileEmail.textContent = email;

            if (profileRole)
                profileRole.textContent =
                    role.toUpperCase();

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    try {

        if (currentUser) {

            await addActivity(
                "User logged out: " +
                currentUser.email
            );

        }

        await signOut(auth);

    }

    catch (error) {

        console.error(
            "Logout Error:",
            error
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
        logoutUser
    );

}


const mobileLogout =
    document.getElementById("mobileLogout");

if (mobileLogout) {

    mobileLogout.addEventListener(
        "click",
        logoutUser
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const page =
                        this.dataset.page;

                    showPage(
                        page,
                        this
                    );

                }
            );

        }
    );


function showPage(page, button) {

    const pages = [
        "dashboard",
        "inventory",
        "addProduct",
        "activity",
        "users",
        "settings"
    ];


    pages.forEach(
        function(pageName) {

            const element =
                document.getElementById(
                    pageName + "Page"
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


    if (page === "inventory") {

        renderInventory();

    }


    if (page === "activity") {

        renderActivities();

    }

}


/* =========================================================
   ADD PRODUCT PAGE
========================================================= */

const inventoryAddBtn =
    document.getElementById(
        "inventoryAddBtn"
    );


if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function() {

            showPage("addProduct", null);

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

    function(error) {

        console.error(
            "Products Error:",
            error
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
                                data[key].message || "",

                            time:
                                data[key].time || ""

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

                time:
                    new Date().toLocaleString()

            }
        );

    }

    catch (error) {

        console.error(
            "Activity Error:",
            error
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    let totalStock = 0;

    let lowStockCount = 0;

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

                lowStockCount++;

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


    if (totalProducts)
        totalProducts.textContent =
            products.length;


    if (totalStockElement)
        totalStockElement.textContent =
            totalStock;


    if (lowStockElement)
        lowStockElement.textContent =
            lowStockCount;


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


    if (lowProducts.length === 0) {

        container.innerHTML =
            "<p class='empty-message'>" +
            "No low stock products." +
            "</p>";

        return;

    }


    container.innerHTML =
        lowProducts
            .map(
                function(product) {

                    return `

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

                    `;

                }
            )
            .join("");

}


/* =========================================================
   INVENTORY
========================================================= */

function renderInventory() {

    const table =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!table) {
        return;
    }


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
            ? searchInput.value
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


    table.innerHTML = "";


    if (filteredProducts.length === 0) {

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
                        ${isLow
                            ? "status-low"
                            : "status-ok"}
                    ">

                        ${isLow
                            ? "LOW STOCK"
                            : "IN STOCK"}

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


            row
                .querySelector(".action")
                .addEventListener(
                    "click",
                    function() {

                        editQuantity(
                            product.id
                        );

                    }
                );


            row
                .querySelector(".delete")
                .addEventListener(
                    "click",
                    function() {

                        deleteProduct(
                            product.id
                        );

                    }
                );


            table.appendChild(row);

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

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


/* =========================================================
   ADD PRODUCT
========================================================= */

const productForm =
    document.getElementById(
        "productForm"
    );


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
                    .getElementById("productName")
                    .value
                    .trim();


            const sku =
                document
                    .getElementById("productSKU")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("productCategory")
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
                            "productThreshold"
                        )
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
                            new Date().toLocaleString()

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
                        "productThreshold"
                    )
                    .value = 5;


                showPage(
                    "inventory",
                    null
                );

            }

            catch (error) {

                console.error(
                    "Add Product Error:",
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
                    new Date().toLocaleString()

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

    }

    catch (error) {

        console.error(
            "Update Error:",
            error
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

    }

    catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            "Unable to delete product."
        );

    }

}


/* =========================================================
   ACTIVITY LOGS
========================================================= */

function renderActivities() {

    const table =
        document.getElementById(
            "activityTableBody"
        );


    if (!table) {
        return;
    }


    if (activities.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="2"
                    class="empty-table">

                    No activity logs.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        activities
            .slice(0, 50)
            .map(
                function(activity) {

                    return `

                        <tr>

                            <td>
                                📝
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

function getFirebaseErrorMessage(error) {

    const code =
        error.code || "";


    switch (code) {

        case "auth/configuration-not-found":

            return (
                "Firebase Authentication is not enabled. " +
                "Please enable Email/Password in Firebase Console."
            );


        case "auth/invalid-credential":

            return (
                "Incorrect email or password."
            );


        case "auth/invalid-email":

            return (
                "Invalid email address."
            );


        case "auth/user-not-found":

            return (
                "Account does not exist."
            );


        case "auth/wrong-password":

            return (
                "Incorrect password."
            );


        case "auth/email-already-in-use":

            return (
                "This email is already registered."
            );


        case "auth/weak-password":

            return (
                "Password must be at least 6 characters."
            );


        case "auth/too-many-requests":

            return (
                "Too many attempts. Please try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Check your internet connection."
            );


        default:

            return (
                error.message ||
                "Something went wrong."
            );

    }

}
