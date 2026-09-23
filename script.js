/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

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


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =====================================================
   AUTH ELEMENTS
===================================================== */

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


const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");


const loginBtn =
    document.getElementById("loginBtn");

const registerBtn =
    document.getElementById("registerBtn");


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

    loginPage.classList.remove("hidden");

    registerPage.classList.add("hidden");

    systemPage.classList.add("hidden");

    loginMessage.textContent = "";

    registerMessage.textContent = "";
}


/* =====================================================
   SHOW REGISTER
===================================================== */

function showRegister() {

    loginPage.classList.add("hidden");

    registerPage.classList.remove("hidden");

    systemPage.classList.add("hidden");

    loginMessage.textContent = "";

    registerMessage.textContent = "";
}


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            showMessage(
                loginMessage,
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent =
            "Logging in...";


        try {

            const result =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            console.log(
                "Login successful:",
                result.user.uid
            );


            showMessage(
                loginMessage,
                "Login successful!",
                "success"
            );

        }

        catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            showMessage(
                loginMessage,
                firebaseError(error),
                "error"
            );

        }

        finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "Login";

        }

    }
);


/* =====================================================
   REGISTER
===================================================== */

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
                .trim();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        if (!name) {

            showMessage(
                registerMessage,
                "Please enter your full name.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                registerMessage,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }


        if (password !== confirmPassword) {

            showMessage(
                registerMessage,
                "Passwords do not match.",
                "error"
            );

            return;
        }


        registerBtn.disabled = true;

        registerBtn.textContent =
            "Creating account...";


        try {

            /* CREATE FIREBASE AUTH ACCOUNT */

            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            /* SAVE NAME IN FIREBASE AUTH */

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            /* SAVE PROFILE IN REALTIME DATABASE */

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

                    createdAt:
                        new Date().toISOString()

                }
            );


            /* SAVE ACTIVITY */

            await addActivity(
                "New account registered",
                email
            );


            showMessage(
                registerMessage,
                "Registration successful!",
                "success"
            );


            registerForm.reset();


            /*
             * Firebase automatically signs in
             * the newly created account.
             */

        }

        catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            showMessage(
                registerMessage,
                firebaseError(error),
                "error"
            );

        }

        finally {

            registerBtn.disabled = false;

            registerBtn.textContent =
                "Register";

        }

    }
);


/* =====================================================
   FORGOT PASSWORD
===================================================== */

document
    .getElementById("forgotPassword")
    .addEventListener(
        "click",
        async function () {

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            if (!email) {

                showMessage(
                    loginMessage,
                    "Enter your email first.",
                    "error"
                );

                document
                    .getElementById("loginEmail")
                    .focus();

                return;
            }


            try {

                showMessage(
                    loginMessage,
                    "Sending password reset email...",
                    "normal"
                );


                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    loginMessage,
                    "Password reset email sent! Check your inbox.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    "PASSWORD RESET ERROR:",
                    error
                );


                showMessage(
                    loginMessage,
                    firebaseError(error),
                    "error"
                );

            }

        }
    );


/* =====================================================
   LOGIN / REGISTER SWITCH
===================================================== */

document
    .getElementById("showRegister")
    .addEventListener(
        "click",
        showRegister
    );


document
    .getElementById("showLogin")
    .addEventListener(
        "click",
        showLogin
    );


/* =====================================================
   FIREBASE AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async function (user) {

        if (user) {

            console.log(
                "USER LOGGED IN:",
                user.email
            );


            await loadUserProfile(user);

            showSystem();

            loadInventory();

            loadActivity();

        }

        else {

            console.log(
                "NO USER LOGGED IN"
            );

            showLogin();

        }

    }
);


/* =====================================================
   SHOW SYSTEM
===================================================== */

function showSystem() {

    loginPage.classList.add("hidden");

    registerPage.classList.add("hidden");

    systemPage.classList.remove("hidden");
}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async function () {

            try {

                await signOut(auth);

                showLogin();

            }

            catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );


/* =====================================================
   LOAD USER PROFILE
===================================================== */

async function loadUserProfile(user) {

    const name =
        user.displayName ||
        "Staff";


    document
        .getElementById("userName")
        .textContent =
        name;


    document
        .getElementById("userEmail")
        .textContent =
        user.email || "";

}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

const navButtons =
    document.querySelectorAll(".nav-btn");


navButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const page =
                    button.dataset.page;


                showPage(page);


                navButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );

            }
        );

    }
);


function showPage(page) {

    const pages =
        document.querySelectorAll(
            ".content-page"
        );


    pages.forEach(
        p =>
            p.classList.add("hidden")
    );


    const target =
        document.getElementById(
            page + "Page"
        );


    if (target) {

        target.classList.remove("hidden");

    }

}


/* =====================================================
   ADD PRODUCT BUTTONS
===================================================== */

document
    .getElementById("dashboardAddBtn")
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            showPage("addProduct");

            setActiveNav("addProduct");

        }
    );


document
    .getElementById("inventoryAddBtn")
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            showPage("addProduct");

            setActiveNav("addProduct");

        }
    );


document
    .getElementById("cancelProduct")
    .addEventListener(
        "click",
        function () {

            resetProductForm();

            showPage("inventory");

            setActiveNav("inventory");

        }
    );


function setActiveNav(page) {

    navButtons.forEach(
        btn =>
            btn.classList.remove("active")
    );


    const button =
        document.querySelector(
            `.nav-btn[data-page="${page}"]`
        );


    if (button) {

        button.classList.add("active");

    }

}


/* =====================================================
   PRODUCT FORM
===================================================== */

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const user =
                auth.currentUser;


            if (!user) {

                alert(
                    "Please login first."
                );

                return;
            }


            const id =
                document
                    .getElementById(
                        "editProductId"
                    )
                    .value;


            const product = {

                sku:
                    document
                        .getElementById(
                            "productSku"
                        )
                        .value
                        .trim(),

                name:
                    document
                        .getElementById(
                            "productName"
                        )
                        .value
                        .trim(),

                category:
                    document
                        .getElementById(
                            "productCategory"
                        )
                        .value,

                quantity:
                    Number(
                        document
                            .getElementById(
                                "productQuantity"
                            )
                            .value
                    ),

                price:
                    Number(
                        document
                            .getElementById(
                                "productPrice"
                            )
                            .value
                    ),

                threshold:
                    Number(
                        document
                            .getElementById(
                                "productThreshold"
                            )
                            .value
                    ),

                updatedAt:
                    new Date().toISOString()

            };


            try {

                if (id) {

                    await update(
                        ref(
                            db,
                            "bakeryProducts/" + id
                        ),
                        product
                    );


                    await addActivity(
                        "Product updated",
                        user.email
                    );

                }

                else {

                    const productRef =
                        push(
                            ref(
                                db,
                                "bakeryProducts"
                            )
                        );


                    await set(
                        productRef,
                        {
                            ...product,

                            createdAt:
                                new Date().toISOString()
                        }
                    );


                    await addActivity(
                        "Product added",
                        user.email
                    );

                }


                alert(
                    "Product saved successfully!"
                );


                resetProductForm();

                showPage("inventory");

                setActiveNav("inventory");

            }

            catch (error) {

                console.error(
                    "PRODUCT ERROR:",
                    error
                );


                alert(
                    "Failed to save product."
                );

            }

        }
    );


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
            "productFormTitle"
        )
        .textContent =
        "Add Product";

}


/* =====================================================
   LOAD INVENTORY
===================================================== */

function loadInventory() {

    const productsRef =
        ref(
            db,
            "bakeryProducts"
        );


    onValue(
        productsRef,
        function (snapshot) {

            const data =
                snapshot.val() || {};


            const table =
                document.getElementById(
                    "inventoryTable"
                );


            table.innerHTML = "";


            let totalProducts = 0;

            let totalStock = 0;

            let lowStock = 0;

            let totalValue = 0;


            Object.entries(data)
                .forEach(
                    ([id, product]) => {

                        totalProducts++;


                        const quantity =
                            Number(
                                product.quantity || 0
                            );


                        const threshold =
                            Number(
                                product.threshold || 0
                            );


                        const price =
                            Number(
                                product.price || 0
                            );


                        totalStock += quantity;


                        const isLow =
                            quantity <= threshold;


                        if (isLow) {

                            lowStock++;

                        }


                        totalValue +=
                            quantity * price;


                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${escapeHtml(
                                    product.sku || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    product.name || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
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

                                <span class="status ${
                                    isLow
                                        ? "low"
                                        : "in"
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
                                    class="action-btn edit-btn"
                                    onclick="editProduct('${id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    class="action-btn delete-btn"
                                    onclick="deleteProduct('${id}')"
                                >
                                    Delete
                                </button>

                            </td>

                        `;


                        table.appendChild(row);

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
                    "totalValue"
                )
                .textContent =
                "₱" +
                totalValue.toFixed(2);


            filterInventory();

        }
    );

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

window.editProduct =
    function (id) {

        const productRef =
            ref(
                db,
                "bakeryProducts/" + id
            );


        onValue(
            productRef,
            function (snapshot) {

                const product =
                    snapshot.val();


                if (!product) {

                    alert(
                        "Product not found."
                    );

                    return;
                }


                document
                    .getElementById(
                        "editProductId"
                    )
                    .value =
                    id;


                document
                    .getElementById(
                        "productSku"
                    )
                    .value =
                    product.sku || "";


                document
                    .getElementById(
                        "productName"
                    )
                    .value =
                    product.name || "";


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
                        "productThreshold"
                    )
                    .value =
                    product.threshold || 0;


                document
                    .getElementById(
                        "productFormTitle"
                    )
                    .textContent =
                    "Edit Product";


                showPage("addProduct");

                setActiveNav("addProduct");

            },
            {
                onlyOnce: true
            }
        );

    };


/* =====================================================
   DELETE PRODUCT
===================================================== */

window.deleteProduct =
    async function (id) {

        const answer =
            confirm(
                "Are you sure you want to delete this product?"
            );


        if (!answer) {

            return;

        }


        try {

            await remove(
                ref(
                    db,
                    "bakeryProducts/" + id
                )
            );


            const user =
                auth.currentUser;


            await addActivity(
                "Product deleted",
                user
                    ? user.email
                    : "Unknown"
            );


            alert(
                "Product deleted successfully!"
            );

        }

        catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            alert(
                "Failed to delete product."
            );

        }

    };


/* =====================================================
   ACTIVITY LOG
===================================================== */

async function addActivity(
    action,
    email
) {

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

                action:
                    action,

                email:
                    email || "Unknown",

                createdAt:
                    new Date().toISOString()

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
   LOAD ACTIVITY
===================================================== */

function loadActivity() {

    const activityRef =
        ref(
            db,
            "activityLogs"
        );


    onValue(
        activityRef,
        function (snapshot) {

            const data =
                snapshot.val() || {};


            const table =
                document.getElementById(
                    "activityTable"
                );


            table.innerHTML = "";


            const activities =
                Object.entries(data)
                    .reverse()
                    .slice(0, 50);


            activities.forEach(
                ([id, item]) => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const date =
                        item.createdAt
                            ? new Date(
                                item.createdAt
                            ).toLocaleString()
                            : "-";


                    row.innerHTML = `

                        <td>
                            ${escapeHtml(
                                item.action || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.email || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                date
                            )}
                        </td>

                    `;


                    table.appendChild(row);

                }
            );

        }
    );

}


/* =====================================================
   SEARCH INVENTORY
===================================================== */

document
    .getElementById(
        "searchInventory"
    )
    .addEventListener(
        "input",
        filterInventory
    );


document
    .getElementById(
        "categoryFilter"
    )
    .addEventListener(
        "change",
        filterInventory
    );


function filterInventory() {

    const search =
        document
            .getElementById(
                "searchInventory"
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


    const rows =
        document.querySelectorAll(
            "#inventoryTable tr"
        );


    rows.forEach(
        function (row) {

            const text =
                row.textContent
                    .toLowerCase();


            const categoryText =
                row.cells[2]
                    ? row.cells[2]
                        .textContent
                        .trim()
                    : "";


            const searchMatch =
                text.includes(search);


            const categoryMatch =
                category === "all" ||
                categoryText === category;


            row.style.display =
                searchMatch &&
                categoryMatch
                    ? ""
                    : "none";

        }
    );

}


/* =====================================================
   FIREBASE ERROR HANDLER
===================================================== */

function firebaseError(error) {

    console.error(
        "Firebase error:",
        error.code,
        error.message
    );


    switch (error.code) {

        case "auth/invalid-email":

            return "Invalid email address.";


        case "auth/invalid-credential":

            return "Invalid email or password.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/email-already-in-use":

            return "This email is already registered. Please login instead.";


        case "auth/weak-password":

            return "Password must be at least 6 characters.";


        case "auth/operation-not-allowed":

            return "Email/Password Authentication is not enabled in Firebase.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        default:

            return error.message ||
                "Something went wrong. Please try again.";

    }

}


/* =====================================================
   MESSAGE HELPER
===================================================== */

function showMessage(
    element,
    text,
    type
) {

    element.textContent =
        text;


    if (type === "success") {

        element.style.color =
            "#27823a";

    }

    else if (type === "error") {

        element.style.color =
            "#c62828";

    }

    else {

        element.style.color =
            "#8b4513";

    }

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(value)

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
