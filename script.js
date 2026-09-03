/* =========================================================
   ARBEES BAKERY SHOP
   WEB-BASED INVENTORY SYSTEM
   Firebase Authentication + Realtime Database
========================================================= */

// ================= FIREBASE IMPORTS =================

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

let products = [];
let activities = [];
let currentUser = null;


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
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        const error = document.getElementById("loginError");

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

            console.log("Login successful.");

        } catch (errorObject) {

            console.error("Login error:", errorObject);

            if (error) {
                error.textContent =
                    getFirebaseErrorMessage(errorObject);
            }
        }

    });

}


// ======================================================
// REGISTER
// ======================================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const error =
            document.getElementById("registerError");

        if (error) {
            error.textContent = "";
        }


        // Validate name

        if (!name) {

            error.textContent =
                "Please enter your full name.";

            return;
        }


        // Validate email

        if (!email) {

            error.textContent =
                "Please enter your email.";

            return;
        }


        // Validate password

        if (password.length < 6) {

            error.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        // Confirm password

        if (password !== confirmPassword) {

            error.textContent =
                "Passwords do not match.";

            return;
        }


        try {

            // Create Firebase Authentication account

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // Save user information in Realtime Database

            await set(
                ref(db, "users/" + user.uid),
                {
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: new Date().toISOString()
                }
            );


            // Save activity

            await addActivity(
                "New user registered: " + email
            );


            alert("Registration successful!");


            registerForm.reset();


            // Go back to login

            showLogin();

        } catch (errorObject) {

            console.error(
                "Registration error:",
                errorObject
            );

            if (error) {
                error.textContent =
                    getFirebaseErrorMessage(errorObject);
            }
        }

    });

}


// ======================================================
// SHOW LOGIN
// ======================================================

window.showLogin = function () {

    const registerPage =
        document.getElementById("registerPage");

    const loginPage =
        document.getElementById("loginPage");

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    const error =
        document.getElementById("loginError");

    if (error) {
        error.textContent = "";
    }
};


// ======================================================
// SHOW REGISTER
// ======================================================

window.showRegister = function () {

    const loginPage =
        document.getElementById("loginPage");

    const registerPage =
        document.getElementById("registerPage");

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    const error =
        document.getElementById("registerError");

    if (error) {
        error.textContent = "";
    }
};


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async function (user) {

    currentUser = user;

    const loginPage =
        document.getElementById("loginPage");

    const registerPage =
        document.getElementById("registerPage");

    const system =
        document.getElementById("system");

    if (user) {

        console.log("Logged in:", user.email);


        // Hide login

        if (loginPage) {
            loginPage.classList.add("hidden");
        }


        // Hide register

        if (registerPage) {
            registerPage.classList.add("hidden");
        }


        // Show system

        if (system) {
            system.classList.remove("hidden");
        }


        // Display current user

        const currentUserElement =
            document.getElementById("currentUser");

        if (currentUserElement) {

            currentUserElement.textContent =
                user.email;
        }


        updateDashboard();

    } else {

        // User logged out

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

});


// ======================================================
// LOGOUT
// ======================================================

window.logout = async function () {

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

        alert("Unable to logout.");
    }
};


// ======================================================
// PAGE NAVIGATION
// ======================================================

window.showPage = function (page, button) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "activityPage"
    ];

    pages.forEach(function (pageID) {

        const element =
            document.getElementById(pageID);

        if (element) {
            element.classList.add("hidden");
        }

    });


    const selectedPage =
        document.getElementById(page + "Page");

    if (selectedPage) {

        selectedPage.classList.remove("hidden");
    }


    // Navigation active state

    document
        .querySelectorAll(".nav-btn")
        .forEach(function (btn) {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");
    }


    // Page title

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {

        if (page === "dashboard") {

            pageTitle.textContent = "Dashboard";

            updateDashboard();
        }

        else if (page === "inventory") {

            pageTitle.textContent = "Inventory";

            renderInventory();
        }

        else if (page === "activity") {

            pageTitle.textContent = "Activity Logs";

            renderActivities();
        }
    }

};


// ======================================================
// LOAD PRODUCTS
// ======================================================

onValue(
    productsRef,
    function (snapshot) {

        const data = snapshot.val();

        products = [];

        if (data) {

            Object.keys(data).forEach(function (key) {

                products.push({

                    id: key,

                    sku: data[key].sku || "",

                    name: data[key].name || "",

                    category:
                        data[key].category || "",

                    quantity:
                        Number(data[key].quantity || 0),

                    price:
                        Number(data[key].price || 0),

                    threshold:
                        Number(data[key].threshold || 0)

                });

            });

        }

        updateDashboard();

        renderInventory();

    },

    function (errorObject) {

        console.error(
            "Products Firebase error:",
            errorObject
        );

    }
);


// ======================================================
// LOAD ACTIVITY LOGS
// ======================================================

onValue(
    activityRef,
    function (snapshot) {

        const data = snapshot.val();

        activities = [];

        if (data) {

            Object.keys(data).forEach(function (key) {

                activities.push({

                    id: key,

                    message:
                        data[key].message || "",

                    time:
                        data[key].time || ""

                });

            });

        }

        activities.reverse();

        renderActivities();

    },

    function (errorObject) {

        console.error(
            "Activity Firebase error:",
            errorObject
        );

    }
);


// ======================================================
// ADD ACTIVITY
// ======================================================

async function addActivity(message) {

    try {

        const newActivity =
            push(activityRef);

        await set(
            newActivity,
            {
                message: message,
                time: new Date().toLocaleString()
            }
        );

    } catch (errorObject) {

        console.error(
            "Activity log error:",
            errorObject
        );
    }
}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    let totalStock = 0;
    let lowStock = 0;
    let totalValue = 0;

    products.forEach(function (product) {

        totalStock += product.quantity;

        totalValue +=
            product.quantity * product.price;

        if (
            product.quantity <=
            product.threshold
        ) {

            lowStock++;
        }

    });


    const totalProducts =
        document.getElementById("totalProducts");

    const totalStockElement =
        document.getElementById("totalStock");

    const lowStockElement =
        document.getElementById("lowStock");

    const inventoryValue =
        document.getElementById("inventoryValue");


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

    if (inventoryValue) {

        inventoryValue.textContent =
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


// ======================================================
// LOW STOCK
// ======================================================

function renderLowStock() {

    const container =
        document.getElementById("lowStockList");

    if (!container) {
        return;
    }


    const lowProducts =
        products.filter(function (product) {

            return (
                product.quantity <=
                product.threshold
            );

        });


    if (lowProducts.length === 0) {

        container.innerHTML =
            "<p>No low-stock products.</p>";

        return;
    }


    container.innerHTML =
        lowProducts.map(function (product) {

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


// ======================================================
// INVENTORY TABLE
// ======================================================

window.renderInventory = function () {

    const table =
        document.getElementById("inventoryTable");

    if (!table) {
        return;
    }


    const searchBox =
        document.getElementById("searchBox");

    const categoryFilter =
        document.getElementById("categoryFilter");


    const search =
        searchBox
            ? searchBox.value.toLowerCase().trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const filteredProducts =
        products.filter(function (product) {

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


            return searchMatch && categoryMatch;

        });


    table.innerHTML = "";


    if (filteredProducts.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    filteredProducts.forEach(function (product) {

        const isLow =
            product.quantity <=
            product.threshold;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.sku)}
            </td>

            <td>
                <strong>
                    ${escapeHTML(product.name)}
                </strong>
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
                    class="action"
                    onclick="editQuantity('${product.id}')"
                    title="Edit Stock"
                >
                    ✏️
                </button>

                <button
                    class="action delete"
                    onclick="deleteProduct('${product.id}')"
                    title="Delete Product"
                >
                    🗑️
                </button>

            </td>
        `;


        table.appendChild(row);

    });

};


// ======================================================
// PRODUCT MODAL
// ======================================================

window.openProductModal = function () {

    const modal =
        document.getElementById("productModal");

    if (modal) {

        modal.classList.remove("hidden");
    }
};


window.closeProductModal = function () {

    const modal =
        document.getElementById("productModal");

    if (modal) {

        modal.classList.add("hidden");
    }
};


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


            if (!currentUser) {

                alert("Please login first.");

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

                alert("Product name is required.");

                return;
            }


            if (!sku) {

                alert("SKU is required.");

                return;
            }


            if (!category) {

                alert("Please select a category.");

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


            // Check duplicate SKU

            const duplicate =
                products.some(function (product) {

                    return (
                        product.sku.toLowerCase() ===
                        sku.toLowerCase()
                    );

                });


            if (duplicate) {

                alert("SKU already exists.");

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


                const thresholdInput =
                    document.getElementById(
                        "productThreshold"
                    );

                if (thresholdInput) {

                    thresholdInput.value = 10;
                }


                closeProductModal();


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


// ======================================================
// EDIT QUANTITY
// ======================================================

window.editQuantity = async function (id) {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const product =
        products.find(function (item) {

            return item.id === id;

        });


    if (!product) {

        alert("Product not found.");

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

        alert("Please enter a valid quantity.");

        return;
    }


    try {

        await update(
            ref(db, "bakeryProducts/" + id),
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

};


// ======================================================
// DELETE PRODUCT
// ======================================================

window.deleteProduct = async function (id) {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const product =
        products.find(function (item) {

            return item.id === id;

        });


    if (!product) {

        alert("Product not found.");

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
            ref(db, "bakeryProducts/" + id)
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

};


// ======================================================
// ACTIVITY LOGS
// ======================================================

function renderActivities() {

    const recentActivity =
        document.getElementById("recentActivity");

    const activityList =
        document.getElementById("activityList");


    if (
        !recentActivity &&
        !activityList
    ) {

        return;
    }


    if (activities.length === 0) {

        const emptyHTML =
            "<p>No activity logs.</p>";


        if (recentActivity) {

            recentActivity.innerHTML =
                emptyHTML;
        }


        if (activityList) {

            activityList.innerHTML =
                emptyHTML;
        }


        return;
    }


    const html =
        activities
            .slice(0, 20)
            .map(function (activity) {

                return `

                    <div class="activity-item">

                        📝
                        ${escapeHTML(
                            activity.message
                        )}

                        <small>
                            ${escapeHTML(
                                activity.time
                            )}
                        </small>

                    </div>

                `;

            })
            .join("");


    if (recentActivity) {

        recentActivity.innerHTML = html;
    }


    if (activityList) {

        activityList.innerHTML = html;
    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


// ======================================================
// FIREBASE ERROR MESSAGES
// ======================================================

function getFirebaseErrorMessage(errorObject) {

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

        case "auth/api-key-not-valid":
            return "Firebase API key is invalid.";

        case "PERMISSION_DENIED":
            return "Firebase Database permission denied.";

        default:
            return (
                errorObject.message ||
                "Something went wrong."
            );
    }
}
