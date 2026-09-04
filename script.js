// ======================================================
// FIREBASE REALTIME DATABASE ONLY
// NO FIREBASE AUTHENTICATION
// ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================
//
// ILISI KINI SA IMONG ACTUAL FIREBASE CONFIG
//

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    databaseURL:
        "https://YOUR_PROJECT-default-rtdb.firebaseio.com",

    projectId: "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId: "YOUR_SENDER_ID",

    appId: "YOUR_APP_ID"

};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


// ======================================================
// CURRENT USER
// ======================================================

let currentUser = null;

let allProducts = [];


// ======================================================
// GET ELEMENTS
// ======================================================

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const systemPage =
    document.getElementById("systemPage");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const goRegisterBtn =
    document.getElementById("goRegisterBtn");

const goLoginBtn =
    document.getElementById("goLoginBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const mobileLogout =
    document.getElementById("mobileLogout");


// ======================================================
// SHOW REGISTER
// ======================================================

goRegisterBtn.addEventListener("click", function () {

    loginPage.classList.add("hidden");

    registerPage.classList.remove("hidden");

    document.getElementById("loginError").textContent = "";

});


// ======================================================
// SHOW LOGIN
// ======================================================

goLoginBtn.addEventListener("click", function () {

    registerPage.classList.add("hidden");

    loginPage.classList.remove("hidden");

    document.getElementById("registerError").textContent = "";

});


// ======================================================
// REGISTER
// ======================================================

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const error =
        document.getElementById("registerError");


    error.textContent = "";


    // CHECK PASSWORD

    if (password.length < 6) {

        error.textContent =
            "Password must be at least 6 characters.";

        return;
    }


    // CHECK PASSWORD MATCH

    if (password !== confirmPassword) {

        error.textContent =
            "Passwords do not match.";

        return;
    }


    try {

        // READ USERS

        const usersRef =
            ref(db, "users");

        const snapshot =
            await get(usersRef);


        let users =
            snapshot.exists()
                ? snapshot.val()
                : {};


        // CHECK DUPLICATE EMAIL

        for (const key in users) {

            if (
                users[key].email &&
                users[key].email.toLowerCase() === email
            ) {

                error.textContent =
                    "Email is already registered.";

                return;
            }

        }


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

                password: password,

                role: "STAFF",

                createdAt:
                    new Date().toLocaleString()

            }
        );


        // LOG ACTIVITY

        await addActivity(
            "REGISTER",
            name,
            "New account registered"
        );


        alert(
            "Registration successful! You can now login."
        );


        // CLEAR FORM

        registerForm.reset();


        // SHOW LOGIN

        registerPage.classList.add("hidden");

        loginPage.classList.remove("hidden");

    }
    catch (errorObject) {

        console.error(errorObject);

        error.textContent =
            "Registration failed: " +
            errorObject.message;

    }

});


// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();


    const password =
        document.getElementById("loginPassword")
        .value;


    const error =
        document.getElementById("loginError");


    error.textContent = "";


    try {

        const usersRef =
            ref(db, "users");


        const snapshot =
            await get(usersRef);


        if (!snapshot.exists()) {

            error.textContent =
                "No registered users found.";

            return;
        }


        const users =
            snapshot.val();


        let foundUser = null;


        for (const key in users) {

            const user =
                users[key];


            if (
                user.email &&
                user.email.toLowerCase() === email &&
                user.password === password
            ) {

                foundUser = {

                    id: key,

                    ...user

                };

                break;
            }

        }


        if (!foundUser) {

            error.textContent =
                "Incorrect email or password.";

            return;
        }


        // SAVE LOGIN SESSION

        currentUser =
            foundUser;


        sessionStorage.setItem(
            "arbeesUser",
            JSON.stringify(foundUser)
        );


        // SHOW SYSTEM

        loginPage.classList.add("hidden");

        registerPage.classList.add("hidden");

        systemPage.classList.remove("hidden");


        // UPDATE USER

        updateUserInformation();


        // LOAD DATA

        await loadProducts();

        await loadActivities();

        showPage("dashboard");


        // LOG LOGIN

        await addActivity(
            "LOGIN",
            foundUser.name,
            "User logged in"
        );

    }
    catch (errorObject) {

        console.error(errorObject);

        error.textContent =
            "Login failed: " +
            errorObject.message;

    }

});


// ======================================================
// UPDATE USER INFORMATION
// ======================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }


    document.getElementById(
        "currentUserName"
    ).textContent =
        currentUser.name;


    document.getElementById(
        "currentUserEmail"
    ).textContent =
        currentUser.email;


    document.getElementById(
        "userRole"
    ).textContent =
        currentUser.role;


    document.getElementById(
        "profileName"
    ).textContent =
        currentUser.name;


    document.getElementById(
        "profileEmail"
    ).textContent =
        currentUser.email;


    document.getElementById(
        "profileRole"
    ).textContent =
        currentUser.role;

}


// ======================================================
// NAVIGATION
// ======================================================

document.querySelectorAll(".nav-btn")
.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const page =
                button.dataset.page;

            showPage(page);

        }
    );

});


function showPage(page) {

    document.querySelectorAll(".content-page")
    .forEach(function (section) {

        section.classList.add("hidden");

    });


    const target =
        document.getElementById(
            page + "Page"
        );


    if (target) {

        target.classList.remove("hidden");

    }


    document.querySelectorAll(".nav-btn")
    .forEach(function (button) {

        button.classList.remove("active");

        if (
            button.dataset.page === page
        ) {

            button.classList.add("active");

        }

    });


    if (page === "inventory") {

        renderInventory();

    }


    if (page === "activity") {

        loadActivities();

    }

}


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    logout
);


mobileLogout.addEventListener(
    "click",
    logout
);


function logout() {

    currentUser = null;

    sessionStorage.removeItem(
        "arbeesUser"
    );


    systemPage.classList.add("hidden");

    loginPage.classList.remove("hidden");

    loginForm.reset();

}


// ======================================================
// ADD PRODUCT
// ======================================================

document.getElementById(
    "inventoryAddBtn"
)
.addEventListener(
    "click",
    function () {

        showPage("addProduct");

    }
);


document.getElementById(
    "productForm"
)
.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!currentUser) {

            alert("Please login first.");

            return;
        }


        const name =
            document.getElementById(
                "productName"
            ).value.trim();


        const sku =
            document.getElementById(
                "productSKU"
            ).value.trim();


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


        try {

            const productsRef =
                ref(db, "products");


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
                        currentUser.name,

                    createdAt:
                        new Date().toLocaleString()

                }
            );


            await addActivity(
                "ADD PRODUCT",
                currentUser.name,
                "Added " + name
            );


            message.textContent =
                "Product successfully added!";


            document.getElementById(
                "productForm"
            ).reset();


            document.getElementById(
                "lowStockThreshold"
            ).value = 5;


            await loadProducts();

        }
        catch (errorObject) {

            console.error(errorObject);

            message.textContent =
                "Error: " +
                errorObject.message;

        }

    }
);


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const productsRef =
            ref(db, "products");


        const snapshot =
            await get(productsRef);


        allProducts = [];


        if (snapshot.exists()) {

            const data =
                snapshot.val();


            for (const id in data) {

                allProducts.push({

                    id: id,

                    ...data[id]

                });

            }

        }


        updateDashboard();

        renderInventory();

    }
    catch (errorObject) {

        console.error(
            "Products error:",
            errorObject
        );

    }

}


// ======================================================
// RENDER INVENTORY
// ======================================================

function renderInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    const search =
        document.getElementById(
            "searchProduct"
        ).value
        .toLowerCase();


    const category =
        document.getElementById(
            "categoryFilter"
        ).value;


    const filtered =
        allProducts.filter(
            function (product) {

                const matchesSearch =
                    product.name
                    .toLowerCase()
                    .includes(search)
                    ||
                    product.sku
                    .toLowerCase()
                    .includes(search);


                const matchesCategory =
                    category === ""
                    ||
                    product.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    tbody.innerHTML = "";


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(
        function (product) {

            const quantity =
                Number(product.quantity || 0);


            const threshold =
                Number(product.threshold || 5);


            const price =
                Number(product.price || 0);


            const low =
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
                        low
                            ? "status-low"
                            : "status-ok"
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
                        class="action-btn delete"
                        data-id="${product.id}">

                        🗑️ Delete

                    </button>

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    // DELETE BUTTONS

    tbody.querySelectorAll(
        ".delete"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    await deleteProduct(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id) {

    const product =
        allProducts.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!product) {
        return;
    }


    const confirmDelete =
        confirm(
            "Delete " +
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
                "products/" + id
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            currentUser.name,
            "Deleted " + product.name
        );


        await loadProducts();

    }
    catch (errorObject) {

        alert(
            "Delete failed: " +
            errorObject.message
        );

    }

}


// ======================================================
// SEARCH
// ======================================================

document.getElementById(
    "searchProduct"
)
.addEventListener(
    "input",
    renderInventory
);


document.getElementById(
    "categoryFilter"
)
.addEventListener(
    "change",
    renderInventory
);


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    let totalStock = 0;

    let lowStock = 0;

    let estimatedValue = 0;


    allProducts.forEach(
        function (product) {

            const quantity =
                Number(product.quantity || 0);


            const price =
                Number(product.price || 0);


            const threshold =
                Number(product.threshold || 5);


            totalStock += quantity;


            estimatedValue +=
                quantity * price;


            if (
                quantity <= threshold
            ) {

                lowStock++;

            }

        }
    );


    document.getElementById(
        "totalProducts"
    ).textContent =
        allProducts.length;


    document.getElementById(
        "totalStock"
    ).textContent =
        totalStock;


    document.getElementById(
        "lowStock"
    ).textContent =
        lowStock;


    document.getElementById(
        "estimatedValue"
    ).textContent =
        "₱" +
        estimatedValue.toFixed(2);


    const lowList =
        document.getElementById(
            "lowStockList"
        );


    const lowProducts =
        allProducts.filter(
            function (product) {

                return Number(product.quantity || 0)
                    <=
                    Number(product.threshold || 5);

            }
        );


    lowList.innerHTML = "";


    if (lowProducts.length === 0) {

        lowList.innerHTML = `
            <p class="empty-message">
                No low stock products.
            </p>
        `;

    }
    else {

        lowProducts.forEach(
            function (product) {

                lowList.innerHTML += `

                    <div class="stock-item">

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            Stock: ${product.quantity}
                        </small>

                        <span class="low-label">
                            LOW STOCK
                        </span>

                    </div>

                `;

            }
        );

    }

}


// ======================================================
// ACTIVITY LOG
// ======================================================

async function addActivity(
    action,
    user,
    details
) {

    try {

        const activityRef =
            ref(db, "activityLogs");


        const newActivity =
            push(activityRef);


        await set(
            newActivity,
            {

                action: action,

                user: user,

                details: details,

                dateTime:
                    new Date().toLocaleString()

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


// ======================================================
// LOAD ACTIVITIES
// ======================================================

async function loadActivities() {

    try {

        const activityRef =
            ref(db, "activityLogs");


        const snapshot =
            await get(activityRef);


        const tbody =
            document.getElementById(
                "activityTableBody"
            );


        const recent =
            document.getElementById(
                "recentActivity"
            );


        tbody.innerHTML = "";

        recent.innerHTML = "";


        if (!snapshot.exists()) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table">
                        No activity logs.
                    </td>
                </tr>
            `;

            recent.innerHTML = `
                <p class="empty-message">
                    No recent activity.
                </p>
            `;

            return;
        }


        const data =
            snapshot.val();


        const logs = [];


        for (const id in data) {

            logs.push({

                id: id,

                ...data[id]

            });

        }


        logs.reverse();


        logs.forEach(
            function (log) {

                tbody.innerHTML += `

                    <tr>

                        <td>
                            ${escapeHTML(log.action)}
                        </td>

                        <td>
                            ${escapeHTML(log.user)}
                        </td>

                        <td>
                            ${escapeHTML(log.details)}
                        </td>

                        <td>
                            ${escapeHTML(log.dateTime)}
                        </td>

                    </tr>

                `;

            }
        );


        logs.slice(0, 5)
        .forEach(
            function (log) {

                recent.innerHTML += `

                    <div class="activity-item">

                        <strong>
                            ${escapeHTML(log.action)}
                        </strong>

                        - ${escapeHTML(log.details)}

                        <small>
                            ${escapeHTML(log.dateTime)}
                        </small>

                    </div>

                `;

            }
        );

    }
    catch (errorObject) {

        console.error(
            "Activity load error:",
            errorObject
        );

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ======================================================
// RESTORE SESSION
// ======================================================

const savedUser =
    sessionStorage.getItem(
        "arbeesUser"
    );


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);


        loginPage.classList.add("hidden");

        registerPage.classList.add("hidden");

        systemPage.classList.remove("hidden");


        updateUserInformation();

        loadProducts();

        loadActivities();

    }
    catch (errorObject) {

        sessionStorage.removeItem(
            "arbeesUser"
        );

    }

}
