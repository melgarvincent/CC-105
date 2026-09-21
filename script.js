import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";



/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"

};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);



/* =====================================================
   DATABASE REFERENCES
===================================================== */

const usersRef = ref(db, "users");

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");



/* =====================================================
   SECURITY PIN
===================================================== */

const SECURITY_PIN = "123456";



/* =====================================================
   CURRENT USER
===================================================== */

let currentUser = null;

let editingProductId = null;



/* =====================================================
   ELEMENT HELPER
===================================================== */

function $(id) {
    return document.getElementById(id);
}



/* =====================================================
   SAFE FIREBASE KEY
===================================================== */

function makeUserKey(email) {

    return email
        .trim()
        .toLowerCase()
        .replace(/[.#$[\]/]/g, "_");

}



/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date = new Date(timestamp);

    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short"
    });

}



/* =====================================================
   SHOW REGISTER
===================================================== */

window.showRegister = function () {

    $("loginPage").classList.add("hidden");

    $("securityPage").classList.add("hidden");

    $("systemPage").classList.add("hidden");

    $("registerPage").classList.remove("hidden");

    $("registerError").textContent = "";

};



/* =====================================================
   SHOW LOGIN
===================================================== */

window.showLogin = function () {

    $("registerPage").classList.add("hidden");

    $("securityPage").classList.add("hidden");

    $("systemPage").classList.add("hidden");

    $("loginPage").classList.remove("hidden");

    $("loginError").textContent = "";

};



/* =====================================================
   SHOW SECURITY PAGE
===================================================== */

window.showSecurityPage = function () {

    $("loginPage").classList.add("hidden");

    $("registerPage").classList.add("hidden");

    $("systemPage").classList.add("hidden");

    $("securityPage").classList.remove("hidden");

    $("securityPin").value = "";

    $("securityError").textContent = "";

    setTimeout(() => {
        $("securityPin").focus();
    }, 100);

};



/* =====================================================
   SHOW SYSTEM
===================================================== */

function showSystem() {

    $("loginPage").classList.add("hidden");

    $("registerPage").classList.add("hidden");

    $("securityPage").classList.add("hidden");

    $("systemPage").classList.remove("hidden");

    showPage("dashboard");

    updateUserInformation();

    loadDashboard();

}



/* =====================================================
   NAVIGATION
===================================================== */

function showPage(pageName) {

    const pages = document.querySelectorAll(".main-content .page");

    pages.forEach(page => {
        page.classList.add("hidden");
    });


    const targetPage = $(pageName + "Page");

    if (targetPage) {
        targetPage.classList.remove("hidden");
    }


    const navButtons = document.querySelectorAll(".nav-btn");

    navButtons.forEach(button => {

        button.classList.remove("active");

        if (button.dataset.page === pageName) {
            button.classList.add("active");
        }

    });


    const titles = {

        dashboard: "Dashboard",

        inventory: "Inventory",

        addProduct: "Add Product",

        activity: "Activity Logs",

        users: "My Account"

    };


    $("pageTitle").textContent =
        titles[pageName] || "Arbees Bakery Shop";


    if (pageName === "inventory") {
        loadProducts();
    }

    if (pageName === "activity") {
        loadActivityLogs();
    }

    if (pageName === "dashboard") {
        loadDashboard();
    }

}



/* =====================================================
   REGISTER
===================================================== */

$("registerForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            $("registerName").value.trim();

        const email =
            $("registerEmail").value.trim().toLowerCase();

        const password =
            $("registerPassword").value;

        const confirmPassword =
            $("confirmPassword").value;

        const error =
            $("registerError");


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

            const userKey =
                makeUserKey(email);

            const userRef =
                ref(db, "users/" + userKey);


            const existingUser =
                await get(userRef);


            if (existingUser.exists()) {

                error.textContent =
                    "An account with this email already exists.";

                return;

            }


            const userData = {

                name: name,

                email: email,

                password: password,

                role: "staff",

                createdAt: Date.now()

            };


            await set(userRef, userData);


            error.style.color = "#2e8b57";

            error.textContent =
                "Registration successful! You can now login.";


            $("registerForm").reset();


            setTimeout(() => {

                error.style.color = "";

                showLogin();

            }, 1500);


        } catch (err) {

            console.error(err);

            error.style.color = "#c94c4c";

            error.textContent =
                "Registration failed. Check your Firebase Database rules.";

        }

    }
);



/* =====================================================
   LOGIN
===================================================== */

$("loginForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            $("loginEmail").value.trim().toLowerCase();

        const password =
            $("loginPassword").value;


        const error =
            $("loginError");


        error.textContent = "";


        if (!email || !password) {

            error.textContent =
                "Please enter email and password.";

            return;

        }


        try {

            const userKey =
                makeUserKey(email);

            const userRef =
                ref(db, "users/" + userKey);


            const snapshot =
                await get(userRef);


            if (!snapshot.exists()) {

                error.textContent =
                    "Account not found.";

                return;

            }


            const user =
                snapshot.val();


            if (user.password !== password) {

                error.textContent =
                    "Incorrect password.";

                return;

            }


            currentUser = {

                key: userKey,

                name: user.name,

                email: user.email,

                role: user.role || "staff"

            };


            sessionStorage.setItem(
                "arbeesCurrentUser",
                JSON.stringify(currentUser)
            );


            await addActivity(
                "Login",
                "User logged in."
            );


            $("loginForm").reset();


            window.showSecurityPage();


        } catch (err) {

            console.error(err);

            error.textContent =
                "Login failed. Check your Firebase connection and database rules.";

        }

    }
);



/* =====================================================
   SECURITY PIN
===================================================== */

$("securityForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const pin =
            $("securityPin").value.trim();


        const error =
            $("securityError");


        if (pin === SECURITY_PIN) {

            error.textContent = "";


            await addActivity(
                "Security Verification",
                "Security PIN verified successfully."
            );


            $("securityPin").value = "";


            showSystem();


        } else {

            error.textContent =
                "Incorrect security PIN. Please try again.";

            $("securityPin").value = "";

            $("securityPin").focus();

        }

    }
);



/* =====================================================
   SECURITY BACK BUTTON
===================================================== */

$("securityBackBtn").addEventListener(
    "click",
    function () {

        currentUser = null;

        sessionStorage.removeItem(
            "arbeesCurrentUser"
        );


        $("securityPin").value = "";

        $("securityError").textContent = "";


        window.showLogin();

    }
);



/* =====================================================
   UPDATE USER INFORMATION
===================================================== */

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    $("currentUserName").textContent =
        currentUser.name;


    $("headerUserName").textContent =
        currentUser.name;


    $("headerUserEmail").textContent =
        currentUser.email;


    $("userRole").textContent =
        currentUser.role.toUpperCase();


    $("profileName").textContent =
        currentUser.name;


    $("profileEmail").textContent =
        currentUser.email;


    $("profileRole").textContent =
        currentUser.role.toUpperCase();

}



/* =====================================================
   ADD ACTIVITY LOG
===================================================== */

async function addActivity(action, details) {

    if (!currentUser) {
        return;
    }


    try {

        const newActivity =
            push(activityRef);


        await set(newActivity, {

            user:
                currentUser.name,

            email:
                currentUser.email,

            action:
                action,

            details:
                details,

            timestamp:
                Date.now()

        });

    } catch (err) {

        console.error(
            "Activity log error:",
            err
        );

    }

}



/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    try {

        const snapshot =
            await get(productsRef);


        const data =
            snapshot.exists()
                ? snapshot.val()
                : {};


        renderInventory(data);


    } catch (err) {

        console.error(err);

        $("inventoryTableBody").innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load inventory.
                </td>
            </tr>
        `;

    }

}



/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory(data) {

    const tbody =
        $("inventoryTableBody");


    tbody.innerHTML = "";


    const search =
        $("searchProduct").value
            .trim()
            .toLowerCase();


    const category =
        $("categoryFilter").value;


    let products =
        Object.entries(data);


    products =
        products.filter(
            ([id, product]) => {

                const matchesSearch =

                    product.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    product.sku
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =

                    category === "all"

                    ||

                    product.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (products.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    products.forEach(
        ([id, product]) => {

            const quantity =
                Number(product.quantity) || 0;

            const threshold =
                Number(product.threshold) || 0;

            const price =
                Number(product.price) || 0;


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
                            ? "low-stock"
                            : "in-stock"
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
                        class="table-action edit-btn"
                        data-edit="${id}"
                    >
                        Edit
                    </button>

                    <button
                        class="table-action delete-btn"
                        data-delete="${id}"
                    >
                        Delete
                    </button>

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    document
        .querySelectorAll("[data-edit]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.edit
                    );

                }
            );

        });


    document
        .querySelectorAll("[data-delete]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.delete
                    );

                }
            );

        });

}



/* =====================================================
   ESCAPE HTML
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
   ADD / UPDATE PRODUCT
===================================================== */

$("productForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            $("productName").value.trim();

        const sku =
            $("productSKU").value.trim();

        const category =
            $("productCategory").value;

        const quantity =
            Number($("productQuantity").value);

        const price =
            Number($("productPrice").value);

        const threshold =
            Number($("lowStockThreshold").value);


        const message =
            $("productMessage");


        message.textContent = "";


        if (
            !name ||
            !sku ||
            !category ||
            Number.isNaN(quantity) ||
            Number.isNaN(price) ||
            Number.isNaN(threshold)
        ) {

            message.style.color = "#c94c4c";

            message.textContent =
                "Please complete all product fields.";

            return;

        }


        if (
            quantity < 0 ||
            price < 0 ||
            threshold < 0
        ) {

            message.style.color = "#c94c4c";

            message.textContent =
                "Quantity, price, and threshold cannot be negative.";

            return;

        }


        try {

            const productData = {

                name: name,

                sku: sku,

                category: category,

                quantity: quantity,

                price: price,

                threshold: threshold,

                updatedAt: Date.now()

            };


            if (editingProductId) {

                const productRef =
                    ref(
                        db,
                        "bakeryProducts/" +
                        editingProductId
                    );


                await set(
                    productRef,
                    productData
                );


                await addActivity(
                    "Update Product",
                    `Updated ${name} (${sku}).`
                );


                message.style.color =
                    "#2e8b57";

                message.textContent =
                    "Product updated successfully.";


            } else {

                const newProduct =
                    push(productsRef);


                productData.createdAt =
                    Date.now();


                await set(
                    newProduct,
                    productData
                );


                await addActivity(
                    "Add Product",
                    `Added ${name} (${sku}).`
                );


                message.style.color =
                    "#2e8b57";

                message.textContent =
                    "Product added successfully.";

            }


            resetProductForm();


            setTimeout(() => {

                message.textContent = "";

                showPage("inventory");

            }, 1000);


        } catch (err) {

            console.error(err);

            message.style.color =
                "#c94c4c";

            message.textContent =
                "Unable to save product. Check Firebase rules.";

        }

    }
);



/* =====================================================
   EDIT PRODUCT
===================================================== */

async function editProduct(productId) {

    try {

        const productRef =
            ref(
                db,
                "bakeryProducts/" +
                productId
            );


        const snapshot =
            await get(productRef);


        if (!snapshot.exists()) {
            return;
        }


        const product =
            snapshot.val();


        editingProductId =
            productId;


        $("productName").value =
            product.name || "";

        $("productSKU").value =
            product.sku || "";

        $("productCategory").value =
            product.category || "";

        $("productQuantity").value =
            product.quantity ?? 0;

        $("productPrice").value =
            product.price ?? 0;

        $("lowStockThreshold").value =
            product.threshold ?? 5;


        $("productPageTitle").textContent =
            "Edit Product";


        $("productSubmitBtn").textContent =
            "Update Product";


        $("cancelEditBtn")
            .classList.remove("hidden");


        showPage("addProduct");


    } catch (err) {

        console.error(err);

    }

}



/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(productId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
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


        const snapshot =
            await get(productRef);


        if (!snapshot.exists()) {
            return;
        }


        const product =
            snapshot.val();


        await remove(productRef);


        await addActivity(
            "Delete Product",
            `Deleted ${product.name} (${product.sku}).`
        );


        await loadProducts();

        await loadDashboard();


    } catch (err) {

        console.error(err);

        alert(
            "Unable to delete product."
        );

    }

}



/* =====================================================
   RESET PRODUCT FORM
===================================================== */

function resetProductForm() {

    editingProductId = null;


    $("productForm").reset();


    $("productQuantity").value = 0;

    $("lowStockThreshold").value = 5;


    $("productPageTitle").textContent =
        "Add Product";


    $("productSubmitBtn").textContent =
        "Add Product";


    $("cancelEditBtn")
        .classList.add("hidden");


    $("productMessage").textContent = "";

}



/* =====================================================
   CANCEL EDIT
===================================================== */

$("cancelEditBtn").addEventListener(
    "click",
    function () {

        resetProductForm();

        showPage("inventory");

    }
);



/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        const snapshot =
            await get(productsRef);


        const data =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const products =
            Object.values(data);


        let totalProducts =
            products.length;


        let totalStock = 0;

        let lowStockCount = 0;

        let estimatedValue = 0;


        const lowProducts = [];


        products.forEach(product => {

            const quantity =
                Number(product.quantity) || 0;

            const price =
                Number(product.price) || 0;

            const threshold =
                Number(product.threshold) || 0;


            totalStock += quantity;


            estimatedValue +=
                quantity * price;


            if (quantity <= threshold) {

                lowStockCount++;

                lowProducts.push(product);

            }

        });


        $("totalProducts").textContent =
            totalProducts;


        $("totalStock").textContent =
            totalStock;


        $("lowStock").textContent =
            lowStockCount;


        $("estimatedValue").textContent =
            "₱" +
            estimatedValue.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );


        renderLowStock(lowProducts);


        await loadRecentActivity();


    } catch (err) {

        console.error(err);

    }

}



/* =====================================================
   LOW STOCK LIST
===================================================== */

function renderLowStock(products) {

    const container =
        $("lowStockList");


    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML = `
            <p class="empty-text">
                No low stock products.
            </p>
        `;

        return;

    }


    products
        .slice(0, 8)
        .forEach(product => {

            const item =
                document.createElement("div");


            item.className =
                "low-stock-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(product.name)}
                </strong>

                <span>
                    Quantity:
                    ${Number(product.quantity) || 0}
                    /
                    Threshold:
                    ${Number(product.threshold) || 0}
                </span>

            `;


            container.appendChild(item);

        });

}



/* =====================================================
   LOAD RECENT ACTIVITY
===================================================== */

async function loadRecentActivity() {

    try {

        const snapshot =
            await get(activityRef);


        const data =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const activities =
            Object.values(data);


        activities.sort(
            (a, b) =>
                (b.timestamp || 0) -
                (a.timestamp || 0)
        );


        const recent =
            activities.slice(0, 5);


        const container =
            $("recentActivity");


        container.innerHTML = "";


        if (recent.length === 0) {

            container.innerHTML = `
                <p class="empty-text">
                    No recent activity.
                </p>
            `;

            return;

        }


        recent.forEach(activity => {

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

                <span>
                    ${formatDate(activity.timestamp)}
                </span>

            `;


            container.appendChild(item);

        });


    } catch (err) {

        console.error(err);

    }

}



/* =====================================================
   ACTIVITY LOG TABLE
===================================================== */

async function loadActivityLogs() {

    try {

        const snapshot =
            await get(activityRef);


        const data =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const activities =
            Object.values(data);


        activities.sort(
            (a, b) =>
                (b.timestamp || 0) -
                (a.timestamp || 0)
        );


        const tbody =
            $("activityTableBody");


        tbody.innerHTML = "";


        if (activities.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="empty-cell"
                    >
                        No activity logs yet.
                    </td>
                </tr>
            `;

            return;

        }


        activities.forEach(activity => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${formatDate(activity.timestamp)}
                </td>

                <td>
                    ${escapeHTML(activity.user || "-")}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(activity.action || "-")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(activity.details || "-")}
                </td>

            `;


            tbody.appendChild(row);

        });


    } catch (err) {

        console.error(err);

    }

}



/* =====================================================
   SEARCH
===================================================== */

$("searchProduct").addEventListener(
    "input",
    loadProducts
);



/* =====================================================
   CATEGORY FILTER
===================================================== */

$("categoryFilter").addEventListener(
    "change",
    loadProducts
);



/* =====================================================
   INVENTORY ADD BUTTON
===================================================== */

$("inventoryAddBtn").addEventListener(
    "click",
    function () {

        resetProductForm();

        showPage("addProduct");

    }
);



/* =====================================================
   ADD PRODUCT NAV BUTTON
===================================================== */

document
    .querySelector(
        '[data-page="addProduct"]'
    )
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            showPage("addProduct");

        }
    );



/* =====================================================
   OTHER NAVIGATION BUTTONS
===================================================== */

document
    .querySelectorAll(
        '.nav-btn:not([data-page="addProduct"])'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const page =
                    button.dataset.page;

                showPage(page);

            }
        );

    });



/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn").addEventListener(
    "click",
    async function () {

        if (currentUser) {

            await addActivity(
                "Logout",
                "User logged out."
            );

        }


        currentUser = null;

        editingProductId = null;


        sessionStorage.removeItem(
            "arbeesCurrentUser"
        );


        $("systemPage")
            .classList.add("hidden");


        $("loginPage")
            .classList.remove("hidden");


        $("loginForm").reset();

        $("loginError").textContent = "";

    }
);



/* =====================================================
   RESTORE SESSION
===================================================== */

function restoreSession() {

    const saved =
        sessionStorage.getItem(
            "arbeesCurrentUser"
        );


    if (!saved) {

        window.showLogin();

        return;

    }


    try {

        currentUser =
            JSON.parse(saved);


        updateUserInformation();

        window.showSecurityPage();


    } catch (err) {

        console.error(err);

        sessionStorage.removeItem(
            "arbeesCurrentUser"
        );

        window.showLogin();

    }

}



/* =====================================================
   START APPLICATION
===================================================== */

restoreSession();
