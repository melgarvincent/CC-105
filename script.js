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


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey: "AIzaSyCzB9hMQ_TuA46TW-Tcge-3Unq40-Bpibc",

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
   DATABASE REFERENCES
===================================================== */

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");

const usersRef = ref(db, "users");


/* =====================================================
   VARIABLES
===================================================== */

let products = {};

let currentUser = null;


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const registerPage =
    document.getElementById("registerPage");

const dashboardPage =
    document.getElementById("dashboardPage");


/* =====================================================
   HELPER
===================================================== */

function showElement(element) {

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(element) {

    if (element) {
        element.classList.add("hidden");
    }
}


/* =====================================================
   LOGIN / REGISTER PAGE SWITCH
===================================================== */

document
    .getElementById("showRegisterBtn")
    .addEventListener("click", () => {

        hideElement(loginPage);

        showElement(registerPage);

        document
            .getElementById("loginMessage")
            .textContent = "";

    });


document
    .getElementById("showLoginBtn")
    .addEventListener("click", () => {

        hideElement(registerPage);

        showElement(loginPage);

        document
            .getElementById("registerMessage")
            .textContent = "";

    });


/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {

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

        const message =
            document
                .getElementById("loginMessage");


        message.textContent = "Logging in...";


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            message.textContent = "";

        } catch (error) {

            console.error(error);

            message.textContent =
                getFirebaseError(error);

        }

    });


/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerForm")
    .addEventListener("submit", async (event) => {

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


        const confirm =
            document
                .getElementById("registerConfirm")
                .value;


        const message =
            document
                .getElementById("registerMessage");


        if (password !== confirm) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        message.textContent =
            "Creating account...";


        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            /*
               Store profile information in RTDB.
               Password is NOT stored here.
            */

            await set(
                ref(db, `users/${user.uid}`),
                {

                    name: name,

                    email: email,

                    role: "staff",

                    createdAt:
                        new Date().toISOString()

                }
            );


            message.textContent =
                "Account created successfully!";


            document
                .getElementById("registerForm")
                .reset();


            setTimeout(() => {

                hideElement(registerPage);

                showElement(dashboardPage);

            }, 800);


        } catch (error) {

            console.error(error);

            message.textContent =
                getFirebaseError(error);

        }

    });


/* =====================================================
   FORGOT PASSWORD
===================================================== */

document
    .getElementById("forgotBtn")
    .addEventListener("click", async () => {

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const message =
            document
                .getElementById("loginMessage");


        if (!email) {

            message.textContent =
                "Enter your email first.";

            return;
        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            message.textContent =
                "Password reset email sent.";

        } catch (error) {

            console.error(error);

            message.textContent =
                getFirebaseError(error);

        }

    });


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser = user;


        if (user) {

            hideElement(loginPage);

            hideElement(registerPage);

            showElement(dashboardPage);


            document
                .getElementById("userEmail")
                .textContent =
                user.email || "User";


            loadProducts();

            loadActivityLogs();

        } else {

            showElement(loginPage);

            hideElement(registerPage);

            hideElement(dashboardPage);

        }

    }
);


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(error);

        }

    });


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                showContent(page);


                document
                    .querySelectorAll(".nav-btn")
                    .forEach(btn => {

                        btn.classList.remove("active");

                    });


                button.classList.add("active");

            }
        );

    });


/* =====================================================
   SHOW CONTENT
===================================================== */

window.showContent = function(pageId) {

    document
        .querySelectorAll(".content-section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    const page =
        document.getElementById(pageId);


    if (page) {
        page.classList.remove("hidden");
    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(btn => {

            btn.classList.remove("active");

            if (
                btn.dataset.page === pageId
            ) {

                btn.classList.add("active");

            }

        });

};


/* =====================================================
   LOAD PRODUCTS
===================================================== */

function loadProducts() {

    onValue(
        productsRef,
        snapshot => {

            products =
                snapshot.val() || {};

            displayInventory();

            updateDashboard();

        }
    );

}


/* =====================================================
   DISPLAY INVENTORY
===================================================== */

function displayInventory() {

    const table =
        document.getElementById("inventoryTable");


    table.innerHTML = "";


    const search =
        (
            document
                .getElementById("searchProduct")
                ?.value || ""
        )
        .toLowerCase();


    const category =
        document
            .getElementById("categoryFilter")
            ?.value || "all";


    Object.entries(products)
        .forEach(([id, product]) => {

            const productName =
                String(product.name || "")
                    .toLowerCase();


            const productCategory =
                product.category || "";


            if (
                search &&
                !productName.includes(search)
            ) {
                return;
            }


            if (
                category !== "all" &&
                productCategory !== category
            ) {
                return;
            }


            const quantity =
                Number(product.quantity || 0);


            const threshold =
                Number(product.threshold || 0);


            const isLow =
                quantity <= threshold;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>${escapeHTML(product.sku)}</td>

                <td>${escapeHTML(product.name)}</td>

                <td>${escapeHTML(product.category)}</td>

                <td>${quantity}</td>

                <td>₱${Number(product.price || 0).toFixed(2)}</td>

                <td>${threshold}</td>

                <td>
                    <span class="status ${isLow ? "low" : "ok"}">
                        ${isLow ? "LOW STOCK" : "IN STOCK"}
                    </span>
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editProduct('${id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${id}')"
                    >
                        Delete
                    </button>

                </td>

            `;


            table.appendChild(row);

        });

}


/* =====================================================
   SEARCH
===================================================== */

document
    .getElementById("searchProduct")
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


/* =====================================================
   ADD / UPDATE PRODUCT
===================================================== */

document
    .getElementById("productForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const id =
            document
                .getElementById("editProductId")
                .value;


        const product = {

            sku:
                document
                    .getElementById("productSKU")
                    .value
                    .trim(),

            name:
                document
                    .getElementById("productName")
                    .value
                    .trim(),

            category:
                document
                    .getElementById("productCategory")
                    .value,

            quantity:
                Number(
                    document
                        .getElementById("productQuantity")
                        .value
                ),

            price:
                Number(
                    document
                        .getElementById("productPrice")
                        .value
                ),

            threshold:
                Number(
                    document
                        .getElementById("productThreshold")
                        .value
                ),

            updatedAt:
                new Date().toISOString()

        };


        const message =
            document
                .getElementById("productMessage");


        try {

            if (id) {

                await update(
                    ref(db, `bakeryProducts/${id}`),
                    product
                );


                await addActivity(
                    "Updated",
                    product.name
                );


                message.textContent =
                    "Product updated successfully.";

            } else {

                const newProductRef =
                    push(productsRef);


                await set(
                    newProductRef,
                    {

                        ...product,

                        createdAt:
                            new Date().toISOString()

                    }
                );


                await addActivity(
                    "Added",
                    product.name
                );


                message.textContent =
                    "Product added successfully.";

            }


            resetProductForm();


            setTimeout(() => {

                showContent(
                    "inventoryContent"
                );

            }, 700);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Error saving product.";

        }

    });


/* =====================================================
   EDIT PRODUCT
===================================================== */

window.editProduct = function(id) {

    const product =
        products[id];


    if (!product) {
        return;
    }


    document
        .getElementById("editProductId")
        .value = id;


    document
        .getElementById("productSKU")
        .value = product.sku || "";


    document
        .getElementById("productName")
        .value = product.name || "";


    document
        .getElementById("productCategory")
        .value = product.category || "";


    document
        .getElementById("productQuantity")
        .value = product.quantity || 0;


    document
        .getElementById("productPrice")
        .value = product.price || 0;


    document
        .getElementById("productThreshold")
        .value = product.threshold || 0;


    document
        .getElementById("formTitle")
        .textContent = "Edit Product";


    showContent("addProductContent");

};


/* =====================================================
   DELETE PRODUCT
===================================================== */

window.deleteProduct = async function(id) {

    const product =
        products[id];


    if (!product) {
        return;
    }


    const confirmDelete =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await remove(
            ref(db, `bakeryProducts/${id}`)
        );


        await addActivity(
            "Deleted",
            product.name
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );

    }

};


/* =====================================================
   RESET PRODUCT FORM
===================================================== */

function resetProductForm() {

    document
        .getElementById("productForm")
        .reset();


    document
        .getElementById("editProductId")
        .value = "";


    document
        .getElementById("formTitle")
        .textContent = "Add Product";


    document
        .getElementById("productMessage")
        .textContent = "";

}


/* =====================================================
   CANCEL PRODUCT
===================================================== */

document
    .getElementById("cancelProductBtn")
    .addEventListener(
        "click",
        () => {

            resetProductForm();

            showContent(
                "inventoryContent"
            );

        }
    );


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    const list =
        Object.values(products);


    let totalProducts =
        list.length;


    let totalStock = 0;

    let lowStock = 0;

    let totalValue = 0;


    list.forEach(product => {

        const quantity =
            Number(product.quantity || 0);


        const price =
            Number(product.price || 0);


        const threshold =
            Number(product.threshold || 0);


        totalStock += quantity;

        totalValue +=
            quantity * price;


        if (quantity <= threshold) {

            lowStock++;

        }

    });


    document
        .getElementById("totalProducts")
        .textContent =
        totalProducts;


    document
        .getElementById("totalStock")
        .textContent =
        totalStock;


    document
        .getElementById("lowStock")
        .textContent =
        lowStock;


    document
        .getElementById("totalValue")
        .textContent =
        `₱${totalValue.toFixed(2)}`;


    displayDashboardTable();

}


/* =====================================================
   DASHBOARD TABLE
===================================================== */

function displayDashboardTable() {

    const table =
        document.getElementById(
            "dashboardTable"
        );


    table.innerHTML = "";


    const list =
        Object.entries(products)
            .slice(-8)
            .reverse();


    list.forEach(([id, product]) => {

        const quantity =
            Number(product.quantity || 0);


        const threshold =
            Number(product.threshold || 0);


        const low =
            quantity <= threshold;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${escapeHTML(product.sku)}</td>

            <td>${escapeHTML(product.name)}</td>

            <td>${escapeHTML(product.category)}</td>

            <td>${quantity}</td>

            <td>₱${Number(product.price || 0).toFixed(2)}</td>

            <td>
                <span class="status ${low ? "low" : "ok"}">
                    ${low ? "LOW STOCK" : "IN STOCK"}
                </span>
            </td>

        `;


        table.appendChild(row);

    });

}


/* =====================================================
   ACTIVITY LOG
===================================================== */

async function addActivity(
    action,
    productName
) {

    if (!currentUser) {
        return;
    }


    const newLog =
        push(activityRef);


    await set(
        newLog,
        {

            action: action,

            product:
                productName,

            user:
                currentUser.email,

            date:
                new Date().toISOString()

        }
    );

}


/* =====================================================
   LOAD ACTIVITY
===================================================== */

function loadActivityLogs() {

    onValue(
        activityRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            const table =
                document.getElementById(
                    "activityTable"
                );


            table.innerHTML = "";


            Object.values(data)
                .reverse()
                .forEach(log => {

                    const row =
                        document.createElement("tr");


                    const date =
                        log.date
                            ? new Date(log.date)
                                .toLocaleString()
                            : "-";


                    row.innerHTML = `

                        <td>${escapeHTML(date)}</td>

                        <td>${escapeHTML(log.action || "")}</td>

                        <td>${escapeHTML(log.product || "")}</td>

                        <td>${escapeHTML(log.user || "")}</td>

                    `;


                    table.appendChild(row);

                });

        }
    );

}


/* =====================================================
   FIREBASE ERROR MESSAGE
===================================================== */

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return error.message || "Something went wrong.";

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
