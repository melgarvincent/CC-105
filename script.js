// ======================================================
// FIREBASE REALTIME DATABASE - ARBEE'S BAKESHOP
// ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
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


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


// Database references

const usersRef = ref(db, "users");

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");


// Current logged-in user

let currentUser = null;


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function getUserKey(email) {

    return email
        .toLowerCase()
        .trim()
        .replace(/\./g, "_")
        .replace(/#/g, "_")
        .replace(/\$/g, "_")
        .replace(/\[/g, "_")
        .replace(/\]/g, "_")
        .replace(/\//g, "_");

}


function formatMoney(value) {

    return Number(value || 0).toLocaleString(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    );

}


function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    return new Date(timestamp).toLocaleString(
        "en-PH"
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// LOGIN / REGISTER PAGE SWITCH
// ======================================================

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


// ======================================================
// REGISTER
// ======================================================

document
    .getElementById("registerForm")
    .addEventListener(
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
                document
                    .getElementById("registerError");


            error.textContent = "";


            // Validate password

            if (password !== confirmPassword) {

                error.textContent =
                    "Passwords do not match.";

                return;
            }


            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            const userKey =
                getUserKey(email);


            try {

                // Check if account already exists

                const userSnapshot =
                    await get(
                        ref(db, "users/" + userKey)
                    );


                if (userSnapshot.exists()) {

                    error.textContent =
                        "An account with this email already exists.";

                    return;
                }


                // Save user

                await set(
                    ref(db, "users/" + userKey),
                    {

                        name: name,

                        email: email,

                        password: password,

                        role: "STAFF",

                        createdAt:
                            Date.now()

                    }
                );


                // Activity log

                await addActivity(
                    "Registered",
                    "New account created: " + email
                );


                alert(
                    "Registration successful! You can now login."
                );


                document
                    .getElementById("registerForm")
                    .reset();


                showLogin();


            } catch (error) {

                console.error(error);

                document
                    .getElementById("registerError")
                    .textContent =
                    "Registration failed: " +
                    error.message;

            }

        }
    );


// ======================================================
// LOGIN
// ======================================================

document
    .getElementById("loginForm")
    .addEventListener(
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
                document
                    .getElementById("loginError");


            error.textContent = "";


            try {

                const userKey =
                    getUserKey(email);


                const snapshot =
                    await get(
                        ref(db, "users/" + userKey)
                    );


                if (!snapshot.exists()) {

                    error.textContent =
                        "Account not found.";

                    return;
                }


                const user =
                    snapshot.val();


                if (user.password !== password) {

                    error.textContent =
                        "Invalid email or password.";

                    return;
                }


                // Save current user

                currentUser = {

                    key: userKey,

                    name: user.name,

                    email: user.email,

                    role: user.role || "STAFF"

                };


                sessionStorage.setItem(
                    "bakeryUser",
                    JSON.stringify(currentUser)
                );


                // Show system

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


                await addActivity(
                    "Login",
                    email + " logged into the system."
                );


            } catch (error) {

                console.error(error);

                document
                    .getElementById("loginError")
                    .textContent =
                    "Login failed: " +
                    error.message;

            }

        }
    );


// ======================================================
// RESTORE SESSION
// ======================================================

function restoreSession() {

    const savedUser =
        sessionStorage.getItem(
            "bakeryUser"
        );


    if (!savedUser) {

        return;
    }


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


        updateUserInformation();

        updateDashboard();


    } catch (error) {

        console.error(error);

        sessionStorage.removeItem(
            "bakeryUser"
        );

    }

}


// ======================================================
// USER INFORMATION
// ======================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    document
        .getElementById("headerUserName")
        .textContent =
        currentUser.name;


    document
        .getElementById("headerUserEmail")
        .textContent =
        currentUser.email;


    document
        .getElementById("currentUserName")
        .textContent =
        currentUser.name;


    document
        .getElementById("userRole")
        .textContent =
        currentUser.role;


    document
        .getElementById("profileName")
        .textContent =
        currentUser.name;


    document
        .getElementById("profileEmail")
        .textContent =
        currentUser.email;


    document
        .getElementById("profileRole")
        .textContent =
        currentUser.role;

}


// ======================================================
// LOGOUT
// ======================================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async function () {

            if (currentUser) {

                await addActivity(
                    "Logout",
                    currentUser.email +
                    " logged out."
                );

            }


            currentUser = null;


            sessionStorage.removeItem(
                "bakeryUser"
            );


            document
                .getElementById("systemPage")
                .classList.add("hidden");


            document
                .getElementById("loginPage")
                .classList.remove("hidden");


            document
                .getElementById("loginForm")
                .reset();

        }
    );


// ======================================================
// NAVIGATION
// ======================================================

document
    .querySelectorAll(".nav-btn")
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

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


function showPage(
    page,
    button
) {

    document
        .querySelectorAll(".page")
        .forEach(
            function (section) {

                section.classList.add(
                    "hidden"
                );

            }
        );


    const target =
        document.getElementById(
            page + "Page"
        );


    if (target) {

        target.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            function (btn) {

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


    const titles = {

        dashboard: "Dashboard",

        inventory: "Inventory",

        addProduct: "Add Product",

        activity: "Activity Logs",

        users: "My Account"

    };


    document
        .getElementById("pageTitle")
        .textContent =
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

}


// ======================================================
// ADD PRODUCT PAGE BUTTON
// ======================================================

document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        function () {

            const addButton =
                document.querySelector(
                    '.nav-btn[data-page="addProduct"]'
                );

            showPage(
                "addProduct",
                addButton
            );

        }
    );


// ======================================================
// ADD PRODUCT
// ======================================================

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


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
                        .getElementById("lowStockThreshold")
                        .value
                );


            const message =
                document
                    .getElementById("productMessage");


            message.textContent = "";


            if (!name ||
                !sku ||
                !category) {

                message.textContent =
                    "Please complete all fields.";

                return;
            }


            try {

                // Check duplicate SKU

                const snapshot =
                    await get(productsRef);


                let duplicateSKU = false;


                if (snapshot.exists()) {

                    const data =
                        snapshot.val();


                    Object.values(data)
                        .forEach(
                            function (product) {

                                if (
                                    String(
                                        product.sku
                                    ).toLowerCase()
                                    ===
                                    sku.toLowerCase()
                                ) {

                                    duplicateSKU = true;

                                }

                            }
                        );

                }


                if (duplicateSKU) {

                    message.textContent =
                        "SKU already exists.";

                    return;
                }


                // Generate product ID

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

                        createdAt:
                            Date.now(),

                        createdBy:
                            currentUser
                                ? currentUser.email
                                : "Unknown"

                    }
                );


                await addActivity(
                    "Added Product",
                    name +
                    " (" +
                    sku +
                    ") was added."
                );


                message.textContent =
                    "Product added successfully!";


                document
                    .getElementById("productForm")
                    .reset();


                document
                    .getElementById("productQuantity")
                    .value = 0;


                document
                    .getElementById("lowStockThreshold")
                    .value = 5;


                setTimeout(
                    function () {

                        message.textContent = "";

                    },
                    3000
                );


                updateDashboard();


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Failed to add product: " +
                    error.message;

            }

        }
    );


// ======================================================
// RENDER INVENTORY
// ======================================================

async function renderInventory() {

    const table =
        document
            .getElementById(
                "inventoryTableBody"
            );


    table.innerHTML = "";


    try {

        const snapshot =
            await get(productsRef);


        if (!snapshot.exists()) {

            table.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;">
                        No products found.
                    </td>
                </tr>
            `;

            return;
        }


        const data =
            snapshot.val();


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


        let count = 0;


        Object.entries(data)
            .forEach(
                function ([id, product]) {

                    const name =
                        String(
                            product.name || ""
                        );

                    const sku =
                        String(
                            product.sku || ""
                        );

                    const productCategory =
                        String(
                            product.category || ""
                        );


                    const matchesSearch =
                        name
                            .toLowerCase()
                            .includes(search)
                        ||
                        sku
                            .toLowerCase()
                            .includes(search);


                    const matchesCategory =
                        category === "all"
                        ||
                        productCategory === category;


                    if (
                        !matchesSearch ||
                        !matchesCategory
                    ) {

                        return;

                    }


                    count++;


                    const quantity =
                        Number(
                            product.quantity || 0
                        );

                    const threshold =
                        Number(
                            product.threshold ?? 5
                        );

                    const price =
                        Number(
                            product.price || 0
                        );


                    const low =
                        quantity <= threshold;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            <strong>
                                ${escapeHTML(name)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(sku)}
                        </td>

                        <td>
                            ${escapeHTML(productCategory)}
                        </td>

                        <td>
                            ${quantity}
                        </td>

                        <td>
                            ${formatMoney(price)}
                        </td>

                        <td>

                            <span class="${
                                low
                                ? "status-low"
                                : "status-good"
                            }">

                                ${
                                    low
                                    ? "⚠ Low Stock"
                                    : "✓ In Stock"
                                }

                            </span>

                        </td>

                        <td>

                            <button
                                class="action-btn edit-btn"
                                data-id="${id}"
                            >
                                ✏️ Edit
                            </button>

                            <button
                                class="action-btn delete-btn"
                                data-id="${id}"
                            >
                                🗑 Delete
                            </button>

                        </td>

                    `;


                    // EDIT

                    row
                        .querySelector(".edit-btn")
                        .addEventListener(
                            "click",
                            function () {

                                editProduct(
                                    id,
                                    product
                                );

                            }
                        );


                    // DELETE

                    row
                        .querySelector(".delete-btn")
                        .addEventListener(
                            "click",
                            function () {

                                deleteProduct(
                                    id,
                                    product
                                );

                            }
                        );


                    table.appendChild(row);

                }
            );


        if (count === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;">
                        No matching products found.
                    </td>
                </tr>
            `;

        }


    } catch (error) {

        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;color:#c0392b;">
                    Error loading inventory.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// SEARCH
// ======================================================

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        function () {

            renderInventory();

        }
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        function () {

            renderInventory();

        }
    );


// ======================================================
// EDIT PRODUCT
// ======================================================

async function editProduct(
    id,
    product
) {

    const newName =
        prompt(
            "Product Name:",
            product.name || ""
        );


    if (newName === null) {
        return;
    }


    const newSKU =
        prompt(
            "SKU:",
            product.sku || ""
        );


    if (newSKU === null) {
        return;
    }


    const newQuantity =
        prompt(
            "Quantity:",
            product.quantity ?? 0
        );


    if (newQuantity === null) {
        return;
    }


    const newPrice =
        prompt(
            "Price:",
            product.price ?? 0
        );


    if (newPrice === null) {
        return;
    }


    const quantity =
        Number(newQuantity);

    const price =
        Number(newPrice);


    if (
        Number.isNaN(quantity) ||
        Number.isNaN(price)
    ) {

        alert(
            "Please enter valid numbers."
        );

        return;
    }


    try {

        await set(
            ref(
                db,
                "bakeryProducts/" + id
            ),
            {

                ...product,

                name:
                    newName.trim(),

                sku:
                    newSKU.trim(),

                quantity:
                    quantity,

                price:
                    price,

                updatedAt:
                    Date.now(),

                updatedBy:
                    currentUser
                        ? currentUser.email
                        : "Unknown"

            }
        );


        await addActivity(
            "Updated Product",
            newName +
            " was updated."
        );


        alert(
            "Product updated successfully."
        );


        renderInventory();

        updateDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Update failed: " +
            error.message
        );

    }

}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(
    id,
    product
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete " +
            product.name +
            "?"
        );


    if (!confirmDelete) {
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
            "Deleted Product",
            product.name +
            " was deleted."
        );


        alert(
            "Product deleted successfully."
        );


        renderInventory();

        updateDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Delete failed: " +
            error.message
        );

    }

}


// ======================================================
// DASHBOARD
// ======================================================

async function updateDashboard() {

    try {

        const snapshot =
            await get(productsRef);


        let totalProducts = 0;

        let totalStock = 0;

        let lowStockCount = 0;

        let estimatedValue = 0;

        const lowProducts = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            Object.values(data)
                .forEach(
                    function (product) {

                        totalProducts++;


                        const quantity =
                            Number(
                                product.quantity || 0
                            );

                        const price =
                            Number(
                                product.price || 0
                            );

                        const threshold =
                            Number(
                                product.threshold ?? 5
                            );


                        totalStock += quantity;


                        estimatedValue +=
                            quantity * price;


                        if (
                            quantity <= threshold
                        ) {

                            lowStockCount++;


                            lowProducts.push(
                                product
                            );

                        }

                    }
                );

        }


        document
            .getElementById(
                "totalProducts"
            )
            .textContent =
            totalProducts;


        document
            .getElementById(
                "totalStock"
            )
            .textContent =
            totalStock;


        document
            .getElementById(
                "lowStock"
            )
            .textContent =
            lowStockCount;


        document
            .getElementById(
                "estimatedValue"
            )
            .textContent =
            formatMoney(
                estimatedValue
            );


        renderLowStock(
            lowProducts
        );


        renderRecentActivity();


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// ======================================================
// LOW STOCK
// ======================================================

function renderLowStock(
    products
) {

    const container =
        document
            .getElementById(
                "lowStockList"
            );


    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML = `
            <p class="empty-text">
                No low stock products.
            </p>
        `;

        return;
    }


    products.forEach(
        function (product) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "low-stock-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(product.name)}
                </strong>

                <span>
                    ${Number(product.quantity || 0)}
                    stock remaining
                    • Threshold:
                    ${Number(product.threshold ?? 5)}
                </span>

            `;


            container.appendChild(item);

        }
    );

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

                timestamp:
                    Date.now(),

                user:
                    currentUser
                        ? currentUser.email
                        : "System",

                action:
                    action,

                details:
                    details

            }
        );

    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );

    }

}


// ======================================================
// RENDER ACTIVITY
// ======================================================

async function renderActivities() {

    const table =
        document
            .getElementById(
                "activityTableBody"
            );


    table.innerHTML = "";


    try {

        const snapshot =
            await get(activityRef);


        if (!snapshot.exists()) {

            table.innerHTML = `
                <tr>
                    <td colspan="4"
                        style="text-align:center;">
                        No activity logs.
                    </td>
                </tr>
            `;

            return;
        }


        const data =
            snapshot.val();


        const activities =
            Object.values(data)
                .sort(
                    function (a, b) {

                        return (
                            Number(
                                b.timestamp || 0
                            )
                            -
                            Number(
                                a.timestamp || 0
                            )
                        );

                    }
                );


        activities.forEach(
            function (activity) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${formatDate(
                            activity.timestamp
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            activity.user
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                activity.action
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            activity.details
                        )}
                    </td>

                `;


                table.appendChild(row);

            }
        );


    } catch (error) {

        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;color:#c0392b;">
                    Error loading activity logs.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// RECENT ACTIVITY
// ======================================================

async function renderRecentActivity() {

    const container =
        document
            .getElementById(
                "recentActivity"
            );


    container.innerHTML = "";


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


        const data =
            snapshot.val();


        const activities =
            Object.values(data)
                .sort(
                    function (a, b) {

                        return (
                            Number(
                                b.timestamp || 0
                            )
                            -
                            Number(
                                a.timestamp || 0
                            )
                        );

                    }
                )
                .slice(0, 5);


        activities.forEach(
            function (activity) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "activity-item";


                item.innerHTML = `

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

                    <span>
                        ${formatDate(
                            activity.timestamp
                        )}
                    </span>

                `;


                container.appendChild(item);

            }
        );


    } catch (error) {

        console.error(error);

    }

}


// ======================================================
// INITIALIZE
// ======================================================

restoreSession();
