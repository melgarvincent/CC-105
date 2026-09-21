// =====================================================
// ARBEES BAKERY SHOP
// FIREBASE AUTH + REALTIME DATABASE
// =====================================================

// Firebase SDK
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
// FIREBASE CONFIGURATION
// =====================================================
//
// IMPORTANT:
// Replace ONLY the values below with the exact config
// from Firebase Console.
//
// Firebase Console
// → Project Settings
// → General
// → Your apps
// → Web App
// → SDK setup and configuration
// → Config
//
// =====================================================

const firebaseConfig = {

    apiKey: "PASTE_YOUR_FIREBASE_API_KEY_HERE",

    authDomain:
        "crudfirebase-b2a1f.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "crudfirebase-b2a1f",

    storageBucket:
        "PASTE_YOUR_STORAGE_BUCKET_HERE",

    messagingSenderId:
        "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",

    appId:
        "PASTE_YOUR_FIREBASE_APP_ID_HERE"
};


// =====================================================
// CHECK CONFIGURATION
// =====================================================

if (
    firebaseConfig.apiKey.includes("PASTE_") ||
    firebaseConfig.projectId.includes("PASTE_") ||
    firebaseConfig.appId.includes("PASTE_")
) {
    console.error(
        "Firebase is not configured. Check script.js."
    );

    alert(
        "Firebase is not configured.\n\n" +
        "Open script.js and paste your real Firebase Web App configuration."
    );
}


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

console.log("Firebase initialized.");
console.log("Firebase Project:", firebaseConfig.projectId);


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
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

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
        button.textContent = "Logging in...";

        try {

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;

            console.log(
                "Login successful:",
                user.email
            );

            // Save login information
            sessionStorage.setItem(
                "pendingUser",
                JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || "Staff"
                })
            );

            // For now, directly open dashboard.
            // If you already have your OTP system,
            // replace this with your OTP function.
            showSystem();

        } catch (error) {

            console.error(error);

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

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const errorBox =
            document.getElementById("registerError");

        const button =
            document.getElementById("registerBtn");

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
        button.textContent = "Creating account...";

        try {

            // Create Firebase account
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            // Save display name
            await updateProfile(user, {
                displayName: name
            });


            // Save user profile in RTDB
            await set(
                ref(db, "users/" + user.uid),
                {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: "staff",
                    createdAt: Date.now()
                }
            );


            // Save activity
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

            console.error(error);

            errorBox.textContent =
                getFirebaseError(error);

        } finally {

            button.disabled = false;
            button.textContent = "REGISTER";
        }

    });

}


// =====================================================
// SHOW LOGIN
// =====================================================

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        showRegister
    );
}


const showLoginBtn =
    document.getElementById("showLoginBtn");

if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );
}


function showRegister() {

    if (loginPage)
        loginPage.classList.add("hidden");

    if (registerPage)
        registerPage.classList.remove("hidden");

    if (otpPage)
        otpPage.classList.add("hidden");

    if (systemPage)
        systemPage.classList.add("hidden");
}


function showLogin() {

    if (registerPage)
        registerPage.classList.add("hidden");

    if (otpPage)
        otpPage.classList.add("hidden");

    if (systemPage)
        systemPage.classList.add("hidden");

    if (loginPage)
        loginPage.classList.remove("hidden");
}


// =====================================================
// SHOW SYSTEM
// =====================================================

function showSystem() {

    if (loginPage)
        loginPage.classList.add("hidden");

    if (registerPage)
        registerPage.classList.add("hidden");

    if (otpPage)
        otpPage.classList.add("hidden");

    if (systemPage)
        systemPage.classList.remove("hidden");

    loadUserProfile();

    loadInventory();

    loadDashboard();

    loadActivity();
}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                sessionStorage.clear();

                showLogin();

            } catch (error) {

                console.error(error);

                alert(
                    "Logout failed."
                );
            }

        }
    );
}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            console.log(
                "Firebase user:",
                user.email
            );

        } else {

            console.log(
                "No Firebase user logged in."
            );

        }

    }
);


// =====================================================
// USER PROFILE
// =====================================================

async function loadUserProfile() {

    const user =
        auth.currentUser;

    if (!user)
        return;

    const userRef =
        ref(db, "users/" + user.uid);

    try {

        const snapshot =
            await get(userRef);

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


        if (currentUserName)
            currentUserName.textContent = name;

        if (userRole)
            userRole.textContent = role;

        if (headerUserName)
            headerUserName.textContent = name;

        if (headerUserEmail)
            headerUserEmail.textContent =
                user.email;

        if (profileName)
            profileName.value = name;

        if (profileEmail)
            profileEmail.value =
                user.email;

        if (profileRole)
            profileRole.value = role;

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );
    }
}


// =====================================================
// ADD PRODUCT
// =====================================================

const productForm =
    document.getElementById("productForm");

if (productForm) {

    productForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const user =
                auth.currentUser;

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
                Number.isNaN(quantity) ||
                quantity < 0
            ) {

                showProductMessage(
                    "Invalid quantity.",
                    true
                );

                return;
            }


            if (
                Number.isNaN(price) ||
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

                    name: name,

                    sku: sku,

                    category: category,

                    quantity: quantity,

                    price: price,

                    lowStockThreshold:
                        threshold || 0,

                    updatedAt: Date.now(),

                    updatedBy:
                        user.email
                };


                let productRef;


                if (productId) {

                    productRef =
                        ref(
                            db,
                            "bakeryProducts/" +
                            productId
                        );

                    await set(
                        productRef,
                        productData
                    );

                    await addActivity(
                        "UPDATE PRODUCT",
                        `Updated ${name}`
                    );

                } else {

                    productRef =
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
                        productRef,
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


                loadInventory();

                loadDashboard();

            } catch (error) {

                console.error(error);

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
    error
) {

    const box =
        document.getElementById(
            "productMessage"
        );

    if (!box)
        return;

    box.textContent = message;

    box.style.color =
        error ? "red" : "green";
}


// =====================================================
// LOAD INVENTORY
// =====================================================

function loadInventory() {

    const tableBody =
        document.getElementById(
            "inventoryTableBody"
        );

    if (!tableBody)
        return;


    const productsRef =
        ref(
            db,
            "bakeryProducts"
        );


    onValue(
        productsRef,
        (snapshot) => {

            tableBody.innerHTML = "";

            if (!snapshot.exists()) {

                tableBody.innerHTML =
                    `
                    <tr>
                        <td colspan="7">
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

                        const low =
                            Number(product.quantity)
                            <=
                            Number(
                                product.lowStockThreshold || 0
                            );


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
                                ${product.quantity || 0}
                            </td>

                            <td>
                                ₱${Number(
                                    product.price || 0
                                ).toFixed(2)}
                            </td>

                            <td>
                                <span class="${
                                    low
                                    ? "low-stock"
                                    : "in-stock"
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
                                    class="edit-btn"
                                    data-id="${id}">
                                    Edit
                                </button>

                                <button
                                    class="delete-btn"
                                    data-id="${id}">
                                    Delete
                                </button>

                            </td>
                        `;


                        tableBody.appendChild(
                            row
                        );

                    }
                );


            // Edit buttons
            document
                .querySelectorAll(".edit-btn")
                .forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                editProduct(
                                    button.dataset.id,
                                    products[
                                        button.dataset.id
                                    ]
                                );

                            }
                        );

                    }
                );


            // Delete buttons
            document
                .querySelectorAll(".delete-btn")
                .forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                deleteProduct(
                                    button.dataset.id,
                                    products[
                                        button.dataset.id
                                    ]
                                );

                            }
                        );

                    }
                );

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

    const editing =
        document.getElementById(
            "editingProductId"
        );

    const name =
        document.getElementById(
            "productName"
        );

    const sku =
        document.getElementById(
            "productSKU"
        );

    const category =
        document.getElementById(
            "productCategory"
        );

    const quantity =
        document.getElementById(
            "productQuantity"
        );

    const price =
        document.getElementById(
            "productPrice"
        );

    const threshold =
        document.getElementById(
            "lowStockThreshold"
        );


    if (editing)
        editing.value = id;

    if (name)
        name.value = product.name || "";

    if (sku)
        sku.value = product.sku || "";

    if (category)
        category.value =
            product.category || "";

    if (quantity)
        quantity.value =
            product.quantity || 0;

    if (price)
        price.value =
            product.price || 0;

    if (threshold)
        threshold.value =
            product.lowStockThreshold || 0;


    showPage("addProduct");

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(
    id,
    product
) {

    const confirmDelete =
        confirm(
            `Delete ${product.name}?`
        );

    if (!confirmDelete)
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


        loadDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete product."
        );
    }
}


// =====================================================
// DASHBOARD
// =====================================================

function loadDashboard() {

    const productsRef =
        ref(
            db,
            "bakeryProducts"
        );


    onValue(
        productsRef,
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


            if (list) {

                list.innerHTML = "";

                if (
                    lowProducts.length === 0
                ) {

                    list.innerHTML =
                        "<p>No low-stock products.</p>";

                } else {

                    lowProducts
                        .forEach(
                            (product) => {

                                const item =
                                    document.createElement(
                                        "div"
                                    );

                                item.innerHTML = `
                                    <strong>
                                        ${escapeHTML(
                                            product.name
                                        )}
                                    </strong>
                                    <span>
                                        Qty:
                                        ${
                                            product.quantity
                                        }
                                    </span>
                                `;

                                list.appendChild(
                                    item
                                );

                            }
                        );
                }
            }

        }
    );
}


// =====================================================
// ACTIVITY LOG
// =====================================================

async function addActivity(
    action,
    details
) {

    const user =
        auth.currentUser;

    if (!user)
        return;


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
                user.displayName || "Staff",

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
}


// =====================================================
// LOAD ACTIVITY
// =====================================================

function loadActivity() {

    const table =
        document.getElementById(
            "activityTableBody"
        );

    if (!table)
        return;


    onValue(
        ref(db, "activityLogs"),
        (snapshot) => {

            table.innerHTML = "";


            if (!snapshot.exists()) {

                table.innerHTML =
                    `
                    <tr>
                        <td colspan="5">
                            No activity yet.
                        </td>
                    </tr>
                    `;

                return;
            }


            const logs =
                Object.values(
                    snapshot.val()
                )
                .sort(
                    (a, b) =>
                        Number(b.timestamp || 0)
                        -
                        Number(a.timestamp || 0)
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


                    table.appendChild(
                        row
                    );

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


function showPage(
    pageName
) {

    document
        .querySelectorAll(
            ".system-section"
        )
        .forEach(
            (section) => {

                section.classList.add(
                    "hidden"
                );

            }
        );


    const page =
        document.getElementById(
            pageName + "Page"
        );


    if (page) {

        page.classList.remove(
            "hidden"
        );
    }
}


// =====================================================
// CANCEL PRODUCT
// =====================================================

const cancelProductBtn =
    document.getElementById(
        "cancelProductBtn"
    );

if (cancelProductBtn) {

    cancelProductBtn.addEventListener(
        "click",
        () => {

            const form =
                document.getElementById(
                    "productForm"
                );

            if (form)
                form.reset();


            const editing =
                document.getElementById(
                    "editingProductId"
                );

            if (editing)
                editing.value = "";


            showPage("inventory");

        }
    );
}


// =====================================================
// SEARCH PRODUCT
// =====================================================

const searchProduct =
    document.getElementById(
        "searchProduct"
    );

if (searchProduct) {

    searchProduct.addEventListener(
        "input",
        filterInventory
    );
}


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterInventory
    );
}


function filterInventory() {

    const search =
        (
            document.getElementById(
                "searchProduct"
            )?.value || ""
        ).toLowerCase();


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
                    row.textContent.toLowerCase();


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
// HELPER FUNCTIONS
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


function formatDate(
    timestamp
) {

    if (!timestamp)
        return "";

    return new Date(
        timestamp
    ).toLocaleString();
}


function escapeHTML(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// FIREBASE ERROR HANDLER
// =====================================================

function getFirebaseError(
    error
) {

    console.error(
        "Firebase error:",
        error.code,
        error.message
    );


    switch (error.code) {

        case "auth/api-key-not-valid":
        case "auth/invalid-api-key":

            return (
                "Firebase API key is invalid. " +
                "Please check firebaseConfig in script.js."
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
                "Too many attempts. Please try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Check your internet connection."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/Password login is not enabled in Firebase Authentication."
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
