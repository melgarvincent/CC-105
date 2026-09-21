// ======================================================
// ARBEE'S BAKERY SHOP
// FIREBASE REALTIME DATABASE
// LOGIN + REGISTER + SECURITY PIN
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


// ======================================================
// DATABASE REFERENCES
// ======================================================

const usersRef = ref(db, "users");
const productsRef = ref(db, "bakeryProducts");
const activityRef = ref(db, "activityLogs");


// ======================================================
// SECURITY PIN
// ======================================================

// CHANGE YOUR PIN HERE
const SECURITY_PIN = "123456";


// ======================================================
// CURRENT USER
// ======================================================

let currentUser = null;

let products = [];


// ======================================================
// PAGE ELEMENTS
// ======================================================

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const securityPage =
    document.getElementById("securityPage");

const systemPage =
    document.getElementById("systemPage");


// ======================================================
// HIDE ALL PAGES
// ======================================================

function hideAllPages() {

    if (loginPage)
        loginPage.classList.add("hidden");

    if (registerPage)
        registerPage.classList.add("hidden");

    if (securityPage)
        securityPage.classList.add("hidden");

    if (systemPage)
        systemPage.classList.add("hidden");
}


// ======================================================
// SHOW LOGIN
// ======================================================

window.showLogin = function () {

    hideAllPages();

    loginPage.classList.remove("hidden");

    const loginError =
        document.getElementById("loginError");

    if (loginError) {
        loginError.textContent = "";
    }

};


// ======================================================
// SHOW REGISTER
// ======================================================

window.showRegister = function () {

    hideAllPages();

    registerPage.classList.remove("hidden");

    const registerError =
        document.getElementById("registerError");

    if (registerError) {
        registerError.textContent = "";
    }

};


// ======================================================
// SHOW SECURITY PAGE
// ======================================================

window.showSecurityPage = function () {

    hideAllPages();

    securityPage.classList.remove("hidden");

    const securityPin =
        document.getElementById("securityPin");

    const securityError =
        document.getElementById("securityError");


    if (securityPin) {

        securityPin.value = "";

        setTimeout(function () {

            securityPin.focus();

        }, 100);

    }


    if (securityError) {

        securityError.textContent = "";

    }

};


// ======================================================
// REGISTER
// ======================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
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
                document.getElementById(
                    "registerError"
                );


            error.textContent = "";


            // CHECK EMPTY
            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                error.textContent =
                    "Please complete all fields.";

                return;
            }


            // PASSWORD LENGTH
            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            // PASSWORD MATCH
            if (password !== confirmPassword) {

                error.textContent =
                    "Passwords do not match.";

                return;
            }


            try {

                const userKey =
                    email.replace(/\./g, "_");


                const userRef =
                    ref(
                        db,
                        "users/" + userKey
                    );


                // CHECK EXISTING ACCOUNT

                const snapshot =
                    await get(userRef);


                if (snapshot.exists()) {

                    error.textContent =
                        "This email is already registered.";

                    return;
                }


                // SAVE USER

                await set(
                    userRef,
                    {
                        name: name,
                        email: email,
                        password: password,
                        role: "staff",
                        createdAt:
                            new Date().toISOString()
                    }
                );


                alert(
                    "Registration successful!"
                );


                registerForm.reset();

                window.showLogin();


            } catch (errorObject) {

                console.error(
                    "Registration Error:",
                    errorObject
                );


                error.textContent =
                    "Registration failed. Check your Firebase connection.";

            }

        }
    );

}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
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
                document.getElementById(
                    "loginError"
                );


            error.textContent = "";


            if (!email || !password) {

                error.textContent =
                    "Please enter your email and password.";

                return;
            }


            try {

                const userKey =
                    email.replace(/\./g, "_");


                const userRef =
                    ref(
                        db,
                        "users/" + userKey
                    );


                const snapshot =
                    await get(userRef);


                // ACCOUNT NOT FOUND

                if (!snapshot.exists()) {

                    error.textContent =
                        "Account not found.";

                    return;
                }


                const userData =
                    snapshot.val();


                // WRONG PASSWORD

                if (
                    userData.password !== password
                ) {

                    error.textContent =
                        "Incorrect email or password.";

                    return;
                }


                // ======================================
                // ACCOUNT VERIFIED
                // ======================================

                currentUser = {

                    key: userKey,

                    name:
                        userData.name,

                    email:
                        userData.email,

                    role:
                        userData.role || "staff"

                };


                // SAVE SESSION

                sessionStorage.setItem(
                    "arbeesCurrentUser",
                    JSON.stringify(currentUser)
                );


                // ======================================
                // IMPORTANT
                // LOGIN SUCCESS DOES NOT OPEN SYSTEM
                // SECURITY PIN FIRST
                // ======================================

                await addActivity(
                    "Login",
                    currentUser.name +
                    " logged in."
                );


                window.showSecurityPage();

            } catch (errorObject) {

                console.error(
                    "Login Error:",
                    errorObject
                );


                error.textContent =
                    "Login failed. Check your Firebase connection.";

            }

        }
    );

}


// ======================================================
// SECURITY FORM
// ======================================================

const securityForm =
    document.getElementById(
        "securityForm"
    );


if (securityForm) {

    securityForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const pin =
                document
                    .getElementById("securityPin")
                    .value
                    .trim();


            const error =
                document.getElementById(
                    "securityError"
                );


            error.textContent = "";


            // EMPTY PIN

            if (!pin) {

                error.textContent =
                    "Please enter your security PIN.";

                return;
            }


            // WRONG PIN

            if (pin !== SECURITY_PIN) {

                error.textContent =
                    "Incorrect security PIN. Please try again.";

                document.getElementById(
                    "securityPin"
                ).value = "";


                document.getElementById(
                    "securityPin"
                ).focus();


                return;
            }


            // ======================================
            // CORRECT PIN
            // ======================================

            await addActivity(
                "Security Verification",
                "Security PIN verified."
            );


            document.getElementById(
                "securityPin"
            ).value = "";


            // OPEN SYSTEM

            showSystem();

        }
    );

}


// ======================================================
// SECURITY BACK BUTTON
// ======================================================

const securityBackBtn =
    document.getElementById(
        "securityBackBtn"
    );


if (securityBackBtn) {

    securityBackBtn.addEventListener(
        "click",
        function () {

            currentUser = null;

            sessionStorage.removeItem(
                "arbeesCurrentUser"
            );

            window.showLogin();

        }
    );

}


// ======================================================
// SHOW SYSTEM
// ======================================================

function showSystem() {

    hideAllPages();

    systemPage.classList.remove("hidden");


    updateUserInformation();

    loadProducts();

    loadActivityLogs();

    showPage("dashboard");

}


// ======================================================
// NAVIGATION
// ======================================================

const navButtons =
    document.querySelectorAll(
        ".nav-btn[data-page]"
    );


navButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const page =
                this.getAttribute("data-page");

            showPage(page);

        }
    );

});


// ======================================================
// SHOW PAGE
// ======================================================

function showPage(pageName) {

    const pages =
        document.querySelectorAll(
            ".main-content .page"
        );


    pages.forEach(function (page) {

        page.classList.add("hidden");

    });


    const selectedPage =
        document.getElementById(
            pageName + "Page"
        );


    if (selectedPage) {

        selectedPage.classList.remove(
            "hidden"
        );

    }


    // NAV ACTIVE

    navButtons.forEach(function (button) {

        button.classList.remove("active");


        if (
            button.getAttribute("data-page")
            === pageName
        ) {

            button.classList.add("active");

        }

    });


    // PAGE TITLE

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (pageTitle) {

        const titles = {

            dashboard:
                "Dashboard",

            inventory:
                "Inventory",

            addProduct:
                "Add Product",

            activity:
                "Activity Logs",

            users:
                "My Account"

        };


        pageTitle.textContent =
            titles[pageName] || "Dashboard";

    }


    // REFRESH

    if (pageName === "dashboard") {

        updateDashboard();

    }


    if (pageName === "inventory") {

        renderInventory();

    }


    if (pageName === "activity") {

        loadActivityLogs();

    }


    if (pageName === "users") {

        updateUserInformation();

    }

}


// ======================================================
// USER INFORMATION
// ======================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    const currentUserName =
        document.getElementById(
            "currentUserName"
        );


    const userRole =
        document.getElementById(
            "userRole"
        );


    const headerUserName =
        document.getElementById(
            "headerUserName"
        );


    const headerUserEmail =
        document.getElementById(
            "headerUserEmail"
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
            currentUser.name;

    }


    if (userRole) {

        userRole.textContent =
            currentUser.role.toUpperCase();

    }


    if (headerUserName) {

        headerUserName.textContent =
            currentUser.name;

    }


    if (headerUserEmail) {

        headerUserEmail.textContent =
            currentUser.email;

    }


    if (profileName) {

        profileName.textContent =
            currentUser.name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            currentUser.email;

    }


    if (profileRole) {

        profileRole.textContent =
            currentUser.role.toUpperCase();

    }

}


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const snapshot =
            await get(productsRef);


        products = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            Object.keys(data).forEach(
                function (key) {

                    products.push({

                        id: key,

                        ...data[key]

                    });

                }
            );

        }


        renderInventory();

        updateDashboard();


    } catch (errorObject) {

        console.error(
            "Load Products Error:",
            errorObject
        );

    }

}


// ======================================================
// ADD PRODUCT
// ======================================================

const productForm =
    document.getElementById(
        "productForm"
    );


if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


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
                document.getElementById(
                    "productCategory"
                ).value;


            const quantity =
                Number(
                    document.getElementById(
                        "productQuantity"
                    ).value
                );


            const price =
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                );


            const threshold =
                Number(
                    document.getElementById(
                        "lowStockThreshold"
                    ).value
                );


            const message =
                document.getElementById(
                    "productMessage"
                );


            message.textContent = "";


            if (
                !name ||
                !sku ||
                !category ||
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                message.textContent =
                    "Please complete all fields correctly.";

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

                        createdAt:
                            new Date().toISOString(),

                        createdBy:
                            currentUser
                                ? currentUser.email
                                : "Unknown"

                    }
                );


                await addActivity(
                    "Add Product",
                    name +
                    " was added to inventory."
                );


                message.textContent =
                    "Product added successfully!";


                productForm.reset();


                document.getElementById(
                    "productQuantity"
                ).value = 0;


                document.getElementById(
                    "lowStockThreshold"
                ).value = 5;


                await loadProducts();


            } catch (errorObject) {

                console.error(
                    "Add Product Error:",
                    errorObject
                );


                message.textContent =
                    "Failed to add product.";

            }

        }
    );

}


// ======================================================
// INVENTORY
// ======================================================

function renderInventory() {

    const tableBody =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    const search =
        document
            .getElementById(
                "searchProduct"
            )
            .value
            .toLowerCase()
            .trim();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )
            .value;


    const filteredProducts =
        products.filter(function (product) {

            const productName =
                String(
                    product.name || ""
                ).toLowerCase();


            const productSKU =
                String(
                    product.sku || ""
                ).toLowerCase();


            const searchMatch =
                productName.includes(search) ||
                productSKU.includes(search);


            const categoryMatch =
                category === "all" ||
                product.category === category;


            return (
                searchMatch &&
                categoryMatch
            );

        });


    if (filteredProducts.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >
                    No products found.
                </td>

            </tr>

        `;

        return;
    }


    filteredProducts.forEach(
        function (product) {

            const row =
                document.createElement("tr");


            const isLowStock =
                Number(product.quantity) <=
                Number(product.threshold);


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
                    ₱${Number(product.price).toFixed(2)}
                </td>

                <td>

                    <span class="status ${
                        isLowStock
                            ? "low-stock"
                            : "in-stock"
                    }">

                        ${
                            isLowStock
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }

                    </span>

                </td>

                <td>

                    <button
                        class="delete-btn"
                        data-id="${product.id}"
                        type="button"
                    >
                        Delete
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    // DELETE BUTTONS

    const deleteButtons =
        tableBody.querySelectorAll(
            ".delete-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        this.getAttribute(
                            "data-id"
                        );


                    deleteProduct(id);

                }
            );

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

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


// ======================================================
// CATEGORY FILTER
// ======================================================

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


// ======================================================
// INVENTORY ADD BUTTON
// ======================================================

const inventoryAddBtn =
    document.getElementById(
        "inventoryAddBtn"
    );


if (inventoryAddBtn) {

    inventoryAddBtn.addEventListener(
        "click",
        function () {

            showPage("addProduct");

        }
    );

}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(productId) {

    const product =
        products.find(
            function (item) {

                return item.id === productId;

            }
        );


    if (!product) {
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

        const productRef =
            ref(
                db,
                "bakeryProducts/" +
                productId
            );


        await remove(productRef);


        await addActivity(
            "Delete Product",
            product.name +
            " was deleted from inventory."
        );


        await loadProducts();


    } catch (errorObject) {

        console.error(
            "Delete Product Error:",
            errorObject
        );


        alert(
            "Failed to delete product."
        );

    }

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    const totalStock =
        document.getElementById(
            "totalStock"
        );


    const lowStock =
        document.getElementById(
            "lowStock"
        );


    const estimatedValue =
        document.getElementById(
            "estimatedValue"
        );


    // TOTAL PRODUCTS

    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    // TOTAL STOCK

    const stock =
        products.reduce(
            function (total, product) {

                return (
                    total +
                    Number(
                        product.quantity || 0
                    )
                );

            },
            0
        );


    if (totalStock) {

        totalStock.textContent =
            stock;

    }


    // LOW STOCK

    const lowStockProducts =
        products.filter(
            function (product) {

                return (
                    Number(product.quantity) <=
                    Number(product.threshold)
                );

            }
        );


    if (lowStock) {

        lowStock.textContent =
            lowStockProducts.length;

    }


    // ESTIMATED VALUE

    const value =
        products.reduce(
            function (total, product) {

                return (
                    total +
                    Number(product.quantity || 0) *
                    Number(product.price || 0)
                );

            },
            0
        );


    if (estimatedValue) {

        estimatedValue.textContent =
            "₱" +
            value.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    // LOW STOCK LIST

    const lowStockList =
        document.getElementById(
            "lowStockList"
        );


    if (lowStockList) {

        lowStockList.innerHTML = "";


        if (lowStockProducts.length === 0) {

            lowStockList.innerHTML = `

                <p class="empty-text">
                    No low stock products.
                </p>

            `;

        } else {

            lowStockProducts.forEach(
                function (product) {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.innerHTML = `

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <span>
                            ${product.quantity} left
                        </span>

                    `;


                    lowStockList.appendChild(
                        item
                    );

                }
            );

        }

    }

}


// ======================================================
// ACTIVITY LOG
// ======================================================

async function addActivity(
    action,
    details
) {

    try {

        const newActivity =
            push(activityRef);


        await set(
            newActivity,
            {

                action: action,

                details: details,

                user:
                    currentUser
                        ? currentUser.email
                        : "Unknown",

                timestamp:
                    new Date().toISOString()

            }
        );


    } catch (errorObject) {

        console.error(
            "Activity Error:",
            errorObject
        );

    }

}


// ======================================================
// LOAD ACTIVITY LOGS
// ======================================================

async function loadActivityLogs() {

    const tableBody =
        document.getElementById(
            "activityTableBody"
        );


    const recentActivity =
        document.getElementById(
            "recentActivity"
        );


    try {

        const snapshot =
            await get(activityRef);


        const activities = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            Object.keys(data).forEach(
                function (key) {

                    activities.push({

                        id: key,

                        ...data[key]

                    });

                }
            );

        }


        // NEWEST FIRST

        activities.sort(
            function (a, b) {

                return (
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
                );

            }
        );


        // ======================================
        // ACTIVITY TABLE
        // ======================================

        if (tableBody) {

            tableBody.innerHTML = "";


            if (activities.length === 0) {

                tableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="4"
                            style="text-align:center;"
                        >
                            No activity yet.
                        </td>

                    </tr>

                `;

            } else {

                activities.forEach(
                    function (activity) {

                        const row =
                            document.createElement(
                                "tr"
                            );


                        const date =
                            new Date(
                                activity.timestamp
                            );


                        row.innerHTML = `

                            <td>

                                ${date.toLocaleString()}

                            </td>

                            <td>

                                ${escapeHTML(
                                    activity.user || ""
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    activity.action || ""
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    activity.details || ""
                                )}

                            </td>

                        `;


                        tableBody.appendChild(
                            row
                        );

                    }
                );

            }

        }


        // ======================================
        // RECENT ACTIVITY
        // ======================================

        if (recentActivity) {

            recentActivity.innerHTML = "";


            const recent =
                activities.slice(0, 5);


            if (recent.length === 0) {

                recentActivity.innerHTML = `

                    <p class="empty-text">
                        No recent activity.
                    </p>

                `;

            } else {

                recent.forEach(
                    function (activity) {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.innerHTML = `

                            <strong>
                                ${escapeHTML(
                                    activity.action || ""
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    activity.details || ""
                                )}
                            </p>

                        `;


                        recentActivity.appendChild(
                            item
                        );

                    }
                );

            }

        }


    } catch (errorObject) {

        console.error(
            "Activity Loading Error:",
            errorObject
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            if (currentUser) {

                await addActivity(
                    "Logout",
                    currentUser.name +
                    " logged out."
                );

            }


            currentUser = null;

            products = [];


            sessionStorage.removeItem(
                "arbeesCurrentUser"
            );


            window.showLogin();

        }
    );

}


// ======================================================
// RESTORE SESSION
// ======================================================

function restoreSession() {

    const savedUser =
        sessionStorage.getItem(
            "arbeesCurrentUser"
        );


    if (!savedUser) {

        window.showLogin();

        return;

    }


    try {

        currentUser =
            JSON.parse(savedUser);


        // SECURITY PIN AGAIN

        window.showSecurityPage();


    } catch (errorObject) {

        console.error(
            "Session Error:",
            errorObject
        );


        sessionStorage.removeItem(
            "arbeesCurrentUser"
        );


        window.showLogin();

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// START
// ======================================================

restoreSession();
