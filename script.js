/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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

let products = {};

let currentUser = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const appPage =
    document.getElementById("app");


const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const productForm =
    document.getElementById("productForm");


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    loginPage.classList.remove("hidden");

    registerPage.classList.add("hidden");

    appPage.classList.add("hidden");

    clearMessages();
}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

    loginPage.classList.add("hidden");

    registerPage.classList.remove("hidden");

    appPage.classList.add("hidden");

    clearMessages();
}


/* =========================================================
   CLEAR AUTH MESSAGES
========================================================= */

function clearMessages() {

    const loginMessage =
        document.getElementById("loginMessage");

    const registerMessage =
        document.getElementById("registerMessage");

    loginMessage.textContent = "";

    registerMessage.textContent = "";

    loginMessage.className = "auth-message";

    registerMessage.className = "auth-message";
}


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showMessage(element, message, type) {

    element.textContent = message;

    element.className =
        "auth-message " + type;
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail")
            .value
            .trim();

    const password =
        document.getElementById("loginPassword")
            .value;

    const loginBtn =
        document.getElementById("loginBtn");

    const loginMessage =
        document.getElementById("loginMessage");


    if (!email || !password) {

        showMessage(
            loginMessage,
            "Please enter your email and password.",
            "error-message"
        );

        return;
    }


    loginBtn.disabled = true;

    loginBtn.textContent = "LOGGING IN...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        showMessage(
            loginMessage,
            "Login successful!",
            "success-message"
        );

    }

    catch (error) {

        console.error(error);

        showMessage(
            loginMessage,
            getAuthErrorMessage(error),
            "error-message"
        );

    }

    finally {

        loginBtn.disabled = false;

        loginBtn.textContent = "LOGIN";
    }

});


/* =========================================================
   REGISTER
========================================================= */

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const name =
        document.getElementById("registerName")
            .value
            .trim();

    const email =
        document.getElementById("registerEmail")
            .value
            .trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    const confirmPassword =
        document.getElementById("registerConfirmPassword")
            .value;


    const registerBtn =
        document.getElementById("registerBtn");

    const registerMessage =
        document.getElementById("registerMessage");


    if (!name || !email || !password || !confirmPassword) {

        showMessage(
            registerMessage,
            "Please complete all fields.",
            "error-message"
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            registerMessage,
            "Password must be at least 6 characters.",
            "error-message"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            registerMessage,
            "Passwords do not match.",
            "error-message"
        );

        return;
    }


    registerBtn.disabled = true;

    registerBtn.textContent = "CREATING...";


    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        /* SAVE USER PROFILE TO REALTIME DATABASE */

        await set(
            ref(db, "users/" + user.uid),
            {
                uid: user.uid,
                name: name,
                email: email,
                role: "staff",
                createdAt: new Date().toISOString()
            }
        );


        /* SAVE ACTIVITY */

        await addActivity(
            "New User Registered",
            `${name} created a staff account.`
        );


        showMessage(
            registerMessage,
            "Account created successfully!",
            "success-message"
        );


        registerForm.reset();


        /*
           Firebase automatically signs in
           the newly registered user.
           onAuthStateChanged() will open dashboard.
        */

    }

    catch (error) {

        console.error(error);

        showMessage(
            registerMessage,
            getAuthErrorMessage(error),
            "error-message"
        );

    }

    finally {

        registerBtn.disabled = false;

        registerBtn.textContent =
            "CREATE ACCOUNT";
    }

});


/* =========================================================
   FORGOT PASSWORD
========================================================= */

document
    .getElementById("forgotPasswordBtn")
    .addEventListener("click", async () => {

        const email =
            document.getElementById("loginEmail")
                .value
                .trim();

        const loginMessage =
            document.getElementById("loginMessage");


        if (!email) {

            showMessage(
                loginMessage,
                "Enter your email first.",
                "error-message"
            );

            return;
        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            showMessage(
                loginMessage,
                "Password reset email sent. Check your inbox.",
                "success-message"
            );

        }

        catch (error) {

            console.error(error);

            showMessage(
                loginMessage,
                getAuthErrorMessage(error),
                "error-message"
            );
        }

    });


/* =========================================================
   SWITCH LOGIN / REGISTER
========================================================= */

document
    .getElementById("showRegisterBtn")
    .addEventListener("click", showRegister);


document
    .getElementById("showLoginBtn")
    .addEventListener("click", showLogin);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {

    currentUser = user;


    if (user) {

        loginPage.classList.add("hidden");

        registerPage.classList.add("hidden");

        appPage.classList.remove("hidden");


        document
            .getElementById("currentUserDisplay")
            .textContent =
                user.email || "Staff";


        await loadProducts();

        loadActivityLogs();

        updateDashboard();

    }

    else {

        appPage.classList.add("hidden");

        loginPage.classList.remove("hidden");

        registerPage.classList.add("hidden");

        products = {};
    }

});


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

            showToast(
                "Logged out successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(error);

            showToast(
                "Logout failed.",
                "error"
            );
        }

    });


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-btn[data-page]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const page =
                button.dataset.page;

            showPage(page);

        });

    });


function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add("active");

    }


    document
        .querySelectorAll(".nav-btn[data-page]")
        .forEach(button => {

            button.classList.remove("active");

            if (button.dataset.page === pageId) {

                button.classList.add("active");

            }

        });


    if (pageId === "dashboard") {

        updateDashboard();

    }


    if (pageId === "inventory") {

        displayInventory();

    }


    if (pageId === "activity") {

        loadActivityLogs();

    }

}


/* =========================================================
   INVENTORY ADD BUTTON
========================================================= */

document
    .getElementById("inventoryAddBtn")
    .addEventListener("click", () => {

        resetProductForm();

        showPage("addProduct");

    });


/* =========================================================
   CANCEL PRODUCT
========================================================= */

document
    .getElementById("cancelProductBtn")
    .addEventListener("click", () => {

        resetProductForm();

        showPage("inventory");

    });


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    return new Promise((resolve) => {

        onValue(
            productsRef,
            (snapshot) => {

                products =
                    snapshot.val() || {};


                displayInventory();

                updateDashboard();

                resolve();

            },
            (error) => {

                console.error(
                    "Products error:",
                    error
                );

                showToast(
                    "Unable to load inventory.",
                    "error"
                );

                resolve();
            }
        );

    });

}


/* =========================================================
   DISPLAY INVENTORY
========================================================= */

function displayInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    const search =
        document.getElementById(
            "searchInput"
        )
        .value
        .toLowerCase()
        .trim();


    const category =
        document.getElementById(
            "categoryFilter"
        )
        .value;


    tbody.innerHTML = "";


    const productEntries =
        Object.entries(products);


    const filtered =
        productEntries.filter(
            ([id, product]) => {

                const matchesSearch =

                    String(product.sku || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(product.name || "")
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


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        No products found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(
        ([id, product]) => {

            const quantity =
                Number(product.quantity || 0);

            const threshold =
                Number(product.threshold || 0);


            const status =
                getProductStatus(
                    quantity,
                    threshold
                );


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td>
                    ${escapeHTML(product.sku || "-")}
                </td>

                <td>
                    ${escapeHTML(product.name || "-")}
                </td>

                <td>
                    ${escapeHTML(product.category || "-")}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ₱${Number(product.price || 0).toFixed(2)}
                </td>

                <td>
                    ${getStatusHTML(status)}
                </td>

                <td>

                    <button
                        class="action-btn edit-btn"
                        data-edit="${id}"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-delete="${id}"
                    >
                        Delete
                    </button>

                </td>
            `;


            tbody.appendChild(tr);

        }
    );


    attachTableActions();

    updateCategoryFilter();

}


/* =========================================================
   TABLE ACTIONS
========================================================= */

function attachTableActions() {

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


/* =========================================================
   SEARCH
========================================================= */

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        displayInventory
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        displayInventory
    );


/* =========================================================
   UPDATE CATEGORY FILTER
========================================================= */

function updateCategoryFilter() {

    const select =
        document.getElementById(
            "categoryFilter"
        );


    const current =
        select.value;


    const categories =
        new Set();


    Object.values(products)
        .forEach(product => {

            if (product.category) {

                categories.add(
                    product.category
                );

            }

        });


    select.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;


    [...categories]
        .sort()
        .forEach(category => {

            const option =
                document.createElement("option");

            option.value = category;

            option.textContent = category;

            select.appendChild(option);

        });


    if (
        [...categories].includes(current)
    ) {

        select.value = current;

    }

}


/* =========================================================
   ADD / UPDATE PRODUCT
========================================================= */

productForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const editId =
            document
                .getElementById("editProductId")
                .value;


        const sku =
            document
                .getElementById("sku")
                .value
                .trim();


        const name =
            document
                .getElementById("productName")
                .value
                .trim();


        const category =
            document
                .getElementById("category")
                .value;


        const quantity =
            Number(
                document
                    .getElementById("quantity")
                    .value
            );


        const price =
            Number(
                document
                    .getElementById("price")
                    .value
            );


        const threshold =
            Number(
                document
                    .getElementById("threshold")
                    .value
            );


        if (!sku || !name || !category) {

            showToast(
                "Please complete all product fields.",
                "error"
            );

            return;
        }


        if (
            Number.isNaN(quantity) ||
            quantity < 0
        ) {

            showToast(
                "Quantity must be 0 or greater.",
                "error"
            );

            return;
        }


        if (
            Number.isNaN(price) ||
            price < 0
        ) {

            showToast(
                "Price must be 0 or greater.",
                "error"
            );

            return;
        }


        if (
            Number.isNaN(threshold) ||
            threshold < 0
        ) {

            showToast(
                "Threshold must be 0 or greater.",
                "error"
            );

            return;
        }


        const product = {

            sku: sku,

            name: name,

            category: category,

            quantity: quantity,

            price: price,

            threshold: threshold,

            updatedAt:
                new Date().toISOString()
        };


        try {

            if (editId) {

                await update(
                    ref(
                        db,
                        "bakeryProducts/" + editId
                    ),
                    product
                );


                await addActivity(
                    "Product Updated",
                    `${name} was updated.`
                );


                showToast(
                    "Product updated successfully.",
                    "success"
                );

            }

            else {

                const newProductRef =
                    push(productsRef);


                product.createdAt =
                    new Date().toISOString();


                await set(
                    newProductRef,
                    product
                );


                await addActivity(
                    "Product Added",
                    `${name} was added to inventory.`
                );


                showToast(
                    "Product added successfully.",
                    "success"
                );

            }


            resetProductForm();

            showPage("inventory");

        }

        catch (error) {

            console.error(error);

            showToast(
                "Unable to save product.",
                "error"
            );

        }

    }
);


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(id) {

    const product =
        products[id];


    if (!product) {

        showToast(
            "Product not found.",
            "error"
        );

        return;
    }


    document
        .getElementById("editProductId")
        .value = id;


    document
        .getElementById("sku")
        .value =
            product.sku || "";


    document
        .getElementById("productName")
        .value =
            product.name || "";


    document
        .getElementById("category")
        .value =
            product.category || "";


    document
        .getElementById("quantity")
        .value =
            product.quantity ?? 0;


    document
        .getElementById("price")
        .value =
            product.price ?? 0;


    document
        .getElementById("threshold")
        .value =
            product.threshold ?? 5;


    document
        .getElementById("productFormTitle")
        .textContent =
            "Edit Product";


    document
        .getElementById("saveProductBtn")
        .textContent =
            "Update Product";


    showPage("addProduct");

}


/* =========================================================
   RESET FORM
========================================================= */

function resetProductForm() {

    productForm.reset();


    document
        .getElementById("editProductId")
        .value = "";


    document
        .getElementById("threshold")
        .value = 5;


    document
        .getElementById("productFormTitle")
        .textContent =
            "Add Product";


    document
        .getElementById("saveProductBtn")
        .textContent =
            "Save Product";

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(id) {

    const product =
        products[id];


    if (!product) {

        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}" from inventory?`
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
            "Product Deleted",
            `${product.name} was deleted from inventory.`
        );


        showToast(
            "Product deleted successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to delete product.",
            "error"
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const entries =
        Object.values(products);


    let totalStock = 0;

    let lowStock = 0;

    let estimatedValue = 0;


    entries.forEach(product => {

        const quantity =
            Number(product.quantity || 0);

        const price =
            Number(product.price || 0);

        const threshold =
            Number(product.threshold || 0);


        totalStock += quantity;

        estimatedValue +=
            quantity * price;


        if (
            quantity > 0 &&
            quantity <= threshold
        ) {

            lowStock++;

        }

    });


    document
        .getElementById("totalProducts")
        .textContent =
            entries.length;


    document
        .getElementById("totalStock")
        .textContent =
            totalStock;


    document
        .getElementById("lowStockItems")
        .textContent =
            lowStock;


    document
        .getElementById("estimatedValue")
        .textContent =
            "₱" +
            estimatedValue.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );


    displayDashboardTable();

}


/* =========================================================
   DASHBOARD TABLE
========================================================= */

function displayDashboardTable() {

    const tbody =
        document.getElementById(
            "dashboardTableBody"
        );


    tbody.innerHTML = "";


    const entries =
        Object.entries(products)
            .slice(-8)
            .reverse();


    if (entries.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No products available.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    entries.forEach(
        ([id, product]) => {

            const quantity =
                Number(product.quantity || 0);

            const threshold =
                Number(product.threshold || 0);


            const status =
                getProductStatus(
                    quantity,
                    threshold
                );


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td>
                    ${escapeHTML(product.sku || "-")}
                </td>

                <td>
                    ${escapeHTML(product.name || "-")}
                </td>

                <td>
                    ${escapeHTML(product.category || "-")}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ₱${Number(product.price || 0).toFixed(2)}
                </td>

                <td>
                    ${getStatusHTML(status)}
                </td>

            `;


            tbody.appendChild(tr);

        }
    );

}


/* =========================================================
   PRODUCT STATUS
========================================================= */

function getProductStatus(
    quantity,
    threshold
) {

    if (quantity <= 0) {

        return "out";

    }


    if (quantity <= threshold) {

        return "low";

    }


    return "in";

}


/* =========================================================
   STATUS HTML
========================================================= */

function getStatusHTML(status) {

    if (status === "out") {

        return `
            <span class="status out-stock">
                OUT OF STOCK
            </span>
        `;

    }


    if (status === "low") {

        return `
            <span class="status low-stock">
                LOW STOCK
            </span>
        `;

    }


    return `
        <span class="status in-stock">
            IN STOCK
        </span>
    `;

}


/* =========================================================
   ACTIVITY LOG
========================================================= */

async function addActivity(
    action,
    description
) {

    try {

        const newActivity =
            push(activityRef);


        await set(
            newActivity,
            {

                action: action,

                description: description,

                email:
                    currentUser
                        ? currentUser.email
                        : "System",

                createdAt:
                    new Date().toISOString()

            }
        );

    }

    catch (error) {

        console.error(
            "Activity error:",
            error
        );

    }

}


/* =========================================================
   LOAD ACTIVITY LOGS
========================================================= */

function loadActivityLogs() {

    onValue(
        activityRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            const list =
                document.getElementById(
                    "activityList"
                );


            list.innerHTML = "";


            const entries =
                Object.values(data)
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt || 0)
                            -
                            new Date(a.createdAt || 0)
                    );


            if (entries.length === 0) {

                list.innerHTML = `
                    <div class="empty-state">
                        No activity logs yet.
                    </div>
                `;

                return;
            }


            entries
                .slice(0, 50)
                .forEach(activity => {

                    const item =
                        document.createElement("div");


                    item.className =
                        "activity-item";


                    item.innerHTML = `

                        <strong>
                            ${escapeHTML(
                                activity.action || "Activity"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                activity.description || ""
                            )}
                        </p>

                        <p>
                            By:
                            ${escapeHTML(
                                activity.email || "System"
                            )}
                        </p>

                        <p class="activity-time">
                            ${formatDate(
                                activity.createdAt
                            )}
                        </p>

                    `;


                    list.appendChild(item);

                });

        },
        error => {

            console.error(
                "Activity logs error:",
                error
            );

        }
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {

    if (!dateString) {

        return "Unknown date";

    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {

        return "Unknown date";

    }


    return date.toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById("toast");


    toast.textContent = message;

    toast.className =
        "show " + type;


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            toast.className = "";

        }, 3000);

}


/* =========================================================
   AUTH ERROR MESSAGE
========================================================= */

function getAuthErrorMessage(error) {

    const code =
        error.code || "";


    switch (code) {

        case "auth/invalid-email":

            return "Invalid email address.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/weak-password":

            return "Password must be at least 6 characters.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/network-request-failed":

            return "Network error. Check your internet connection.";


        case "auth/operation-not-allowed":

            return "Email/password login is not enabled in Firebase.";


        default:

            return error.message ||
                "Something went wrong.";

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   INITIAL
========================================================= */

showLogin();
