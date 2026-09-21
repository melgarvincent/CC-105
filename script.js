// =====================================================
// ARBEES BAKERY SHOP
// FIREBASE AUTH + REALTIME DATABASE
// =====================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    remove,
    onValue
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

let app;
let auth;
let db;

try {

    app = initializeApp(firebaseConfig);

    auth = getAuth(app);

    db = getDatabase(app);

    console.log("=================================");
    console.log("Firebase initialized successfully");
    console.log("Project:", firebaseConfig.projectId);
    console.log("=================================");

} catch (error) {

    console.error("Firebase initialization error:", error);

    alert(
        "Firebase failed to initialize.\n\n" +
        "Please check your Firebase Web App configuration."
    );
}


// =====================================================
// PAGE ELEMENTS
// =====================================================

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

    loginPage?.classList.remove("hidden");
    registerPage?.classList.add("hidden");
    otpPage?.classList.add("hidden");
    systemPage?.classList.add("hidden");

}


// =====================================================
// SHOW REGISTER
// =====================================================

function showRegister() {

    loginPage?.classList.add("hidden");
    registerPage?.classList.remove("hidden");
    otpPage?.classList.add("hidden");
    systemPage?.classList.add("hidden");

}


// =====================================================
// SHOW SYSTEM
// =====================================================

function showSystem() {

    loginPage?.classList.add("hidden");
    registerPage?.classList.add("hidden");
    otpPage?.classList.add("hidden");
    systemPage?.classList.remove("hidden");

    showPage("dashboard");

    loadUserProfile();
    loadInventory();
    loadDashboard();
    loadActivity();

}


// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail")
                .value
                .trim();

        const password =
            document.getElementById("loginPassword")
                .value;

        const errorBox =
            document.getElementById("loginError");

        const button =
            document.getElementById("loginBtn");


        errorBox.textContent = "";


        if (!email || !password) {

            errorBox.textContent =
                "Please enter your email and password.";

            return;
        }


        button.disabled = true;
        button.textContent = "LOGGING IN...";


        try {

            if (!auth) {
                throw new Error(
                    "Firebase Authentication is not initialized."
                );
            }


            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            console.log(
                "Login successful:",
                user.email
            );


            sessionStorage.setItem(
                "pendingUser",
                JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName:
                        user.displayName || "Staff"
                })
            );


            // Open dashboard
            showSystem();


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            errorBox.textContent =
                getFirebaseError(error);


        } finally {

            button.disabled = false;
            button.textContent = "LOGIN";

        }

    });

}


// =====================================================
// REGISTER
// =====================================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const errorBox =
                document.getElementById(
                    "registerError"
                );


            const button =
                document.getElementById(
                    "registerBtn"
                );


            errorBox.textContent = "";


            if (!name || !email || !password) {

                errorBox.textContent =
                    "Please complete all fields.";

                return;
            }


            if (password !== confirmPassword) {

                errorBox.textContent =
                    "Passwords do not match.";

                return;
            }


            if (password.length < 6) {

                errorBox.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            button.disabled = true;
            button.textContent = "CREATING...";


            try {

                if (!auth) {
                    throw new Error(
                        "Firebase Authentication is not initialized."
                    );
                }


                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                // Save user profile
                await set(
                    ref(
                        db,
                        "users/" + user.uid
                    ),
                    {
                        uid: user.uid,
                        name: name,
                        email: email,
                        role: "staff",
                        createdAt: Date.now()
                    }
                );


                await addActivity(
                    "REGISTER",
                    "New account registered"
                );


                alert(
                    "Registration successful!"
                );


                registerForm.reset();

                showLogin();


            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );

                errorBox.textContent =
                    getFirebaseError(error);


            } finally {

                button.disabled = false;
                button.textContent = "REGISTER";

            }

        }
    );

}


// =====================================================
// REGISTER / LOGIN BUTTONS
// =====================================================

document
    .getElementById("showRegisterBtn")
    ?.addEventListener(
        "click",
        showRegister
    );


document
    .getElementById("showLoginBtn")
    ?.addEventListener(
        "click",
        showLogin
    );


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    ?.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                sessionStorage.clear();

                showLogin();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Logout failed."
                );

            }

        }
    );


// =====================================================
// AUTH STATE
// =====================================================

if (auth) {

    onAuthStateChanged(
        auth,
        (user) => {

            if (user) {

                console.log(
                    "Current Firebase user:",
                    user.email
                );

            } else {

                console.log(
                    "No Firebase user."
                );

            }

        }
    );

}


// =====================================================
// USER PROFILE
// =====================================================

async function loadUserProfile() {

    const user =
        auth?.currentUser;

    if (!user)
        return;


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" + user.uid
                )
            );


        let name =
            user.displayName || "Staff";

        let role =
            "staff";


        if (snapshot.exists()) {

            const data =
                snapshot.val();

            name =
                data.name || name;

            role =
                data.role || role;

        }


        setText(
            "currentUserName",
            name
        );

        setText(
            "userRole",
            role.toUpperCase()
        );

        setText(
            "headerUserName",
            name
        );

        setText(
            "headerUserEmail",
            user.email
        );

        setText(
            "profileName",
            name
        );

        setText(
            "profileEmail",
            user.email
        );

        setText(
            "profileRole",
            role
        );

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }

}


// =====================================================
// ADD / UPDATE PRODUCT
// =====================================================

const productForm =
    document.getElementById("productForm");

if (productForm) {

    productForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const user =
                auth?.currentUser;


            if (!user) {

                alert(
                    "Please login first."
                );

                return;
            }


            const productId =
                document.getElementById(
                    "editingProductId"
                ).value;


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


            if (!name || !sku || !category) {

                showProductMessage(
                    "Please complete all fields.",
                    true
                );

                return;
            }


            if (
                !Number.isFinite(quantity) ||
                quantity < 0
            ) {

                showProductMessage(
                    "Invalid quantity.",
                    true
                );

                return;
            }


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showProductMessage(
                    "Invalid price.",
                    true
                );

                return;
            }


            try {

                const productData = {

                    name,
                    sku,
                    category,
                    quantity,
                    price,

                    lowStockThreshold:
                        Number.isFinite(threshold)
                            ? threshold
                            : 0,

                    updatedAt:
                        Date.now(),

                    updatedBy:
                        user.email

                };


                if (productId) {

                    await set(
                        ref(
                            db,
                            "bakeryProducts/" +
                            productId
                        ),
                        productData
                    );


                    await addActivity(
                        "UPDATE PRODUCT",
                        `Updated ${name}`
                    );


                } else {

                    const newProductRef =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    productData.createdAt =
                        Date.now();

                    productData.createdBy =
                        user.email;


                    await set(
                        newProductRef,
                        productData
                    );


                    await addActivity(
                        "ADD PRODUCT",
                        `Added ${name}`
                    );

                }


                showProductMessage(
                    "Product saved successfully!",
                    false
                );


                productForm.reset();


                document.getElementById(
                    "editingProductId"
                ).value = "";


                document.getElementById(
                    "lowStockThreshold"
                ).value = "5";


                showPage("inventory");


            } catch (error) {

                console.error(
                    "Product error:",
                    error
                );


                showProductMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// =====================================================
// PRODUCT MESSAGE
// =====================================================

function showProductMessage(
    message,
    isError
) {

    const box =
        document.getElementById(
            "productMessage"
        );


    if (!box)
        return;


    box.textContent =
        message;


    box.style.color =
        isError
            ? "#d9534f"
            : "#2e8b57";

}


// =====================================================
// INVENTORY LISTENER
// =====================================================

let inventoryListenerStarted = false;

function loadInventory() {

    const tableBody =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!tableBody)
        return;


    if (inventoryListenerStarted)
        return;


    inventoryListenerStarted = true;


    onValue(
        ref(
            db,
            "bakeryProducts"
        ),
        (snapshot) => {

            tableBody.innerHTML = "";


            if (!snapshot.exists()) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7"
                            style="text-align:center;">
                            No products found.
                        </td>
                    </tr>
                `;

                return;
            }


            const products =
                snapshot.val();


            Object.entries(products)
                .forEach(
                    ([id, product]) => {

                        const quantity =
                            Number(
                                product.quantity || 0
                            );


                        const threshold =
                            Number(
                                product.lowStockThreshold || 0
                            );


                        const isLowStock =
                            quantity <= threshold;


                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${escapeHTML(
                                    product.sku || ""
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    product.name || ""
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    product.category || ""
                                )}
                            </td>

                            <td>
                                ${quantity}
                            </td>

                            <td>
                                ₱${Number(
                                    product.price || 0
                                ).toFixed(2)}
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
                                    class="action-btn edit-btn"
                                    data-id="${id}">
                                    Edit
                                </button>

                                <button
                                    class="action-btn delete-btn"
                                    data-id="${id}">
                                    Delete
                                </button>

                            </td>
                        `;


                        tableBody.appendChild(row);

                    }
                );


            // EDIT
            tableBody
                .querySelectorAll(".edit-btn")
                .forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                const id =
                                    button.dataset.id;

                                editProduct(
                                    id,
                                    products[id]
                                );

                            }
                        );

                    }
                );


            // DELETE
            tableBody
                .querySelectorAll(".delete-btn")
                .forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                const id =
                                    button.dataset.id;

                                deleteProduct(
                                    id,
                                    products[id]
                                );

                            }
                        );

                    }
                );


            filterInventory();

        }
    );

}


// =====================================================
// EDIT PRODUCT
// =====================================================

function editProduct(
    id,
    product
) {

    document.getElementById(
        "editingProductId"
    ).value = id;


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productSKU"
    ).value =
        product.sku || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category || "";


    document.getElementById(
        "productQuantity"
    ).value =
        product.quantity || 0;


    document.getElementById(
        "productPrice"
    ).value =
        product.price || 0;


    document.getElementById(
        "lowStockThreshold"
    ).value =
        product.lowStockThreshold ?? 5;


    setText(
        "productFormTitle",
        "Edit Product"
    );


    showPage("addProduct");

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(
    id,
    product
) {

    const confirmed =
        confirm(
            `Delete ${product.name}?`
        );


    if (!confirmed)
        return;


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" + id
            )
        );


        await addActivity(
            "DELETE PRODUCT",
            `Deleted ${product.name}`
        );


        alert(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Failed to delete product."
        );

    }

}


// =====================================================
// DASHBOARD
// =====================================================

let dashboardListenerStarted = false;

function loadDashboard() {

    if (dashboardListenerStarted)
        return;


    dashboardListenerStarted = true;


    onValue(
        ref(
            db,
            "bakeryProducts"
        ),
        (snapshot) => {

            let totalProducts = 0;
            let totalStock = 0;
            let lowStock = 0;
            let estimatedValue = 0;

            const lowProducts = [];


            if (snapshot.exists()) {

                const products =
                    snapshot.val();


                Object.values(products)
                    .forEach(
                        (product) => {

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
                                    product.lowStockThreshold || 0
                                );


                            totalStock +=
                                quantity;


                            estimatedValue +=
                                quantity * price;


                            if (
                                quantity <= threshold
                            ) {

                                lowStock++;

                                lowProducts.push(
                                    product
                                );

                            }

                        }
                    );

            }


            setText(
                "totalProducts",
                totalProducts
            );


            setText(
                "totalStock",
                totalStock
            );


            setText(
                "lowStock",
                lowStock
            );


            setText(
                "estimatedValue",
                "₱" +
                estimatedValue.toFixed(2)
            );


            const list =
                document.getElementById(
                    "lowStockList"
                );


            if (!list)
                return;


            list.innerHTML = "";


            if (lowProducts.length === 0) {

                list.innerHTML = `
                    <p class="empty-message">
                        No low stock products.
                    </p>
                `;

                return;
            }


            lowProducts.forEach(
                (product) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "list-item";


                    item.innerHTML = `

                        <div>

                            <strong>
                                ${escapeHTML(
                                    product.name || ""
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    product.category || ""
                                )}
                            </small>

                        </div>

                        <strong>
                            Qty:
                            ${Number(
                                product.quantity || 0
                            )}
                        </strong>

                    `;


                    list.appendChild(item);

                }
            );

        }
    );

}


// =====================================================
// ACTIVITY
// =====================================================

async function addActivity(
    action,
    details
) {

    const user =
        auth?.currentUser;


    if (!user)
        return;


    try {

        const activityRef =
            push(
                ref(
                    db,
                    "activityLogs"
                )
            );


        await set(
            activityRef,
            {
                userId:
                    user.uid,

                userName:
                    user.displayName ||
                    "Staff",

                userEmail:
                    user.email,

                action:
                    action,

                details:
                    details,

                timestamp:
                    Date.now()
            }
        );

    } catch (error) {

        console.error(
            "Activity error:",
            error
        );

    }

}


// =====================================================
// LOAD ACTIVITY
// =====================================================

let activityListenerStarted = false;

function loadActivity() {

    const table =
        document.getElementById(
            "activityTableBody"
        );


    if (!table)
        return;


    if (activityListenerStarted)
        return;


    activityListenerStarted = true;


    onValue(
        ref(
            db,
            "activityLogs"
        ),
        (snapshot) => {

            table.innerHTML = "";


            if (!snapshot.exists()) {

                table.innerHTML = `
                    <tr>
                        <td colspan="4"
                            style="text-align:center;">
                            No activity yet.
                        </td>
                    </tr>
                `;

                return;
            }


            const logs =
                Object.values(
                    snapshot.val()
                );


            logs.sort(
                (a, b) =>
                    Number(
                        b.timestamp || 0
                    ) -
                    Number(
                        a.timestamp || 0
                    )
            );


            logs.forEach(
                (log) => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${formatDate(
                                log.timestamp
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                log.userName || ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                log.action || ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                log.details || ""
                            )}
                        </td>

                    `;


                    table.appendChild(row);

                }
            );

        }
    );

}


// =====================================================
// NAVIGATION
// =====================================================

document
    .querySelectorAll("[data-page]")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


function showPage(pageName) {

    const pages = [
        "dashboardPage",
        "inventoryPage",
        "addProductPage",
        "activityPage",
        "usersPage"
    ];


    pages.forEach(
        (pageId) => {

            document
                .getElementById(pageId)
                ?.classList.add("hidden");

        }
    );


    const target =
        document.getElementById(
            pageName + "Page"
        );


    if (target) {

        target.classList.remove(
            "hidden"
        );

    }


    // Change title
    const titles = {
        dashboard: "Dashboard",
        inventory: "Inventory",
        addProduct: "Add Product",
        activity: "Activity Logs",
        users: "My Account"
    };


    setText(
        "pageTitle",
        titles[pageName] || "Dashboard"
    );


    // Active nav button
    document
        .querySelectorAll(".nav-btn")
        .forEach(
            (button) => {

                button.classList.toggle(
                    "active",
                    button.dataset.page === pageName
                );

            }
        );

}


// =====================================================
// ADD PRODUCT BUTTON
// =====================================================

document
    .getElementById("inventoryAddBtn")
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "productForm"
            )?.reset();


            document.getElementById(
                "editingProductId"
            ).value = "";


            setText(
                "productFormTitle",
                "Add Product"
            );


            document.getElementById(
                "lowStockThreshold"
            ).value = "5";


            showPage("addProduct");

        }
    );


// =====================================================
// CANCEL PRODUCT
// =====================================================

document
    .getElementById("cancelProductBtn")
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "productForm"
            )?.reset();


            document.getElementById(
                "editingProductId"
            ).value = "";


            setText(
                "productFormTitle",
                "Add Product"
            );


            showPage("inventory");

        }
    );


// =====================================================
// SEARCH
// =====================================================

document
    .getElementById("searchProduct")
    ?.addEventListener(
        "input",
        filterInventory
    );


document
    .getElementById("categoryFilter")
    ?.addEventListener(
        "change",
        filterInventory
    );


function filterInventory() {

    const search =
        (
            document.getElementById(
                "searchProduct"
            )?.value || ""
        )
        .toLowerCase()
        .trim();


    const category =
        document.getElementById(
            "categoryFilter"
        )?.value || "";


    document
        .querySelectorAll(
            "#inventoryTableBody tr"
        )
        .forEach(
            (row) => {

                const text =
                    row.textContent
                        .toLowerCase();


                const matchesSearch =
                    text.includes(search);


                const matchesCategory =
                    !category ||
                    text.includes(
                        category.toLowerCase()
                    );


                row.style.display =
                    matchesSearch &&
                    matchesCategory
                        ? ""
                        : "none";

            }
        );

}


// =====================================================
// HELPER
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element)
        element.textContent = value;

}


function formatDate(timestamp) {

    if (!timestamp)
        return "-";


    return new Date(
        timestamp
    ).toLocaleString();

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// FIREBASE ERROR
// =====================================================

function getFirebaseError(error) {

    console.error(
        "Firebase error:",
        error.code,
        error.message
    );


    switch (error.code) {

        case "auth/api-key-not-valid":
        case "auth/invalid-api-key":

            return (
                "Firebase API KEY is invalid. " +
                "Check your Firebase Web App configuration."
            );


        case "auth/invalid-email":

            return "Invalid email address.";


        case "auth/invalid-credential":

            return (
                "Incorrect email or password."
            );


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/user-not-found":

            return "Account not found.";


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
                "Too many attempts. Try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Check your internet."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/Password authentication is disabled. " +
                "Enable it in Firebase Authentication."
            );


        case "PERMISSION_DENIED":

            return (
                "Firebase Database permission denied. " +
                "Check your Realtime Database Rules."
            );


        default:

            return (
                error.message ||
                "Firebase error occurred."
            );

    }

}


// =====================================================
// START
// =====================================================

console.log(
    "Arbees Bakery Shop loaded."
);
