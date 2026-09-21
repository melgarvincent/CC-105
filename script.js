/* =========================================================
   ARBEES BAKERY SHOP
   Firebase Google Authentication + Phone OTP
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey: "PASTE_YOUR_API_KEY_HERE",

    authDomain:
        "PASTE_YOUR_PROJECT_ID.firebaseapp.com",

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/",

    projectId:
        "PASTE_YOUR_PROJECT_ID",

    storageBucket:
        "PASTE_YOUR_STORAGE_BUCKET",

    messagingSenderId:
        "PASTE_YOUR_MESSAGING_SENDER_ID",

    appId:
        "PASTE_YOUR_APP_ID"
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});


/* =========================================================
   DATABASE REFERENCES
   ========================================================= */

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");

const usersRef = ref(db, "users");


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;

let confirmationResult = null;

let recaptchaVerifier = null;

let editingProductId = null;

let allProducts = {};


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const loginPage =
    document.getElementById("loginPage");

const otpPage =
    document.getElementById("otpPage");

const systemPage =
    document.getElementById("systemPage");

const dashboardPage =
    document.getElementById("dashboardPage");

const inventoryPage =
    document.getElementById("inventoryPage");

const addProductPage =
    document.getElementById("addProductPage");

const activityPage =
    document.getElementById("activityPage");

const usersPage =
    document.getElementById("usersPage");


/* =========================================================
   SHOW / HIDE PAGES
   ========================================================= */

function showLogin() {

    loginPage.classList.remove("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.add("hidden");
}


function showOTP() {

    loginPage.classList.add("hidden");

    otpPage.classList.remove("hidden");

    systemPage.classList.add("hidden");

}


function showSystem() {

    loginPage.classList.add("hidden");

    otpPage.classList.add("hidden");

    systemPage.classList.remove("hidden");

    showSystemPage("dashboard");

    loadDashboard();

    loadInventory();

    loadActivity();

    loadUserProfile();
}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

document
    .getElementById("googleLoginBtn")
    .addEventListener("click", async () => {

        const errorBox =
            document.getElementById("loginError");

        errorBox.textContent = "";

        try {

            const result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );

            currentUser = result.user;

            displayGoogleUser();

            showOTP();

            setupRecaptcha();

        } catch (error) {

            console.error(error);

            errorBox.textContent =
                getAuthError(error);

        }

    });


/* =========================================================
   DISPLAY GOOGLE USER
   ========================================================= */

function displayGoogleUser() {

    if (!currentUser) return;

    const name =
        currentUser.displayName ||
        "Google User";

    const email =
        currentUser.email ||
        "";

    const photo =
        currentUser.photoURL ||
        "./MY PICTURE.jpg";


    document.getElementById(
        "googleUserName"
    ).textContent = name;


    document.getElementById(
        "googleUserEmail"
    ).textContent = email;


    document.getElementById(
        "googleUserPhoto"
    ).src = photo;

}


/* =========================================================
   SETUP RECAPTCHA
   ========================================================= */

function setupRecaptcha() {

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    container.innerHTML = "";

    if (recaptchaVerifier) {

        try {
            recaptchaVerifier.clear();
        } catch (error) {
            console.log(error);
        }

        recaptchaVerifier = null;
    }


    recaptchaVerifier =
        new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {

                size: "normal",

                callback: function () {

                    console.log(
                        "reCAPTCHA completed."
                    );

                },

                "expired-callback":
                    function () {

                        document.getElementById(
                            "otpError"
                        ).textContent =
                            "reCAPTCHA expired. Please try again.";

                    }

            }
        );

}


/* =========================================================
   SEND OTP
   ========================================================= */

document
    .getElementById("phoneForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const phoneNumber =
            document
                .getElementById("phoneNumber")
                .value
                .trim();


        const errorBox =
            document.getElementById(
                "otpError"
            );

        const messageBox =
            document.getElementById(
                "otpMessage"
            );


        errorBox.textContent = "";

        messageBox.textContent = "";


        /* Philippine number validation */

        if (!/^\+639\d{9}$/.test(phoneNumber)) {

            errorBox.textContent =
                "Use Philippine format: +639XXXXXXXXX";

            return;
        }


        if (!currentUser) {

            errorBox.textContent =
                "Please login with Google first.";

            return;
        }


        try {

            if (!recaptchaVerifier) {

                setupRecaptcha();

            }


            /*
             * Link the phone number to the
             * currently authenticated Google user.
             */

            confirmationResult =
                await linkWithPhoneNumber(
                    currentUser,
                    phoneNumber,
                    recaptchaVerifier
                );


            document
                .getElementById("phoneForm")
                .classList.add("hidden");


            document
                .getElementById("otpForm")
                .classList.remove("hidden");


            messageBox.textContent =
                "OTP sent to your phone.";

        } catch (error) {

            console.error(error);

            errorBox.textContent =
                getAuthError(error);


            resetRecaptcha();

        }

    });


/* =========================================================
   VERIFY OTP
   ========================================================= */

document
    .getElementById("otpForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const otp =
            document
                .getElementById("otpCode")
                .value
                .trim();


        const errorBox =
            document.getElementById(
                "otpError"
            );


        errorBox.textContent = "";


        if (!/^\d{6}$/.test(otp)) {

            errorBox.textContent =
                "Enter the 6-digit OTP.";

            return;
        }


        if (!confirmationResult) {

            errorBox.textContent =
                "Please request an OTP first.";

            return;
        }


        try {

            /*
             * Confirm SMS code.
             */

            const userCredential =
                await confirmationResult.confirm(
                    otp
                );


            currentUser =
                userCredential.user;


            /*
             * Save verified user in RTDB.
             */

            await saveVerifiedUser();


            /*
             * Activity log.
             */

            await logActivity(
                "Authentication",
                "Google authentication and phone OTP verification completed."
            );


            showSystem();

        } catch (error) {

            console.error(error);

            errorBox.textContent =
                getAuthError(error);

        }

    });


/* =========================================================
   SAVE USER TO DATABASE
   ========================================================= */

async function saveVerifiedUser() {

    if (!currentUser) return;


    const userRef =
        ref(
            db,
            "users/" + currentUser.uid
        );


    await set(userRef, {

        uid:
            currentUser.uid,

        name:
            currentUser.displayName ||
            "User",

        email:
            currentUser.email ||
            "",

        photoURL:
            currentUser.photoURL ||
            "",

        phoneNumber:
            currentUser.phoneNumber ||
            "",

        role:
            "staff",

        googleVerified:
            true,

        otpVerified:
            true,

        verifiedAt:
            new Date().toISOString()

    });

}


/* =========================================================
   BACK TO LOGIN
   ========================================================= */

document
    .getElementById("otpBackBtn")
    .addEventListener("click", async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.log(error);

        }


        currentUser = null;

        confirmationResult = null;

        document
            .getElementById("phoneForm")
            .classList.remove("hidden");


        document
            .getElementById("otpForm")
            .classList.add("hidden");


        document
            .getElementById("phoneNumber")
            .value = "";


        document
            .getElementById("otpCode")
            .value = "";


        showLogin();

    });


/* =========================================================
   LOGOUT
   ========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            if (currentUser) {

                await logActivity(
                    "Logout",
                    "User logged out of the system."
                );

            }

            await signOut(auth);

            currentUser = null;

            confirmationResult = null;

            showLogin();

        } catch (error) {

            console.error(error);

        }

    });


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            currentUser = user;

        }

    }
);


/* =========================================================
   NAVIGATION
   ========================================================= */

document
    .querySelectorAll(".nav-btn")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                showSystemPage(page);

            }
        );

    });


function showSystemPage(pageName) {

    const pages = {

        dashboard:
            dashboardPage,

        inventory:
            inventoryPage,

        addProduct:
            addProductPage,

        activity:
            activityPage,

        users:
            usersPage

    };


    Object.values(pages)
        .forEach(page => {

            page.classList.add("hidden");

        });


    if (pages[pageName]) {

        pages[pageName]
            .classList.remove("hidden");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

        });


    const activeButton =
        document.querySelector(
            `.nav-btn[data-page="${pageName}"]`
        );


    if (activeButton) {

        activeButton.classList.add("active");

    }

}


/* =========================================================
   ADD PRODUCT BUTTON
   ========================================================= */

document
    .getElementById("inventoryAddBtn")
    .addEventListener("click", () => {

        resetProductForm();

        showSystemPage("addProduct");

    });


document
    .getElementById("cancelProductBtn")
    .addEventListener("click", () => {

        resetProductForm();

        showSystemPage("inventory");

    });


/* =========================================================
   PRODUCT FORM
   ========================================================= */

document
    .getElementById("productForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


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


        if (!name ||
            !sku ||
            !category) {

            message.textContent =
                "Please complete all required fields.";

            message.style.color =
                "#dc3545";

            return;
        }


        if (quantity < 0 ||
            price < 0 ||
            threshold < 0) {

            message.textContent =
                "Values cannot be negative.";

            message.style.color =
                "#dc3545";

            return;
        }


        try {

            if (editingProductId) {

                const productRef =
                    ref(
                        db,
                        "bakeryProducts/" +
                        editingProductId
                    );


                await update(
                    productRef,
                    {

                        name,
                        sku,
                        category,
                        quantity,
                        price,
                        threshold,
                        updatedAt:
                            new Date().toISOString(),

                        updatedBy:
                            currentUser?.email || ""

                    }
                );


                await logActivity(
                    "Update Product",
                    `Updated product: ${name}`
                );


                message.textContent =
                    "Product updated successfully.";

            } else {

                const newProductRef =
                    push(productsRef);


                await set(
                    newProductRef,
                    {

                        name,
                        sku,
                        category,
                        quantity,
                        price,
                        threshold,

                        createdAt:
                            new Date().toISOString(),

                        createdBy:
                            currentUser?.email || ""

                    }
                );


                await logActivity(
                    "Add Product",
                    `Added product: ${name}`
                );


                message.textContent =
                    "Product added successfully.";

            }


            message.style.color =
                "#198754";


            resetProductForm();

            await loadInventory();

            await loadDashboard();


            setTimeout(() => {

                showSystemPage("inventory");

            }, 800);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Failed to save product.";

            message.style.color =
                "#dc3545";

        }

    });


/* =========================================================
   RESET PRODUCT FORM
   ========================================================= */

function resetProductForm() {

    editingProductId = null;

    document
        .getElementById("productForm")
        .reset();


    document
        .getElementById("lowStockThreshold")
        .value = 5;


    document
        .getElementById("productFormTitle")
        .textContent = "Add Product";


    document
        .getElementById("productMessage")
        .textContent = "";

}


/* =========================================================
   LOAD INVENTORY
   ========================================================= */

async function loadInventory() {

    try {

        const snapshot =
            await get(productsRef);


        allProducts =
            snapshot.exists()
                ? snapshot.val()
                : {};


        renderInventory();

    } catch (error) {

        console.error(
            "Inventory error:",
            error
        );

    }

}


/* =========================================================
   RENDER INVENTORY
   ========================================================= */

function renderInventory() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    tbody.innerHTML = "";


    const search =
        document
            .getElementById(
                "searchProduct"
            )
            .value
            .toLowerCase()
            .trim();


    const category =
        document.getElementById(
            "categoryFilter"
        ).value;


    Object.entries(allProducts)
        .forEach(([id, product]) => {

            const productName =
                String(
                    product.name || ""
                ).toLowerCase();


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


            const price =
                Number(product.price || 0);


            const lowStock =
                quantity <= threshold;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(product.name || "")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(product.sku || "")}
                </td>

                <td>
                    ${escapeHTML(product.category || "")}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ₱${price.toFixed(2)}
                </td>

                <td>

                    <span class="status ${
                        lowStock
                            ? "low-stock"
                            : "in-stock"
                    }">

                        ${
                            lowStock
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


            tbody.appendChild(row);

        });


    if (!tbody.children.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;padding:30px;"
                >

                    No products found.

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   SEARCH / FILTER
   ========================================================= */

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


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

window.editProduct =
    function(id) {

        const product =
            allProducts[id];


        if (!product) return;


        editingProductId = id;


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
            product.threshold || 5;


        document
            .getElementById(
                "productFormTitle"
            )
            .textContent =
            "Update Product";


        document
            .getElementById(
                "productMessage"
            )
            .textContent = "";


        showSystemPage("addProduct");

    };


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

window.deleteProduct =
    async function(id) {

        const product =
            allProducts[id];


        if (!product) return;


        const confirmed =
            confirm(
                `Delete "${product.name}"?`
            );


        if (!confirmed) return;


        try {

            await remove(
                ref(
                    db,
                    "bakeryProducts/" + id
                )
            );


            await logActivity(
                "Delete Product",
                `Deleted product: ${product.name}`
            );


            await loadInventory();

            await loadDashboard();

        } catch (error) {

            console.error(error);

            alert(
                "Failed to delete product."
            );

        }

    };


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

    try {

        const snapshot =
            await get(productsRef);


        const products =
            snapshot.exists()
                ? snapshot.val()
                : {};


        let totalProducts = 0;

        let totalStock = 0;

        let lowStock = 0;

        let estimatedValue = 0;


        const lowStockProducts = [];


        Object.values(products)
            .forEach(product => {

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
                        product.threshold || 0
                    );


                totalStock += quantity;


                estimatedValue +=
                    quantity * price;


                if (
                    quantity <= threshold
                ) {

                    lowStock++;

                    lowStockProducts
                        .push(product);

                }

            });


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
            estimatedValue.toFixed(2);


        renderLowStock(
            lowStockProducts
        );


        await loadRecentActivity();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* =========================================================
   LOW STOCK
   ========================================================= */

function renderLowStock(products) {

    const container =
        document.getElementById(
            "lowStockList"
        );


    container.innerHTML = "";


    if (!products.length) {

        container.innerHTML = `

            <p class="empty-message">
                No low stock products.
            </p>

        `;

        return;
    }


    products
        .slice(0, 10)
        .forEach(product => {

            const item =
                document.createElement("div");


            item.className =
                "low-stock-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(product.name || "")}
                </strong>

                <div>
                    Stock:
                    ${Number(product.quantity || 0)}
                </div>

            `;


            container.appendChild(item);

        });

}


/* =========================================================
   ACTIVITY LOG
   ========================================================= */

async function logActivity(
    action,
    details
) {

    if (!currentUser) return;


    try {

        const newLog =
            push(activityRef);


        await set(
            newLog,
            {

                user:
                    currentUser.displayName ||
                    currentUser.email ||
                    "User",

                email:
                    currentUser.email ||
                    "",

                action,

                details,

                timestamp:
                    new Date().toISOString()

            }
        );

    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );

    }

}


/* =========================================================
   LOAD ACTIVITY
   ========================================================= */

async function loadActivity() {

    try {

        const snapshot =
            await get(activityRef);


        const logs =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const tbody =
            document.getElementById(
                "activityTableBody"
            );


        tbody.innerHTML = "";


        const entries =
            Object.entries(logs)
                .sort(
                    (a, b) =>
                        new Date(
                            b[1].timestamp || 0
                        ) -
                        new Date(
                            a[1].timestamp || 0
                        )
                );


        entries.forEach(
            ([id, log]) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${
                            formatDate(
                                log.timestamp
                            )
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            log.user || ""
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                log.action || ""
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            log.details || ""
                        )}
                    </td>

                `;


                tbody.appendChild(row);

            }
        );


        if (!entries.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        style="text-align:center;padding:30px;"
                    >

                        No activity logs yet.

                    </td>

                </tr>

            `;

        }

    } catch (error) {

        console.error(
            "Activity error:",
            error
        );

    }

}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

async function loadRecentActivity() {

    try {

        const snapshot =
            await get(activityRef);


        const logs =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const container =
            document.getElementById(
                "recentActivity"
            );


        container.innerHTML = "";


        const entries =
            Object.values(logs)
                .sort(
                    (a, b) =>
                        new Date(
                            b.timestamp || 0
                        ) -
                        new Date(
                            a.timestamp || 0
                        )
                )
                .slice(0, 5);


        if (!entries.length) {

            container.innerHTML = `

                <p class="empty-message">
                    No recent activity.
                </p>

            `;

            return;
        }


        entries.forEach(log => {

            const item =
                document.createElement("div");


            item.className =
                "activity-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(
                        log.action || ""
                    )}
                </strong>

                <div>
                    ${escapeHTML(
                        log.details || ""
                    )}
                </div>

                <small>
                    ${formatDate(
                        log.timestamp
                    )}
                </small>

            `;


            container.appendChild(item);

        });

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   ACCOUNT PROFILE
   ========================================================= */

async function loadUserProfile() {

    if (!currentUser) return;


    let userData = null;


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );


        if (snapshot.exists()) {

            userData =
                snapshot.val();

        }

    } catch (error) {

        console.error(error);

    }


    const name =
        userData?.name ||
        currentUser.displayName ||
        "User";


    const email =
        userData?.email ||
        currentUser.email ||
        "";


    const photo =
        userData?.photoURL ||
        currentUser.photoURL ||
        "./MY PICTURE.jpg";


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
        email;


    document
        .getElementById(
            "headerUserPhoto"
        )
        .src =
        photo;


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
        email;


    document
        .getElementById(
            "profilePhoto"
        )
        .src =
        photo;


    document
        .getElementById(
            "profileRole"
        )
        .textContent =
        userData?.role ||
        "Staff";

}


/* =========================================================
   ERROR HANDLER
   ========================================================= */

function getAuthError(error) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/popup-closed-by-user":

            return "Google login was cancelled.";


        case "auth/popup-blocked":

            return "Google popup was blocked by your browser.";


        case "auth/unauthorized-domain":

            return "This website is not authorized in Firebase Authentication.";


        case "auth/operation-not-allowed":

            return "This authentication provider is not enabled in Firebase.";


        case "auth/invalid-phone-number":

            return "Invalid phone number.";


        case "auth/invalid-verification-code":

            return "Incorrect OTP code.";


        case "auth/code-expired":

            return "OTP expired. Please request a new OTP.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/provider-already-linked":

            return "This phone number is already linked to this Google account.";


        case "auth/credential-already-in-use":

            return "This phone number is already connected to another account.";


        case "auth/captcha-check-failed":

            return "reCAPTCHA verification failed. Please try again.";


        default:

            return (
                error?.message ||
                "Authentication failed."
            );

    }

}


/* =========================================================
   RESET RECAPTCHA
   ========================================================= */

function resetRecaptcha() {

    if (recaptchaVerifier) {

        try {

            recaptchaVerifier.clear();

        } catch (error) {

            console.log(error);

        }

        recaptchaVerifier = null;

    }


    setTimeout(() => {

        setupRecaptcha();

    }, 500);

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   INITIAL PAGE
   ========================================================= */

showLogin();
