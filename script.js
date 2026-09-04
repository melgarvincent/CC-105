// ============================================================
// ARBEES BAKERY SHOP
// FIREBASE REALTIME DATABASE ONLY
// NO FIREBASE AUTHENTICATION
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

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


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// ============================================================
// DATABASE REFERENCES
// ============================================================

const usersRef = ref(db, "users");
const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");


// ============================================================
// VARIABLES
// ============================================================

let users = [];
let products = [];
let activities = [];

let currentUser = null;


// ============================================================
// PAGE ELEMENTS
// ============================================================

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const systemPage = document.getElementById("systemPage");


// ============================================================
// SHOW REGISTER
// ============================================================

window.showRegister = function () {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.remove("hidden");
    }

    const error = document.getElementById("registerError");

    if (error) {
        error.textContent = "";
    }
};


// ============================================================
// SHOW LOGIN
// ============================================================

window.showLogin = function () {

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    const error = document.getElementById("loginError");

    if (error) {
        error.textContent = "";
    }
};


// ============================================================
// REGISTER
// ============================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document
            .getElementById("registerName")
            .value
            .trim();

        const email = document
            .getElementById("registerEmail")
            .value
            .trim()
            .toLowerCase();

        const password = document
            .getElementById("registerPassword")
            .value;

        const confirmPassword = document
            .getElementById("confirmPassword")
            .value;

        const error = document.getElementById("registerError");

        error.textContent = "";


        // ------------------------------
        // VALIDATION
        // ------------------------------

        if (!name) {

            error.textContent =
                "Please enter your full name.";

            return;
        }


        if (!email) {

            error.textContent =
                "Please enter your email.";

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

            // ------------------------------
            // CHECK IF EMAIL ALREADY EXISTS
            // ------------------------------

            const snapshot = await get(usersRef);

            let emailExists = false;

            if (snapshot.exists()) {

                const data = snapshot.val();

                Object.values(data).forEach(function (user) {

                    if (
                        user.email &&
                        user.email.toLowerCase() === email
                    ) {
                        emailExists = true;
                    }

                });
            }


            if (emailExists) {

                error.textContent =
                    "This email is already registered.";

                return;
            }


            // ------------------------------
            // CREATE USER ID
            // ------------------------------

            const newUserRef = push(usersRef);

            const userData = {

                name: name,

                email: email,

                password: password,

                role: "STAFF",

                createdAt: new Date().toLocaleString()

            };


            // ------------------------------
            // SAVE TO REALTIME DATABASE
            // ------------------------------

            await set(
                newUserRef,
                userData
            );


            // ------------------------------
            // ACTIVITY LOG
            // ------------------------------

            await addActivity(
                "New user registered: " + email
            );


            alert(
                "Registration successful!"
            );


            registerForm.reset();


            // Go to login

            showLogin();


        } catch (errorObject) {

            console.error(
                "Registration error:",
                errorObject
            );

            error.textContent =
                "Unable to register: " +
                errorObject.message;

        }

    });

}


// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const email = document
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();


        const password = document
            .getElementById("loginPassword")
            .value;


        const error = document.getElementById("loginError");

        error.textContent = "";


        if (!email || !password) {

            error.textContent =
                "Please enter your email and password.";

            return;
        }


        try {

            // ------------------------------
            // GET USERS
            // ------------------------------

            const snapshot = await get(usersRef);


            if (!snapshot.exists()) {

                error.textContent =
                    "No registered users found.";

                return;
            }


            const data = snapshot.val();

            let foundUser = null;
            let foundUserId = null;


            // ------------------------------
            // CHECK EMAIL + PASSWORD
            // ------------------------------

            Object.keys(data).forEach(function (userId) {

                const user = data[userId];


                const savedEmail =
                    String(user.email || "")
                        .trim()
                        .toLowerCase();


                const savedPassword =
                    String(user.password || "");


                if (
                    savedEmail === email &&
                    savedPassword === password
                ) {

                    foundUser = user;

                    foundUserId = userId;

                }

            });


            // ------------------------------
            // WRONG LOGIN
            // ------------------------------

            if (!foundUser) {

                error.textContent =
                    "Incorrect email or password.";

                return;
            }


            // ------------------------------
            // LOGIN SUCCESS
            // ------------------------------

            currentUser = {

                id: foundUserId,

                name: foundUser.name || "User",

                email: foundUser.email,

                password: foundUser.password,

                role: foundUser.role || "STAFF"

            };


            // Save login locally

            localStorage.setItem(
                "arbeesCurrentUser",
                JSON.stringify(currentUser)
            );


            // Activity

            await addActivity(
                "User logged in: " +
                currentUser.email
            );


            // Show system

            showSystem();


        } catch (errorObject) {

            console.error(
                "Login error:",
                errorObject
            );

            error.textContent =
                "Unable to login. Please try again.";

        }

    });

}


// ============================================================
// SHOW SYSTEM
// ============================================================

function showSystem() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (registerPage) {
        registerPage.classList.add("hidden");
    }

    if (systemPage) {
        systemPage.classList.remove("hidden");
    }


    updateUserInformation();

    updateDashboard();

    renderInventory();

    renderActivities();

}


// ============================================================
// LOGOUT
// ============================================================

window.logout = async function () {

    try {

        if (currentUser) {

            await addActivity(
                "User logged out: " +
                currentUser.email
            );

        }


        currentUser = null;

        localStorage.removeItem(
            "arbeesCurrentUser"
        );


        if (systemPage) {
            systemPage.classList.add("hidden");
        }

        if (registerPage) {
            registerPage.classList.add("hidden");
        }

        if (loginPage) {
            loginPage.classList.remove("hidden");
        }


        const loginFormElement =
            document.getElementById("loginForm");

        if (loginFormElement) {
            loginFormElement.reset();
        }


    } catch (errorObject) {

        console.error(
            "Logout error:",
            errorObject
        );

    }

};


// ============================================================
// CHECK EXISTING LOGIN
// ============================================================

const savedUser =
    localStorage.getItem("arbeesCurrentUser");


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);

        showSystem();

    } catch (error) {

        localStorage.removeItem(
            "arbeesCurrentUser"
        );

    }

}


// ============================================================
// USER INFORMATION
// ============================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUser.name || "User";

    const email =
        currentUser.email || "-";

    const role =
        currentUser.role || "STAFF";


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
        currentUserName.textContent = name;
    }

    if (currentUserEmail) {
        currentUserEmail.textContent = email;
    }

    if (userRole) {
        userRole.textContent = role;
    }

    if (profileName) {
        profileName.textContent = name;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }

    if (profileRole) {
        profileRole.textContent = role;
    }

}


// ============================================================
// NAVIGATION
// ============================================================

document
    .querySelectorAll(".nav-btn")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const page =
                    button.dataset.page;

                showPage(page, button);

            }
        );

    });


window.showPage = function (page, button) {

    document
        .querySelectorAll(".content-page")
        .forEach(function (section) {

            section.classList.add("hidden");

        });


    const selected =
        document.getElementById(
            page + "Page"
        );


    if (selected) {

        selected.classList.remove("hidden");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(function (btn) {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }


    if (page === "dashboard") {

        updateDashboard();

    }

    if (page === "inventory") {

        renderInventory();

    }

    if (page === "addProduct") {

        // nothing

    }

    if (page === "activity") {

        renderActivities();

    }

    if (page === "users") {

        updateUserInformation();

    }

};


// ============================================================
// LOAD PRODUCTS
// ============================================================

onValue(
    productsRef,
    function (snapshot) {

        products = [];

        if (snapshot.exists()) {

            const data = snapshot.val();

            Object.keys(data).forEach(function (id) {

                const product = data[id];

                products.push({

                    id: id,

                    name:
                        product.name || "",

                    sku:
                        product.sku || "",

                    category:
                        product.category || "",

                    quantity:
                        Number(product.quantity || 0),

                    price:
                        Number(product.price || 0),

                    threshold:
                        Number(
                            product.threshold ??
                            product.lowStockThreshold ??
                            5
                        )

                });

            });

        }


        updateDashboard();

        renderInventory();

    }
);


// ============================================================
// ADD PRODUCT
// ============================================================

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


            const thresholdElement =
                document.getElementById(
                    "lowStockThreshold"
                );


            const threshold =
                thresholdElement
                    ? Number(thresholdElement.value)
                    : 5;


            if (!name || !sku || !category) {

                alert(
                    "Please complete all required fields."
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
                products.some(function (product) {

                    return product.sku
                        .toLowerCase() ===
                        sku.toLowerCase();

                });


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


                if (thresholdElement) {
                    thresholdElement.value = 5;
                }


                showPage(
                    "inventory",
                    document.querySelector(
                        '[data-page="inventory"]'
                    )
                );


            } catch (errorObject) {

                console.error(
                    errorObject
                );

                alert(
                    "Unable to save product."
                );

            }

        }
    );

}


// ============================================================
// INVENTORY
// ============================================================

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


    const filtered =
        products.filter(function (product) {

            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(search) ||

                product.sku
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                !category ||
                product.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    table.innerHTML = "";


    if (filtered.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(function (product) {

        const low =
            product.quantity <=
            product.threshold;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.name)}
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
                <span class="${
                    low
                    ? "status status-low"
                    : "status status-ok"
                }">
                    ${
                        low
                        ? "LOW STOCK"
                        : "IN STOCK"
                    }
                </span>
            </td>

            <td>

                <button
                    class="action"
                    onclick="editQuantity('${product.id}')">
                    ✏️
                </button>

                <button
                    class="action delete"
                    onclick="deleteProduct('${product.id}')">
                    🗑️
                </button>

            </td>

        `;


        table.appendChild(row);

    });

}


// ============================================================
// SEARCH
// ============================================================

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


// ============================================================
// EDIT QUANTITY
// ============================================================

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


    const value =
        prompt(
            "Enter new quantity:",
            product.quantity
        );


    if (value === null) {
        return;
    }


    const quantity =
        Number(value);


    if (
        isNaN(quantity) ||
        quantity < 0
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

                quantity: quantity,

                updatedBy:
                    currentUser.email,

                updatedAt:
                    new Date().toLocaleString()

            }
        );


        await addActivity(
            "Updated stock: " +
            product.name +
            " → " +
            quantity
        );


    } catch (errorObject) {

        console.error(
            errorObject
        );

        alert(
            "Unable to update stock."
        );

    }

};


// ============================================================
// DELETE PRODUCT
// ============================================================

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
        return;
    }


    if (
        !confirm(
            "Delete " +
            product.name +
            "?"
        )
    ) {
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
            product.name
        );


    } catch (errorObject) {

        console.error(
            errorObject
        );

        alert(
            "Unable to delete product."
        );

    }

};


// ============================================================
// ACTIVITY LOG
// ============================================================

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


    } catch (errorObject) {

        console.error(
            "Activity error:",
            errorObject
        );

    }

}


// ============================================================
// LOAD ACTIVITIES
// ============================================================

onValue(
    activityRef,
    function (snapshot) {

        activities = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            Object.keys(data).forEach(
                function (id) {

                    activities.push({

                        id: id,

                        message:
                            data[id].message || "",

                        time:
                            data[id].time || ""

                    });

                }
            );

        }


        activities.reverse();

        renderActivities();

    }
);


// ============================================================
// RENDER ACTIVITIES
// ============================================================

function renderActivities() {

    const table =
        document.getElementById(
            "activityTableBody"
        );


    const recent =
        document.getElementById(
            "recentActivity"
        );


    if (table) {

        table.innerHTML = "";


        if (activities.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table">
                        No activity logs.
                    </td>
                </tr>
            `;

        } else {

            activities
                .slice(0, 50)
                .forEach(function (activity) {

                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>Activity</td>

                        <td>
                            ${currentUser
                                ? escapeHTML(
                                    currentUser.email
                                )
                                : "-"
                            }
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

                    `;


                    table.appendChild(row);

                });

        }

    }


    if (recent) {

        if (activities.length === 0) {

            recent.innerHTML =
                `<p class="empty-message">
                    No recent activity.
                </p>`;

        } else {

            recent.innerHTML =
                activities
                    .slice(0, 5)
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

        }

    }

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    let totalStock = 0;
    let lowStock = 0;
    let totalValue = 0;


    products.forEach(function (product) {

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


// ============================================================
// LOW STOCK
// ============================================================

function renderLowStock() {

    const container =
        document.getElementById(
            "lowStockList"
        );


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
            `<p class="empty-message">
                No low stock products.
            </p>`;

        return;
    }


    container.innerHTML =
        lowProducts
            .map(function (product) {

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
                        </small>

                        <span class="low-label">
                            ${product.quantity}
                            pcs remaining
                        </span>

                    </div>

                `;

            })
            .join("");

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ============================================================
// INVENTORY ADD BUTTON
// ============================================================

const inventoryAddBtn =
    document.getElementById(
        "inventoryAddBtn"
    );


if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function () {

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


// ============================================================
// LOGOUT BUTTONS
// ============================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        window.logout
    );

}


const mobileLogout =
    document.getElementById(
        "mobileLogout"
    );


if (mobileLogout) {

    mobileLogout.addEventListener(
        "click",
        window.logout
    );

}
