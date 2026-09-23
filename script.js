/* =====================================
   FIREBASE CONFIG
===================================== */

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


/* =====================================
   INITIALIZE FIREBASE
===================================== */

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

const productsRef = database.ref("products");


/* =====================================
   VARIABLES
===================================== */

let products = {};
let currentUser = null;


/* =====================================
   PAGE ELEMENTS
===================================== */

const loginSection = document.getElementById("login");

const dashboardSection =
    document.getElementById("dashboard");

const productsSection =
    document.getElementById("products");

const stockSection =
    document.getElementById("stock");


/* =====================================
   HIDE APP AT START
===================================== */

dashboardSection.style.display = "none";
productsSection.style.display = "none";
stockSection.style.display = "none";


/* =====================================
   LOGIN FORM
===================================== */

const loginForm = document.querySelector("#login form");

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    try {

        await auth.signInWithEmailAndPassword(
            email,
            password
        );

        alert("Login successful!");

        loginSection.style.display = "none";

        dashboardSection.style.display = "block";

        loadProducts();

    } catch (error) {

        alert("Login failed: " + error.message);

    }

});


/* =====================================
   CREATE ACCOUNT
===================================== */

const createAccountButton =
    document.querySelector("#login button:last-child");


createAccountButton.addEventListener(
    "click",
    async function() {

        const email =
            prompt("Enter your email:");

        if (!email) {
            return;
        }

        const password =
            prompt("Create a password (minimum 6 characters):");

        if (!password) {
            return;
        }

        try {

            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

            alert("Account created successfully!");

        } catch (error) {

            alert(
                "Registration failed: " +
                error.message
            );

        }

    }
);


/* =====================================
   LOGOUT
===================================== */

const logoutButtons =
    document.querySelectorAll("nav button");


logoutButtons.forEach(function(button) {

    if (
        button.textContent
            .toLowerCase()
            .includes("logout")
    ) {

        button.addEventListener(
            "click",
            async function() {

                try {

                    await auth.signOut();

                    dashboardSection.style.display =
                        "none";

                    productsSection.style.display =
                        "none";

                    stockSection.style.display =
                        "none";

                    loginSection.style.display =
                        "block";

                } catch (error) {

                    alert(error.message);

                }

            }
        );

    }

});


/* =====================================
   NAVIGATION
===================================== */

const navButtons =
    document.querySelectorAll("nav button");


navButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            const name =
                button.textContent
                    .trim()
                    .toLowerCase();


            dashboardSection.style.display =
                "none";

            productsSection.style.display =
                "none";

            stockSection.style.display =
                "none";


            if (name.includes("dashboard")) {

                dashboardSection.style.display =
                    "block";

            }

            else if (name.includes("products")) {

                productsSection.style.display =
                    "block";

            }

            else if (name.includes("stock")) {

                stockSection.style.display =
                    "block";

            }

        }
    );

});


/* =====================================
   LOAD PRODUCTS
===================================== */

function loadProducts() {

    productsRef.on("value", function(snapshot) {

        products = snapshot.val() || {};

        displayProducts();

        displayDashboard();

        displayStockProducts();

    });

}


/* =====================================
   ADD PRODUCT
===================================== */

const productForm =
    productsSection.querySelector("form");


productForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const name =
            document.getElementById(
                "productName"
            ).value.trim();


        const category =
            document.getElementById(
                "category"
            ).value;


        const price =
            Number(
                document.getElementById(
                    "price"
                ).value
            );


        const quantity =
            Number(
                document.getElementById(
                    "quantity"
                ).value
            );


        const lowStock =
            Number(
                document.getElementById(
                    "lowStock"
                ).value
            );


        if (!name || !category) {

            alert("Please complete the product information.");

            return;

        }


        try {

            const newProduct =
                productsRef.push();


            await newProduct.set({

                name: name,

                category: category,

                price: price,

                quantity: quantity,

                lowStock: lowStock,

                createdAt:
                    new Date().toISOString()

            });


            alert("Product added successfully!");

            productForm.reset();

            document.getElementById(
                "lowStock"
            ).value = 5;


        } catch (error) {

            alert(
                "Error adding product: " +
                error.message
            );

        }

    }
);


/* =====================================
   DISPLAY PRODUCTS
===================================== */

function displayProducts() {

    const tableBody =
        productsSection.querySelector("tbody");


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    Object.keys(products).forEach(function(id) {

        const product = products[id];


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${escapeHTML(product.name)}</td>

            <td>${escapeHTML(product.category)}</td>

            <td>₱${Number(product.price).toFixed(2)}</td>

            <td>${product.quantity}</td>

            <td>${product.lowStock}</td>

            <td>

                <button
                    type="button"
                    onclick="editProduct('${id}')">
                    Edit
                </button>

                <button
                    type="button"
                    onclick="deleteProduct('${id}')">
                    Delete
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =====================================
   EDIT PRODUCT
===================================== */

window.editProduct = function(id) {

    const product = products[id];

    if (!product) {
        return;
    }


    document.getElementById(
        "productName"
    ).value = product.name;


    document.getElementById(
        "category"
    ).value = product.category;


    document.getElementById(
        "price"
    ).value = product.price;


    document.getElementById(
        "quantity"
    ).value = product.quantity;


    document.getElementById(
        "lowStock"
    ).value = product.lowStock;


    productForm.dataset.editId = id;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

};


/* =====================================
   DELETE PRODUCT
===================================== */

window.deleteProduct = async function(id) {

    const product = products[id];

    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await productsRef
            .child(id)
            .remove();


        alert("Product deleted!");

    } catch (error) {

        alert(
            "Delete failed: " +
            error.message
        );

    }

};


/* =====================================
   SEARCH PRODUCTS
===================================== */

const searchInput =
    document.getElementById("search");


searchInput.addEventListener(
    "input",
    function() {

        const search =
            searchInput.value
                .toLowerCase()
                .trim();


        const tableBody =
            productsSection.querySelector("tbody");


        tableBody.innerHTML = "";


        Object.keys(products).forEach(function(id) {

            const product = products[id];


            if (
                product.name
                    .toLowerCase()
                    .includes(search) ||

                product.category
                    .toLowerCase()
                    .includes(search)
            ) {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${escapeHTML(product.name)}
                    </td>

                    <td>
                        ${escapeHTML(product.category)}
                    </td>

                    <td>
                        ₱${Number(product.price).toFixed(2)}
                    </td>

                    <td>
                        ${product.quantity}
                    </td>

                    <td>
                        ${product.lowStock}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editProduct('${id}')">
                            Edit
                        </button>

                        <button
                            type="button"
                            onclick="deleteProduct('${id}')">
                            Delete
                        </button>

                    </td>

                `;


                tableBody.appendChild(row);

            }

        });

    }
);


/* =====================================
   STOCK PRODUCT DROPDOWN
===================================== */

function displayStockProducts() {

    const select =
        document.getElementById(
            "stockProduct"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;


    Object.keys(products).forEach(function(id) {

        const product = products[id];


        const option =
            document.createElement("option");


        option.value = id;

        option.textContent =
            product.name +
            " - Stock: " +
            product.quantity;


        select.appendChild(option);

    });

}


/* =====================================
   STOCK FORM
===================================== */

const stockForm =
    stockSection.querySelector("form");


stockForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const productId =
            document.getElementById(
                "stockProduct"
            ).value;


        const type =
            document.getElementById(
                "stockType"
            ).value;


        const amount =
            Number(
                document.getElementById(
                    "stockQuantity"
                ).value
            );


        if (!productId || !type || amount <= 0) {

            alert(
                "Please complete the stock information."
            );

            return;

        }


        const product =
            products[productId];


        if (!product) {

            alert("Product not found.");

            return;

        }


        let newQuantity =
            Number(product.quantity);


        if (type === "stock-in") {

            newQuantity =
                newQuantity + amount;

        }


        if (type === "stock-out") {

            if (amount > newQuantity) {

                alert(
                    "Not enough stock!"
                );

                return;

            }

            newQuantity =
                newQuantity - amount;

        }


        try {

            await productsRef
                .child(productId)
                .update({

                    quantity: newQuantity

                });


            await database
                .ref("stockTransactions")
                .push({

                    productId: productId,

                    productName: product.name,

                    type: type,

                    quantity: amount,

                    date:
                        new Date().toISOString()

                });


            alert(
                "Stock transaction saved!"
            );


            stockForm.reset();


        } catch (error) {

            alert(
                "Transaction failed: " +
                error.message
            );

        }

    }
);


/* =====================================
   DISPLAY STOCK TABLE
===================================== */

function displayStockTable() {

    const table =
        stockSection.querySelector("tbody");


    if (!table) {
        return;
    }


    table.innerHTML = "";


    Object.keys(products).forEach(function(id) {

        const product = products[id];

        let status = "";

        let statusClass = "";


        if (product.quantity <= 0) {

            status = "Out of Stock";

            statusClass =
                "status-out";

        }

        else if (
            product.quantity <= product.lowStock
        ) {

            status = "Low Stock";

            statusClass =
                "status-low";

        }

        else {

            status = "Available";

            statusClass =
                "status-available";

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.name)}
            </td>

            <td>
                ${escapeHTML(product.category)}
            </td>

            <td>
                ${product.quantity}
            </td>

            <td class="${statusClass}">
                ${status}
            </td>

        `;


        table.appendChild(row);

    });

}


/* =====================================
   DASHBOARD
===================================== */

function displayDashboard() {

    const productList =
        Object.values(products);


    const totalProducts =
        productList.length;


    const totalStock =
        productList.reduce(
            function(total, product) {

                return total +
                    Number(product.quantity || 0);

            },
            0
        );


    const lowStock =
        productList.filter(
            function(product) {

                return (
                    Number(product.quantity) > 0 &&
                    Number(product.quantity) <=
                    Number(product.lowStock)
                );

            }
        ).length;


    const outStock =
        productList.filter(
            function(product) {

                return Number(product.quantity) <= 0;

            }
        ).length;


    const cards =
        document.querySelectorAll(
            "#dashboard article p"
        );


    if (cards.length >= 4) {

        cards[0].textContent =
            totalProducts;

        cards[1].textContent =
            totalStock;

        cards[2].textContent =
            lowStock;

        cards[3].textContent =
            outStock;

    }


    displayDashboardTable();

    displayStockTable();

}


/* =====================================
   DASHBOARD TABLE
===================================== */

function displayDashboardTable() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    const table =
        dashboard.querySelector("table");


    if (!table) {

        createDashboardTable();

        return;

    }


    const tbody =
        table.querySelector("tbody");


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    Object.keys(products).forEach(function(id) {

        const product = products[id];


        let status = "";

        let statusClass = "";


        if (product.quantity <= 0) {

            status =
                "Out of Stock";

            statusClass =
                "status-out";

        }

        else if (
            product.quantity <= product.lowStock
        ) {

            status =
                "Low Stock";

            statusClass =
                "status-low";

        }

        else {

            status =
                "Available";

            statusClass =
                "status-available";

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(product.name)}
            </td>

            <td>
                ${escapeHTML(product.category)}
            </td>

            <td>
                ₱${Number(product.price).toFixed(2)}
            </td>

            <td>
                ${product.quantity}
            </td>

            <td class="${statusClass}">
                ${status}
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =====================================
   CREATE DASHBOARD TABLE
===================================== */

function createDashboardTable() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    const heading =
        document.createElement("h3");


    heading.textContent =
        "Current Inventory";


    dashboard.appendChild(heading);


    const table =
        document.createElement("table");


    table.innerHTML = `

        <thead>

            <tr>

                <th>Product</th>

                <th>Category</th>

                <th>Price</th>

                <th>Stock</th>

                <th>Status</th>

            </tr>

        </thead>

        <tbody></tbody>

    `;


    dashboard.appendChild(table);

}


/* =====================================
   ESCAPE HTML
===================================== */

function escapeHTML(value) {

    if (value === undefined || value === null) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================
   FIREBASE AUTH CHECK
===================================== */

auth.onAuthStateChanged(function(user) {

    currentUser = user;


    if (user) {

        loginSection.style.display =
            "none";

        dashboardSection.style.display =
            "block";

        loadProducts();

    }

});


/* =====================================
   START
===================================== */

console.log(
    "Arbee's Bake Shop Inventory System loaded."
);
