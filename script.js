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


/* Local arrays */

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


    const pageElement =
        document.getElementById(
            page + "Page"
        );

    if (pageElement) {
        pageElement.classList.remove("hidden");
    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(function(btn) {

            btn.classList.remove("active");

        });


    if (button) {
        button.classList.add("active");
    }


    if (page === "dashboard") {

        const title =
            document.getElementById("pageTitle");

        if (title) {
            title.textContent = "Dashboard";
        }

        updateDashboard();

    }


    if (page === "inventory") {

        const title =
            document.getElementById("pageTitle");

        if (title) {
            title.textContent = "Inventory";
        }

        renderInventory();

    }


    if (page === "activity") {

        const title =
            document.getElementById("pageTitle");

        if (title) {
            title.textContent = "Activity Logs";
        }

        renderActivities();

    }

};


/* ==========================================
   LOAD PRODUCTS
========================================== */

onValue(
    productsRef,
    function(snapshot) {

        products = [];

        const data = snapshot.val();

        if (data) {

            Object.keys(data).forEach(
                function(key) {

                    products.push({

                        id: key,

                        name:
                            data[key].name || "",

                        sku:
                            data[key].sku || "",

                        category:
                            data[key].category || "",

                        quantity:
                            Number(
                                data[key].quantity || 0
                            ),

                        price:
                            Number(
                                data[key].price || 0
                            ),

                        threshold:
                            Number(
                                data[key].threshold || 0
                            )

                    });

                }
            );

        }

        updateDashboard();
        renderInventory();

    }
);


/* ==========================================
   ADD PRODUCT
========================================== */

const productForm =
    document.getElementById("productForm");


if (productForm) {

    productForm.addEventListener(
        "submit",
        async function(event) {

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
                document.getElementById(
                    "productMessage"
                );


            if (
                !name ||
                !sku ||
                !category ||
                isNaN(quantity) ||
                isNaN(price)
            ) {

                if (message) {
                    message.textContent =
                        "Please complete all fields.";
                }

                return;
            }


            try {

                const newProduct =
                    push(productsRef);


                await set(
                    newProduct,
                    {

                        name: name,

                        sku: sku,

                        category: category,

                        quantity: quantity,

                        price: price,

                        threshold: threshold,

                        createdAt:
                            new Date().toLocaleString()

                    }
                );


                await addActivity(
                    "Added product: " + name
                );


                productForm.reset();


                if (message) {

                    message.textContent =
                        "Product added successfully.";

                }


            } catch (errorObject) {

                console.error(
                    "Add product error:",
                    errorObject
                );


                if (message) {

                    message.textContent =
                        "Unable to add product.";

                }

            }

        }
    );

}


/* ==========================================
   EDIT STOCK
========================================== */

window.editQuantity = async function(id) {

    const product =
        products.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!product) {

        alert("Product not found.");

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

                quantity: quantity,

                updatedAt:
                    new Date().toLocaleString()

            }
        );


        await addActivity(
            "Updated stock of " +
            product.name +
            " to " +
            quantity
        );


    } catch (errorObject) {

        console.error(
            "Update error:",
            errorObject
        );

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
        products.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!product) {

        alert("Product not found.");

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete " +
            product.name +
            "?"
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
            "Deleted product: " +
            product.name
        );


        alert(
            "Product deleted successfully."
        );


    } catch (errorObject) {

        console.error(
            "Delete error:",
            errorObject
        );


        alert(
            "Unable to delete product."
        );

    }

};


/* ==========================================
   ACTIVITY LOG
========================================== */

async function addActivity(message) {

    try {

        const newActivity =
            push(activityRef);


        await set(
            newActivity,
            {

                message: message,

                time:
                    new Date().toLocaleString()

            }
        );


    } catch (errorObject) {

        console.error(
            "Activity log error:",
            errorObject
        );

    }

}


/* ==========================================
   LOAD ACTIVITY LOGS
========================================== */

onValue(
    activityRef,
    function(snapshot) {

        activities = [];

        const data =
            snapshot.val();


        if (data) {

            Object.keys(data).forEach(
                function(key) {

                    activities.push({

                        id: key,

                        message:
                            data[key].message || "",

                        time:
                            data[key].time || ""

                    });

                }
            );

        }


        activities.reverse();

        renderActivities();

    }
);


/* ==========================================
   RENDER ACTIVITY
========================================== */

function renderActivities() {

    const recentActivity =
        document.getElementById(
            "recentActivity"
        );


    const activityList =
        document.getElementById(
            "activityList"
        );


    if (
        !recentActivity &&
        !activityList
    ) {
        return;
    }


    if (activities.length === 0) {

        const emptyHTML =
            "<p>No activity logs.</p>";


        if (recentActivity) {
            recentActivity.innerHTML =
                emptyHTML;
        }


        if (activityList) {
            activityList.innerHTML =
                emptyHTML;
        }


        return;

    }


    const html =
        activities
            .slice(0, 20)
            .map(
                function(activity) {

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

                }
            )
            .join("");


    if (recentActivity) {
        recentActivity.innerHTML =
            html;
    }


    if (activityList) {
        activityList.innerHTML =
            html;
    }

}


/* ==========================================
   DASHBOARD
========================================== */

function updateDashboard() {

    let totalStock = 0;

    let lowStock = 0;

    let totalValue = 0;


    products.forEach(
        function(product) {

            totalStock +=
                Number(product.quantity);

            totalValue +=
                Number(product.quantity) *
                Number(product.price);


            if (
                Number(product.quantity) <=
                Number(product.threshold)
            ) {

                lowStock++;

            }

        }
    );


    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    const totalStockElement =
        document.getElementById(
            "totalStock"
        );


    const lowStockElement =
        document.getElementById(
            "lowStock"
        );


    const inventoryValue =
        document.getElementById(
            "inventoryValue"
        );


    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    if (totalStockElement) {

        totalStockElement.textContent =
            totalStock;

    }


    if (lowStockElement) {

        lowStockElement.textContent =
            lowStock;

    }


    if (inventoryValue) {

        inventoryValue.textContent =
            "₱" +
            totalValue.toLocaleString(
                "en-PH",
                {

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2

                }
            );

    }


    renderLowStock();

}


/* ==========================================
   LOW STOCK
========================================== */

function renderLowStock() {

    const container =
        document.getElementById(
            "lowStockList"
        );


    if (!container) {
        return;
    }


    const lowProducts =
        products.filter(
            function(product) {

                return (
                    Number(product.quantity) <=
                    Number(product.threshold)
                );

            }
        );


    if (lowProducts.length === 0) {

        container.innerHTML =
            "<p>No low-stock products.</p>";

        return;

    }


    container.innerHTML =
        lowProducts
            .map(
                function(product) {

                    return `
                        <div class="stock-item">

                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    product.category
                                )}
                                • SKU:
                                ${escapeHTML(
                                    product.sku
                                )}
                            </small>

                            <span class="low-label">
                                ${product.quantity}
                                pcs remaining
                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* ==========================================
   INVENTORY TABLE
========================================== */

window.renderInventory = function() {

    const table =
        document.getElementById(
            "inventoryTable"
        );


    if (!table) {
        return;
    }


    const searchBox =
        document.getElementById(
            "searchBox"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


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
        products.filter(
            function(product) {

                const searchMatch =
                    product.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.sku
                        .toLowerCase()
                        .includes(search);


                const categoryMatch =
                    !category ||
                    product.category === category;


                return (
                    searchMatch &&
                    categoryMatch
                );

            }
        );


    if (filteredProducts.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML =
        filteredProducts
            .map(
                function(product) {

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    product.name
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    product.sku
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    product.category
                                )}
                            </td>

                            <td>
                                ${product.quantity}
                            </td>

                            <td>
                                ₱${Number(
                                    product.price
                                ).toFixed(2)}
                            </td>

                            <td>
                                ${product.threshold}
                            </td>

                            <td>

                                <button
                                    onclick="editQuantity('${product.id}')">
                                    Edit
                                </button>

                                <button
                                    onclick="deleteProduct('${product.id}')">
                                    Delete
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

};


/* ==========================================
   SEARCH
========================================== */

const searchBox =
    document.getElementById(
        "searchBox"
    );


if (searchBox) {

    searchBox.addEventListener(
        "input",
        renderInventory
    );

}


/* ==========================================
   CATEGORY FILTER
========================================== */

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderInventory
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================
   SESSION CHECK
========================================== */

if (
    sessionStorage.getItem(
        "bakeryLoggedIn"
    ) === "true"
) {

    document
        .getElementById("loginPage")
        ?.classList.add("hidden");


    document
        .getElementById("system")
        ?.classList.remove("hidden");


    updateDashboard();

}
