/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
=====================================================

   IMPORTANT:
   Replace ALL YOUR_... values with your actual
   Firebase Web App configuration.
===================================================== */

const firebaseConfig = {

    apiKey:
        "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT_ID.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_STORAGE_BUCKET",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


/* =====================================================
   GOOGLE APPS SCRIPT OTP URL
===================================================== */

const OTP_API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentUser = null;

let otpExpiresAt = 0;

let products = {};

let editingProductId = null;


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");


/* =====================================================
   PAGE SWITCH
===================================================== */

function showAuthPage(page) {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");

    page.classList.remove("hidden");
}


function showSystem() {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.remove("hidden");
}


/* =====================================================
   LOGIN / REGISTER SWITCH
===================================================== */

document
    .getElementById("showRegister")
    .addEventListener("click", () => {

        document.getElementById(
            "registerError"
        ).textContent = "";

        showAuthPage(registerPage);
    });


document
    .getElementById("showLogin")
    .addEventListener("click", () => {

        document.getElementById(
            "loginError"
        ).textContent = "";

        showAuthPage(loginPage);
    });


/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const error =
                document.getElementById(
                    "registerError"
                );

            const button =
                document.getElementById(
                    "registerBtn"
                );

            error.textContent = "";

            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();

            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim()
                .toLowerCase();

            const password =
                document.getElementById(
                    "registerPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


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


            button.disabled = true;

            button.textContent =
                "Creating Account...";


            try {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                /* Save user information */

                await set(
                    ref(
                        db,
                        "users/" + user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        name:
                            name,

                        email:
                            email,

                        role:
                            "staff",

                        createdAt:
                            new Date()
                                .toISOString()
                    }
                );


                await logActivity(
                    "Register",
                    "New account created"
                );


                await signOut(auth);


                document
                    .getElementById(
                        "registerForm"
                    )
                    .reset();


                alert(
                    "Registration successful! You can now login."
                );


                showAuthPage(loginPage);

            }
            catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );


                errorMessage(
                    error,
                    error
                );

            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Register";
            }

        }
    );


/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const errorBox =
                document.getElementById(
                    "loginError"
                );

            const button =
                document.getElementById(
                    "loginBtn"
                );

            errorBox.textContent = "";

            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim()
                .toLowerCase();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            button.disabled = true;

            button.textContent =
                "Checking...";


            try {

                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                currentUser =
                    result.user;


                document
                    .getElementById(
                        "otpEmail"
                    )
                    .textContent =
                    currentUser.email;


                document
                    .getElementById(
                        "otpInput"
                    )
                    .value = "";


                showAuthPage(otpPage);


                await sendOTP(
                    currentUser.email
                );

            }
            catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                errorBox.textContent =
                    firebaseError(
                        error
                    );

            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Login";
            }

        }
    );


/* =====================================================
   SEND OTP
===================================================== */

async function sendOTP(email) {

    const message =
        document.getElementById(
            "otpMessage"
        );

    const errorBox =
        document.getElementById(
            "otpError"
        );


    message.textContent = "";

    errorBox.textContent = "";


    if (
        OTP_API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

        errorBox.textContent =
            "OTP service is not configured. Add your Apps Script /exec URL.";

        return;
    }


    message.textContent =
        "Sending OTP to your Gmail...";


    try {

        const response =
            await fetch(
                OTP_API_URL,
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            action:
                                "sendOTP",

                            email:
                                email

                        })
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to send OTP."
            );
        }


        otpExpiresAt =
            Date.now() +
            (
                5 *
                60 *
                1000
            );


        message.textContent =
            "OTP sent! Check your Gmail Inbox or Spam.";

    }
    catch (error) {

        console.error(
            "OTP ERROR:",
            error
        );


        message.textContent = "";

        errorBox.textContent =
            error.message ||
            "Unable to send OTP.";
    }
}


/* =====================================================
   VERIFY OTP
===================================================== */

document
    .getElementById("otpForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const code =
                document.getElementById(
                    "otpInput"
                ).value.trim();

            const errorBox =
                document.getElementById(
                    "otpError"
                );

            const message =
                document.getElementById(
                    "otpMessage"
                );

            const button =
                document.getElementById(
                    "verifyOtpBtn"
                );


            errorBox.textContent = "";

            message.textContent = "";


            if (
                !/^\d{6}$/.test(code)
            ) {

                errorBox.textContent =
                    "Enter exactly 6 numbers.";

                return;
            }


            if (
                Date.now() >
                otpExpiresAt
            ) {

                errorBox.textContent =
                    "OTP expired. Please resend OTP.";

                return;
            }


            if (!currentUser) {

                errorBox.textContent =
                    "Login session expired.";

                return;
            }


            button.disabled = true;

            button.textContent =
                "Verifying...";


            try {

                const response =
                    await fetch(
                        OTP_API_URL,
                        {

                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body:
                                JSON.stringify({

                                    action:
                                        "verifyOTP",

                                    email:
                                        currentUser.email,

                                    code:
                                        code

                                })
                        }
                    );


                const result =
                    await response.json();


                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "Invalid OTP."
                    );
                }


                message.textContent =
                    "OTP verified!";


                sessionStorage.setItem(
                    "otpVerified",
                    "true"
                );


                await loadUserProfile();

                await loadProducts();

                await loadActivities();


                showSystem();


                openPage(
                    "dashboard"
                );

            }
            catch (error) {

                console.error(
                    "VERIFY OTP ERROR:",
                    error
                );


                errorBox.textContent =
                    error.message ||
                    "Invalid OTP.";
            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Verify OTP";
            }

        }
    );


/* =====================================================
   RESEND OTP
===================================================== */

document
    .getElementById("resendOtp")
    .addEventListener(
        "click",
        async () => {

            if (currentUser) {

                await sendOTP(
                    currentUser.email
                );
            }
        }
    );


/* =====================================================
   BACK LOGIN
===================================================== */

document
    .getElementById("backLogin")
    .addEventListener(
        "click",
        async () => {

            currentUser = null;

            sessionStorage.removeItem(
                "otpVerified"
            );

            await signOut(auth);

            showAuthPage(loginPage);
        }
    );


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    button.dataset.page
                );

            }
        );

    });


document
    .querySelectorAll("[data-page]")
    .forEach(button => {

        if (
            !button.classList.contains(
                "nav-btn"
            )
        ) {

            button.addEventListener(
                "click",
                () => {

                    openPage(
                        button.dataset.page
                    );

                }
            );
        }

    });


function openPage(pageName) {

    const pages = [
        "dashboard",
        "inventory",
        "addProduct",
        "activity",
        "users"
    ];


    pages.forEach(page => {

        const element =
            document.getElementById(
                page + "Page"
            );

        if (element) {

            element.classList.add(
                "hidden"
            );
        }

    });


    const selected =
        document.getElementById(
            pageName + "Page"
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );
    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === pageName
            );

        });


    const titles = {

        dashboard: [
            "Dashboard",
            "Overview of your bakery inventory"
        ],

        inventory: [
            "Inventory",
            "Manage bakery products and stock"
        ],

        addProduct: [
            "Add Product",
            "Add or edit bakery products"
        ],

        activity: [
            "Activity Logs",
            "View recent system activities"
        ],

        users: [
            "My Account",
            "Account information"
        ]

    };


    if (titles[pageName]) {

        document
            .getElementById(
                "pageTitle"
            )
            .textContent =
            titles[pageName][0];


        document
            .getElementById(
                "pageSubtitle"
            )
            .textContent =
            titles[pageName][1];
    }


    if (
        pageName === "inventory"
    ) {

        renderInventory();
    }


    if (
        pageName === "dashboard"
    ) {

        updateDashboard();
    }


    if (
        pageName === "activity"
    ) {

        renderActivities();
    }

}


/* =====================================================
   ADD PRODUCT BUTTON
===================================================== */

document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        () => {

            resetProductForm();

            openPage(
                "addProduct"
            );
        }
    );


/* =====================================================
   CANCEL PRODUCT
===================================================== */

document
    .getElementById("cancelProductBtn")
    .addEventListener(
        "click",
        () => {

            resetProductForm();

            openPage(
                "inventory"
            );
        }
    );


/* =====================================================
   PRODUCT FORM
===================================================== */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

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


            const button =
                document.getElementById(
                    "saveProductBtn"
                );


            if (
                !name ||
                !sku ||
                !category
            ) {

                message.textContent =
                    "Please complete all required fields.";

                return;
            }


            if (
                quantity < 0 ||
                price < 0 ||
                threshold < 0
            ) {

                message.textContent =
                    "Values cannot be negative.";

                return;
            }


            button.disabled = true;

            button.textContent =
                "Saving...";


            try {

                const existingId =
                    document.getElementById(
                        "editProductId"
                    ).value;


                const productData = {

                    name:
                        name,

                    sku:
                        sku,

                    category:
                        category,

                    quantity:
                        quantity,

                    price:
                        price,

                    threshold:
                        threshold,

                    updatedAt:
                        new Date()
                            .toISOString(),

                    updatedBy:
                        currentUser.email
                };


                if (existingId) {

                    await update(
                        ref(
                            db,
                            "bakeryProducts/" +
                            existingId
                        ),
                        productData
                    );


                    await logActivity(
                        "Update Product",
                        `${name} was updated.`
                    );

                }
                else {

                    const newRef =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    productData.createdAt =
                        new Date()
                            .toISOString();


                    productData.createdBy =
                        currentUser.email;


                    await set(
                        newRef,
                        productData
                    );


                    await logActivity(
                        "Add Product",
                        `${name} was added.`
                    );
                }


                message.textContent =
                    "Product saved successfully.";


                await loadProducts();

                resetProductForm();


                setTimeout(
                    () => {

                        openPage(
                            "inventory"
                        );

                    },
                    500
                );

            }
            catch (error) {

                console.error(
                    "PRODUCT ERROR:",
                    error
                );


                message.textContent =
                    "Unable to save product. Check Firebase Database Rules.";
            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "Save Product";
            }

        }
    );


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "bakeryProducts"
                )
            );


        products =
            snapshot.exists()
                ? snapshot.val()
                : {};


        renderInventory();

        updateDashboard();

    }
    catch (error) {

        console.error(
            "LOAD PRODUCTS ERROR:",
            error
        );

        products = {};
    }
}


/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    const search =
        document.getElementById(
            "searchProduct"
        ).value
        .trim()
        .toLowerCase();


    const category =
        document.getElementById(
            "categoryFilter"
        ).value;


    tbody.innerHTML = "";


    const list =
        Object.entries(products)
        .filter(
            ([id, product]) => {

                const matchesSearch =
                    !search ||
                    String(
                        product.name || ""
                    )
                    .toLowerCase()
                    .includes(search) ||

                    String(
                        product.sku || ""
                    )
                    .toLowerCase()
                    .includes(search);


                const matchesCategory =
                    category === "all" ||
                    product.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );


    if (list.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >
                    No products found.
                </td>

            </tr>

        `;

        return;
    }


    list.forEach(
        ([id, product]) => {

            const quantity =
                Number(
                    product.quantity
                ) || 0;


            const threshold =
                Number(
                    product.threshold
                ) || 0;


            const price =
                Number(
                    product.price
                ) || 0;


            const low =
                quantity <= threshold;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(
                            product.name || ""
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        product.sku || ""
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
                    ₱${price.toFixed(2)}
                </td>

                <td>

                    <span
                        class="status ${
                            low
                                ? "low-stock"
                                : "in-stock"
                        }"
                    >

                        ${
                            low
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }

                    </span>

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
   SEARCH
===================================================== */

document
    .getElementById("searchProduct")
    .addEventListener(
        "input",
        renderInventory
    );


document
    .getElementById("categoryFilter")
    .addEventListener(
        "change",
        renderInventory
    );


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(id) {

    const product =
        products[id];


    if (!product) {
        return;
    }


    document
        .getElementById(
            "editProductId"
        )
        .value = id;


    document
        .getElementById(
            "productName"
        )
        .value =
        product.name || "";


    document
        .getElementById(
            "productSKU"
        )
        .value =
        product.sku || "";


    document
        .getElementById(
            "productCategory"
        )
        .value =
        product.category || "";


    document
        .getElementById(
            "productQuantity"
        )
        .value =
        product.quantity || 0;


    document
        .getElementById(
            "productPrice"
        )
        .value =
        product.price || 0;


    document
        .getElementById(
            "lowStockThreshold"
        )
        .value =
        product.threshold ?? 5;


    document
        .getElementById(
            "productFormTitle"
        )
        .textContent =
        "Edit Product";


    document
        .getElementById(
            "productMessage"
        )
        .textContent = "";


    openPage(
        "addProduct"
    );
}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    const product =
        products[id];


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                "bakeryProducts/" +
                id
            )
        );


        await logActivity(
            "Delete Product",
            `${product.name} was deleted.`
        );


        await loadProducts();


        alert(
            "Product deleted successfully."
        );

    }
    catch (error) {

        console.error(
            error
        );


        alert(
            "Unable to delete product."
        );
    }
}


/* =====================================================
   RESET PRODUCT FORM
===================================================== */

function resetProductForm() {

    document
        .getElementById(
            "productForm"
        )
        .reset();


    document
        .getElementById(
            "editProductId"
        )
        .value = "";


    document
        .getElementById(
            "lowStockThreshold"
        )
        .value = 5;


    document
        .getElementById(
            "productFormTitle"
        )
        .textContent =
        "Add New Product";


    document
        .getElementById(
            "productMessage"
        )
        .textContent = "";
}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    const list =
        Object.values(products);


    let totalProducts =
        list.length;


    let totalStock =
        0;


    let lowStock =
        0;


    let estimatedValue =
        0;


    const lowProducts = [];


    list.forEach(
        product => {

            const quantity =
                Number(
                    product.quantity
                ) || 0;


            const price =
                Number(
                    product.price
                ) || 0;


            const threshold =
                Number(
                    product.threshold
                ) || 5;


            totalStock +=
                quantity;


            estimatedValue +=
                quantity * price;


            if (
                quantity <=
                threshold
            ) {

                lowStock++;

                lowProducts.push(
                    product
                );
            }

        }
    );


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
        lowStock;


    document
        .getElementById(
            "estimatedValue"
        )
        .textContent =
        "₱" +
        estimatedValue.toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2
            }
        );


    const box =
        document.getElementById(
            "lowStockList"
        );


    if (lowProducts.length === 0) {

        box.innerHTML =
            `<p class="empty">
                No low stock products.
            </p>`;

    }
    else {

        box.innerHTML =
            lowProducts
                .map(
                    product => `

                        <div class="low-stock-item">

                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>

                            <small>
                                Stock:
                                ${product.quantity}
                            </small>

                        </div>

                    `
                )
                .join("");
    }

}


/* =====================================================
   LOAD USER PROFILE
===================================================== */

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }


    let name =
        currentUser.displayName ||
        "Staff";


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );


        if (
            snapshot.exists()
        ) {

            const user =
                snapshot.val();


            name =
                user.name ||
                name;


            document
                .getElementById(
                    "profileRole"
                )
                .textContent =
                user.role || "Staff";
        }

    }
    catch (error) {

        console.error(
            error
        );
    }


    document
        .getElementById(
            "headerUserName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "headerUserEmail"
        )
        .textContent =
        currentUser.email;


    document
        .getElementById(
            "profileName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "profileEmail"
        )
        .textContent =
        currentUser.email;


    document
        .querySelector(
            ".user-avatar"
        )
        .textContent =
        name
            .charAt(0)
            .toUpperCase();


    document
        .querySelector(
            ".account-avatar"
        )
        .textContent =
        name
            .charAt(0)
            .toUpperCase();
}


/* =====================================================
   ACTIVITY LOG
===================================================== */

async function logActivity(
    action,
    details
) {

    if (!currentUser) {
        return;
    }


    try {

        const newActivity =
            push(
                ref(
                    db,
                    "activityLogs"
                )
            );


        await set(
            newActivity,
            {

                user:
                    currentUser.email,

                action:
                    action,

                details:
                    details,

                timestamp:
                    new Date()
                        .toISOString()

            }
        );

    }
    catch (error) {

        console.error(
            "ACTIVITY ERROR:",
            error
        );
    }
}


/* =====================================================
   LOAD ACTIVITIES
===================================================== */

async function loadActivities() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "activityLogs"
                )
            );


        if (
            !snapshot.exists()
        ) {

            renderActivities(
                {}
            );

            return;
        }


        const data =
            snapshot.val();


        renderActivities(
            data
        );

    }
    catch (error) {

        console.error(
            error
        );
    }
}


/* =====================================================
   RENDER ACTIVITIES
===================================================== */

function renderActivities(
    data = null
) {

    const tbody =
        document.getElementById(
            "activityTableBody"
        );


    const source =
        data || {};


    const entries =
        Object.values(
            source
        )
        .sort(
            (a, b) =>
                new Date(
                    b.timestamp
                ) -
                new Date(
                    a.timestamp
                )
        );


    tbody.innerHTML = "";


    if (
        entries.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    No activity yet.
                </td>

            </tr>

        `;

        return;
    }


    entries
        .slice(0, 50)
        .forEach(
            activity => {

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
                            activity.user || ""
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                activity.action || ""
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            activity.details || ""
                        )}
                    </td>

                `;


                tbody.appendChild(row);
            }
        );


    const recent =
        entries.slice(0, 5);


    const recentBox =
        document.getElementById(
            "recentActivity"
        );


    if (
        recent.length === 0
    ) {

        recentBox.innerHTML =
            `<p class="empty">
                No activity yet.
            </p>`;

        return;
    }


    recentBox.innerHTML =
        recent
            .map(
                activity => `

                    <div class="low-stock-item">

                        <strong>
                            ${escapeHTML(
                                activity.action
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                activity.details
                            )}
                        </small>

                    </div>

                `
            )
            .join("");
}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            try {

                if (currentUser) {

                    await logActivity(
                        "Logout",
                        "User logged out."
                    );
                }


                await signOut(auth);


                currentUser = null;


                products = {};


                sessionStorage.removeItem(
                    "otpVerified"
                );


                document
                    .getElementById(
                        "loginForm"
                    )
                    .reset();


                showAuthPage(
                    loginPage
                );

            }
            catch (error) {

                console.error(
                    error
                );
            }
        }
    );


/* =====================================================
   FIREBASE ERROR MESSAGE
===================================================== */

function firebaseError(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/invalid-login-credentials":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many login attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Internet connection problem.";

        default:
            return (
                error?.message ||
                "Authentication failed."
            );
    }
}


/* =====================================================
   ERROR BOX HELPER
===================================================== */

function errorMessage(
    error,
    target
) {

    target.textContent =
        firebaseError(
            error
        );
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }


    return new Date(
        date
    ).toLocaleString(
        "en-PH"
    );
}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =====================================================
   START
===================================================== */

showAuthPage(
    loginPage
);
