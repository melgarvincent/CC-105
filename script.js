/* ==========================================
   BAKERY INVENTORY SYSTEM
   FIREBASE REALTIME DATABASE
========================================== */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* ==========================================
   FIREBASE CONFIGURATION
========================================== */

const firebaseConfig = {

    databaseURL:
        "https://crudfirebase-b2a1f-default-rtdb.firebaseio.com/"

};


/* Initialize Firebase */

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* Database locations */

const productsRef = ref(db, "bakeryProducts");

const activityRef = ref(db, "activityLogs");


/* Local array used by the interface */

let products = [];

let activities = [];


/* ==========================================
   LOGIN
========================================== */

document
    .getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        const error =
            document
                .getElementById("loginError");


        /*
            DEMO LOGIN

            Email:
            admin@bakery.com

            Password:
            Bakery@123

            IMPORTANT:
            For a real system, use
            Firebase Authentication.
        */

        if (
            email === "admin@bakery.com" &&
            password === "Bakery@123"
        ) {

            sessionStorage.setItem(
                "bakeryLoggedIn",
                "true"
            );

            document
                .getElementById("loginPage")
                .classList.add("hidden");

            document
                .getElementById("system")
                .classList.remove("hidden");

            updateDashboard();

        } else {

            error.textContent =
                "Invalid email or password.";

        }

    });


/* ==========================================
   LOGOUT
========================================== */

window.logout = function() {

    sessionStorage.removeItem(
        "bakeryLoggedIn"
    );

    document
        .getElementById("system")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

};


/* ==========================================
   PAGE NAVIGATION
========================================== */

window.showPage = function(page, button) {

    document
        .getElementById("dashboardPage")
        .classList.add("hidden");

    document
        .getElementById("inventoryPage")
        .classList.add("hidden");

    document
        .getElementById("activityPage")
        .classList.add("hidden");


    document
        .getElementById(page + "Page")
        .classList.remove("hidden");


    document
        .querySelectorAll(".nav-btn")
        .forEach(function(btn) {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }


    if (page === "dashboard") {

        document
            .getElementById("pageTitle")
            .textContent = "Dashboard";

        updateDashboard();

    }


    if (page === "inventory") {

        document
            .getElementById("pageTitle")
            .textContent = "Inventory";

        renderInventory();

    }


    if (page === "activity") {

        document
            .getElementById("pageTitle")
            .textContent = "Activity Logs";

        renderActivities();

    }

};


/* ==========================================
   FIREBASE - LOAD PRODUCTS
========================================== */

onValue(
    productsRef,
    function(snapshot) {

        const data = snapshot.val();

        products = [];


        if (data) {

            Object.keys(data).forEach(function(key) {

                products.push({

                    id: key,

                    sku:
                        data[key].sku || "",

                    name:
                        data[key].name || "",

                    category:
                        data[key].category || "",

                    quantity:
                        Number(data[key].quantity || 0),

                    price:
                        Number(data[key].price || 0),

                    threshold:
                        Number(data[key].threshold || 0)

                });

            });

        }


        updateDashboard();

        renderInventory();

    },

    function(error) {

        console.error(
            "Firebase product error:",
            error
        );

        alert(
            "Unable to load products. Check Firebase Security Rules."
        );

    }
);


/* ==========================================
   FIREBASE - LOAD ACTIVITY LOGS
========================================== */

onValue(
    activityRef,
    function(snapshot) {

        const data = snapshot.val();

        activities = [];


        if (data) {

            Object.keys(data).forEach(function(key) {

                activities.push({

                    id: key,

                    message:
                        data[key].message || "",

                    time:
                        data[key].time || ""

                });

            });

        }


        activities.reverse();

        renderActivities();

    }
);


/* ==========================================
   ADD ACTIVITY LOG
========================================== */

function addActivity(message) {

    const newActivity =
        push(activityRef);


    return set(
        newActivity,
        {

            message: message,

            time:
                new Date().toLocaleString()

        }
    );

}


/* ==========================================
   DASHBOARD
========================================== */

function updateDashboard() {

    let totalStock = 0;

    let lowStock = 0;

    let totalValue = 0;


    products.forEach(function(product) {

        totalStock +=
            product.quantity;


        totalValue +=
            product.quantity *
            product.price;


        if (
            product.quantity <=
            product.threshold
        ) {

            lowStock++;

        }

    });


    document
        .getElementById("totalProducts")
        .textContent =
        products.length;


    document
        .getElementById("totalStock")
        .textContent =
        totalStock;


    document
        .getElementById("lowStock")
        .textContent =
        lowStock;


    document
        .getElementById("inventoryValue")
        .textContent =
        "₱" +
        totalValue.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 2
            }
        );


    renderLowStock();

}


/* ==========================================
   LOW STOCK
========================================== */

function renderLowStock() {

    const container =
        document
            .getElementById("lowStockList");


    const lowProducts =
        products.filter(function(product) {

            return (
                product.quantity <=
                product.threshold
            );

        });


    if (lowProducts.length === 0) {

        container.innerHTML =
            "<p>No low-stock products.</p>";

        return;

    }


    container.innerHTML =
        lowProducts
            .map(function(product) {

                return `

                    <div class="stock-item">

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            ${escapeHTML(product.category)}
                            • SKU:
                            ${escapeHTML(product.sku)}
                        </small>

                        <span class="low-label">
                            ${product.quantity}
                            pcs remaining
                        </span>

                    </div>

                `;

            })
            .join("");

}


/* ==========================================
   INVENTORY TABLE
========================================== */

window.renderInventory = function() {

    const searchBox =
        document.getElementById("searchBox");


    const categoryFilter =
        document.getElementById("categoryFilter");


    const search =
        searchBox
            ? searchBox.value
                .toLowerCase()
                .trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const filteredProducts =
        products.filter(function(product) {

            const searchMatch =

                product.name
                    .toLowerCase()
                    .includes(search)

                ||

                product.sku
                    .toLowerCase()
                    .includes(search);


            const categoryMatch =

                category === ""

                ||

                product.category ===
                category;


            return (
                searchMatch &&
                categoryMatch
            );

        });


    const table =
        document.getElementById(
            "inventoryTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML = "";


    if (filteredProducts.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="7">

                    No products found.

                </td>

            </tr>

        `;

        return;

    }


    filteredProducts.forEach(function(product) {

        const isLow =
            product.quantity <=
            product.threshold;


        table.innerHTML += `

            <tr>

                <td>
                    ${escapeHTML(product.sku)}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(product.category)}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ₱${product.price.toFixed(2)}
                </td>

                <td>

                    <span class="
                        status
                        ${
                            isLow
                                ? "status-low"
                                : "status-ok"
                        }
                    ">

                        ${
                            isLow
                                ? "LOW STOCK"
                                : "IN STOCK"
                        }

                    </span>

                </td>

                <td>

                    <button
                        class="action"
                        onclick="editQuantity('${product.id}')"
                    >
                        ✏️
                    </button>

                    <button
                        class="action delete"
                        onclick="deleteProduct('${product.id}')"
                    >
                        🗑️
                    </button>

                </td>

            </tr>

        `;

    });

};


/* ==========================================
   OPEN PRODUCT MODAL
========================================== */

window.openProductModal = function() {

    document
        .getElementById("productModal")
        .classList.remove("hidden");

};


/* ==========================================
   CLOSE PRODUCT MODAL
========================================== */

window.closeProductModal = function() {

    document
        .getElementById("productModal")
        .classList.add("hidden");

};


/* ==========================================
   ADD PRODUCT
========================================== */

document
    .getElementById("productForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const sku =
            document
                .getElementById("productSKU")
                .value
                .trim();


        const name =
            document
                .getElementById("productName")
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
                    .getElementById("productThreshold")
                    .value
            );


        if (
            !sku ||
            !name ||
            !category ||
            quantity < 0 ||
            price < 0 ||
            threshold < 0
        ) {

            alert(
                "Please enter valid product information."
            );

            return;

        }


        const duplicate =
            products.some(function(product) {

                return (
                    product.sku.toLowerCase() ===
                    sku.toLowerCase()
                );

            });


        if (duplicate) {

            alert(
                "SKU already exists."
            );

            return;

        }


        try {

            const newProduct =
                push(productsRef);


            await set(
                newProduct,
                {

                    sku: sku,

                    name: name,

                    category: category,

                    quantity: quantity,

                    price: price,

                    threshold: threshold

                }
            );


            await addActivity(
                `Added "${name}" to bakery inventory`
            );


            alert(
                "Product successfully added!"
            );


            document
                .getElementById("productForm")
                .reset();


            closeProductModal();


        } catch (error) {

            console.error(error);

            alert(
                "Error saving product: " +
                error.message
            );

        }

    });


/* ==========================================
   EDIT QUANTITY
========================================== */

window.editQuantity = async function(id) {

    const product =
        products.find(function(item) {

            return item.id === id;

        });


    if (!product) {

        alert(
            "Product not found."
        );

        return;

    }


    const newQuantity =
        prompt(
            "Enter new quantity for " +
            product.name,
            product.quantity
        );


    if (newQuantity === null) {

        return;

    }


    const quantity =
        Number(newQuantity);


    if (
        isNaN(quantity) ||
        quantity < 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    try {

        await update(
            ref(
                db,
                "bakeryProducts/" + id
            ),
            {

                quantity: quantity

            }
        );


        await addActivity(
            `Updated "${product.name}" stock to ${quantity}`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to update product."
        );

    }

};


/* ==========================================
   DELETE PRODUCT
========================================== */

window.deleteProduct = async function(id) {

    const product =
        products.find(function(item) {

            return item.id === id;

        });


    if (!product) {

        return;

    }


    const confirmation =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!confirmation) {

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
            `Deleted "${product.name}" from inventory`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete product."
        );

    }

};


/* ==========================================
   ACTIVITY LOGS
========================================== */

function renderActivities() {

    const dashboard =
        document.getElementById(
            "recentActivity"
        );


    const activityPage =
        document.getElementById(
            "activityList"
        );


    if (
        !dashboard ||
        !activityPage
    ) {

        return;

    }


    if (activities.length === 0) {

        const empty =
            "<p>No recent activity.</p>";

        dashboard.innerHTML = empty;

        activityPage.innerHTML = empty;

        return;

    }


    const html =
        activities
            .slice(0, 10)
            .map(function(activity) {

                return `

                    <div class="activity-item">

                        📝
                        ${escapeHTML(
                            activity.message
                        )}

                        <small>
                            ${escapeHTML(
                                activity.time
                            )}
                        </small>

                    </div>

                `;

            })
            .join("");


    dashboard.innerHTML = html;

    activityPage.innerHTML = html;

}


/* ==========================================
   SECURITY HELPER
========================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================
   SESSION CHECK
========================================== */

window.addEventListener(
    "load",
    function() {

        const loggedIn =
            sessionStorage.getItem(
                "bakeryLoggedIn"
            );


        if (loggedIn === "true") {

            document
                .getElementById("loginPage")
                .classList.add("hidden");

            document
                .getElementById("system")
                .classList.remove("hidden");

            updateDashboard();

        }

    }
);

