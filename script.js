/* =========================================================
   ARBEES BAKERY SHOP
   WEB-BASED INVENTORY SYSTEM
   Firebase Authentication + Realtime Database
========================================================= */

/* =========================================================
   FIREBASE IMPORTS
========================================================= */

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


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================================
   DATABASE REFERENCES
========================================================= */

const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");
const usersRef = ref(db, "users");


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let products = [];
let activities = [];
let currentUser = null;


/* =========================================================
   HELPER - GET ELEMENT
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   LOGIN FORM
========================================================= */

const loginForm = getElement("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const emailElement = getElement("loginEmail");
        const passwordElement = getElement("loginPassword");
        const errorElement = getElement("loginError");

        if (!emailElement || !passwordElement) {
            return;
        }

        const email = emailElement.value.trim();
        const password = passwordElement.value;

        if (errorElement) {
            errorElement.textContent = "";
        }

        if (!email || !password) {

            if (errorElement) {
                errorElement.textContent =
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

        } catch (errorObject) {

            console.error("Login error:", errorObject);

            if (errorElement) {
                errorElement.textContent =
                    getFirebaseErrorMessage(errorObject);
            }
        }

    });

}


/* =========================================================
   REGISTER FORM
========================================================= */

const registerForm = getElement("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const nameElement = getElement("registerName");
        const emailElement = getElement("registerEmail");
        const passwordElement = getElement("registerPassword");
        const confirmElement = getElement("confirmPassword");
        const errorElement = getElement("registerError");

        if (
            !nameElement ||
            !emailElement ||
            !passwordElement ||
            !confirmElement
        ) {
            return;
        }

        const name = nameElement.value.trim();
        const email = emailElement.value.trim();
        const password = passwordElement.value;
        const confirmPassword = confirmElement.value;

        if (errorElement) {
            errorElement.textContent = "";
        }


        /* Validate name */

        if (!name) {

            if (errorElement) {
                errorElement.textContent =
                    "Please enter your full name.";
            }

            return;
        }


        /* Validate email */

        if (!email) {

            if (errorElement) {
                errorElement.textContent =
                    "Please enter your email.";
            }

            return;
        }


        /* Validate password */

        if (password.length < 6) {

            if (errorElement) {
                errorElement.textContent =
                    "Password must be at least 6 characters.";
            }

            return;
        }


        /* Confirm password */

        if (password !== confirmPassword) {

            if (errorElement) {
                errorElement.textContent =
                    "Passwords do not match.";
            }

            return;
        }


        try {

            /* Create Firebase Authentication account */

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            /* Save user information */

            await set(
                ref(db, "users/" + user.uid),
                {
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: new Date().toLocaleString()
                }
            );


            /* Save activity */

            await addActivity(
                "REGISTER",
                email,
                "New user registered"
            );


            /* Clear form */

            registerForm.reset();


            alert("Registration successful!");


            /* Go back to login */

            await signOut(auth);

            showLogin();


        } catch (errorObject) {

            console.error(
                "Registration error:",
                errorObject
            );

            if (errorElement) {
                errorElement.textContent =
                    getFirebaseErrorMessage(errorObject);
            }
        }

    });

}


/* =========================================================
   SHOW LOGIN
========================================================= */

window.showLogin = function() {

    const loginPage = getElement("loginPage");
    const registerPage = getElement("registerPage");

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    const error = getElement("loginError");

    if (error) {
        error.textContent = "";
    }

};


/* =========================================================
   SHOW REGISTER
========================================================= */

window.showRegister = function() {

    const loginPage = getElement("loginPage");
    const registerPage = getElement("registerPage");

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    const error = getElement("registerError");

    if (error) {
        error.textContent = "";
    }

};


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async function(user) {

    currentUser = user;

    const loginPage = getElement("loginPage");
    const registerPage = getElement("registerPage");
    const systemPage = getElement("systemPage");

    if (user) {

        /* Hide authentication pages */

        if (loginPage) {
            loginPage.classList.add("hidden");
        }

        if (registerPage) {
            registerPage.classList.add("hidden");
        }


        /* Show main system */

        if (systemPage) {
            systemPage.classList.remove("hidden");
        }


        /* Load user information */

        await loadCurrentUser();


        /* Dashboard */

        updateDashboard();

    } else {

        /* Hide system */

        if (systemPage) {
            systemPage.classList.add("hidden");
        }


        /* Hide register */

        if (registerPage) {
            registerPage.classList.add("hidden");
        }


        /* Show login */

        if (loginPage) {
            loginPage.classList.remove("hidden");
        }

    }

});


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function loadCurrentUser() {

    if (!currentUser) {
        return;
    }

    const userId = currentUser.uid;

    onValue(
        ref(db, "users/" + userId),
        function(snapshot) {

            const data = snapshot.val();

            const name =
                data && data.name
                    ? data.name
                    : "User";

            const email =
                data && data.email
                    ? data.email
                    : currentUser.email;

            const role =
                data && data.role
                    ? data.role.toUpperCase()
                    : "STAFF";


            /* Dashboard */

            const currentUserName =
                getElement("currentUserName");

            const currentUserEmail =
                getElement("currentUserEmail");

            const userRole =
                getElement("userRole");


            if (currentUserName) {
                currentUserName.textContent = name;
            }

            if (currentUserEmail) {
                currentUserEmail.textContent = email;
            }

            if (userRole) {
                userRole.textContent = role;
            }


            /* User profile */

            const profileName =
                getElement("profileName");

            const profileEmail =
                getElement("profileEmail");

            const profileRole =
                getElement("profileRole");


            if (profileName) {
                profileName.textContent = name;
            }

            if (profileEmail) {
                profileEmail.textContent = email;
            }

            if (profileRole) {
                profileRole.textContent = role;
            }

        },
        function(errorObject) {

            console.error(
                "User information error:",
                errorObject
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

window.logout = async function() {

    try {

        if (currentUser) {

            await addActivity(
                "LOGOUT",
                currentUser.email,
                "User logged out"
            );

        }

        await signOut(auth);

    } catch (errorObject) {

        console.error(
            "Logout error:",
            errorObject
        );

        alert("Unable to logout.");

    }

};


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

const logoutBtn = getElement("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function() {
        logout();
    });

}


const mobileLogout = getElement("mobileLogout");

if (mobileLogout) {

    mobileLogout.addEventListener("click", function() {
        logout();
    });

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

window.showPage = function(page, button) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "addProductPage",
        "activityPage",
        "usersPage",
        "settingsPage"
    ];


    /* Hide all pages */

    pages.forEach(function(pageID) {

        const element = getElement(pageID);

        if (element) {
            element.classList.add("hidden");
        }

    });


    /* Show selected page */

    const selectedPage =
        getElement(page + "Page");

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }


    /* Remove active */

    document
        .querySelectorAll(".nav-btn")
        .forEach(function(btn) {

            btn.classList.remove("active");

        });


    /* Add active */

    if (button) {
        button.classList.add("active");
    }


    /* Page-specific actions */

    if (page === "dashboard") {

        updateDashboard();

    }

    if (page === "inventory") {

        renderInventory();

    }

    if (page === "activity") {

        renderActivities();

    }

};


/* =========================================================
   NAVIGATION BUTTON EVENTS
========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach(function(button) {

        button.addEventListener("click", function() {

            const page =
                button.getAttribute("data-page");

            if (page) {
                showPage(page, button);
            }

        });

    });


/* =========================================================
   INVENTORY ADD BUTTON
========================================================= */

const inventoryAddBtn =
    getElement("inventoryAddBtn");

if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function() {

            showPage(
                "addProduct",
                document.querySelector(
                    '.nav-btn[data-page="addProduct"]'
                )
            );

        }
    );

}


/* =========================================================
   FIREBASE - LOAD PRODUCTS
========================================================= */

onValue(
    productsRef,
    function(snapshot) {

        const data = snapshot.val();

        products = [];


        if (data) {

            Object.keys(data).forEach(function(key) {

                const item = data[key];

                products.push({

                    id: key,

                    sku:
                        item.sku || "",

                    name:
                        item.name || "",

                    category:
                        item.category || "",

                    quantity:
                        Number(item.quantity || 0),

                    price:
                        Number(item.price || 0),

                    threshold:
                        Number(
                            item.threshold ??
                            item.lowStockThreshold ??
                            5
                        )

                });

            });

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
   FIREBASE - LOAD ACTIVITY
========================================================= */

onValue(
    activityRef,
    function(snapshot) {

        const data = snapshot.val();

        activities = [];


        if (data) {

            Object.keys(data).forEach(function(key) {

                const item = data[key];

                activities.push({

                    id: key,

                    action:
                        item.action || "ACTIVITY",

                    user:
                        item.user || "",

                    details:
                        item.details ||
                        item.message ||
                        "",

                    message:
                        item.message ||
                        item.details ||
                        "",

                    time:
                        item.time || ""

                });

            });

        }


        /* Newest first */

        activities.reverse();

        renderActivities();

    },
    function(errorObject) {

        console.error(
            "Activity Firebase error:",
            errorObject
        );

    }
);


/* =========================================================
   ADD ACTIVITY
========================================================= */

async function addActivity(
    action,
    user,
    details
) {

    try {

        const newActivity =
            push(activityRef);

        await set(
            newActivity,
            {

                action: action,

                user: user,

                details: details,

                message: details,

                time:
                    new Date().toLocaleString()

            }
        );

    } catch (errorObject) {

        console.error(
            "Activity log error:",
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


    products.forEach(function(product) {

        totalStock += product.quantity;

        totalValue +=
            product.quantity *
            product.price;


        if (
            product.quantity <=
            product.threshold
        ) {

            lowStock++;

        }

    });


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
        products.filter(function(product) {

            return (
                product.quantity <=
                product.threshold
            );

        });


    if (lowProducts.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No low stock products.
            </p>
        `;

        return;

    }


    container.innerHTML =
        lowProducts.map(function(product) {

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

        }).join("");

}


/* =========================================================
   INVENTORY
========================================================= */

window.renderInventory = function() {

    const table =
        getElement("inventoryTableBody");

    if (!table) {
        return;
    }


    const searchBox =
        getElement("searchProduct");

    const categoryFilter =
        getElement("categoryFilter");


    const search =
        searchBox
            ? searchBox.value.toLowerCase().trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const filteredProducts =
        products.filter(function(product) {

            const name =
                product.name.toLowerCase();

            const sku =
                product.sku.toLowerCase();


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

        });


    table.innerHTML = "";


    if (filteredProducts.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    filteredProducts.forEach(function(product) {

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
                    type="button"
                    class="action"
                    onclick="editQuantity('${product.id}')"
                    title="Edit Stock">
                    ✏️
                </button>

                <button
                    type="button"
                    class="action delete"
                    onclick="deleteProduct('${product.id}')"
                    title="Delete Product">
                    🗑️
                </button>

            </td>

        `;


        table.appendChild(row);

    });

};


/* =========================================================
   SEARCH INVENTORY
========================================================= */

const searchProduct =
    getElement("searchProduct");

if (searchProduct) {

    searchProduct.addEventListener(
        "input",
        function() {

            renderInventory();

        }
    );

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

const categoryFilter =
    getElement("categoryFilter");

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        function() {

            renderInventory();

        }
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
                getElement("productName").value.trim();

            const sku =
                getElement("productSKU").value.trim();

            const category =
                getElement("productCategory").value;

            const quantity =
                Number(
                    getElement("productQuantity").value
                );

            const price =
                Number(
                    getElement("productPrice").value
                );

            const threshold =
                Number(
                    getElement("productThreshold").value
                );


            /* Validation */

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
                isNaN(quantity) ||
                isNaN(price) ||
                isNaN(threshold) ||
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                alert(
                    "Please enter valid product values."
                );

                return;

            }


            /* Duplicate SKU */

            const duplicate =
                products.some(function(product) {

                    return (
                        product.sku.toLowerCase() ===
                        sku.toLowerCase()
                    );

                });


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
                    "ADD PRODUCT",
                    currentUser.email,
                    "Added product: " + name
                );


                alert(
                    "Product added successfully!"
                );


                productForm.reset();


                /* Return threshold to 5 */

                const thresholdInput =
                    getElement("productThreshold");

                if (thresholdInput) {
                    thresholdInput.value = 5;
                }


                /* Go inventory */

                showPage(
                    "inventory",
                    document.querySelector(
                        '.nav-btn[data-page="inventory"]'
                    )
                );


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

window.editQuantity = async function(id) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    const product =
        products.find(function(item) {

            return item.id === id;

        });


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
            "UPDATE STOCK",
            currentUser.email,
            "Updated " +
            product.name +
            " stock to " +
            quantity
        );


        alert(
            "Stock updated successfully."
        );


    } catch (errorObject) {

        console.error(
            "Update error:",
            errorObject
        );

        alert(
            "Unable to update product: " +
            errorObject.message
        );

    }

};


/* =========================================================
   DELETE PRODUCT
========================================================= */

window.deleteProduct = async function(id) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    const product =
        products.find(function(item) {

            return item.id === id;

        });


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
            "DELETE PRODUCT",
            currentUser.email,
            "Deleted product: " +
            product.name
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
            "Unable to delete product: " +
            errorObject.message
        );

    }

};


/* =========================================================
   RENDER ACTIVITY LOGS
========================================================= */

function renderActivities() {

    const recentActivity =
        getElement("recentActivity");

    const activityTableBody =
        getElement("activityTableBody");


    /* Dashboard recent activity */

    if (recentActivity) {

        if (activities.length === 0) {

            recentActivity.innerHTML = `
                <p class="empty-message">
                    No recent activity.
                </p>
            `;

        } else {

            recentActivity.innerHTML =
                activities
                    .slice(0, 5)
                    .map(function(activity) {

                        return `

                            <div class="activity-item">

                                📝

                                <strong>
                                    ${escapeHTML(
                                        activity.action
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        activity.details
                                    )}
                                </span>

                                <small>
                                    ${escapeHTML(
                                        activity.time
                                    )}
                                </small>

                            </div>

                        `;

                    })
                    .join("");

        }

    }


    /* Activity table */

    if (activityTableBody) {

        if (activities.length === 0) {

            activityTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table">
                        No activity logs.
                    </td>
                </tr>
            `;

            return;

        }


        activityTableBody.innerHTML =
            activities
                .map(function(activity) {

                    return `

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
                                ${escapeHTML(
                                    activity.time
                                )}
                            </td>

                        </tr>

                    `;

                })
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
   FIREBASE ERROR MESSAGES
========================================================= */

function getFirebaseErrorMessage(errorObject) {

    const code =
        errorObject.code || "";


    switch (code) {

        case "auth/invalid-api-key":

            return "Firebase API key is invalid. Check your Firebase Web App configuration.";

        case "auth/api-key-not-valid":

            return "Firebase API key is not valid. Copy the API key from Firebase Project Settings.";

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

        case "permission-denied":

            return "Firebase permission denied. Check your Realtime Database Rules.";

        default:

            return (
                errorObject.message ||
                "Something went wrong."
            );

    }

}


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderInventory();
        renderActivities();
        updateDashboard();

    }
);
