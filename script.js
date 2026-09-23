// ==========================================
// ARBEE'S BAKE SHOP INVENTORY SYSTEM
// ==========================================


// ==========================================
// LOGIN / AUTHENTICATION
// ==========================================

function registerAccount() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        document.getElementById("loginMessage").textContent =
            "Enter an email and password first.";

        return;
    }


    if (password.length < 6) {

        document.getElementById("loginMessage").textContent =
            "Password must be at least 6 characters.";

        return;
    }


    auth.createUserWithEmailAndPassword(
        email,
        password
    )
    .then(() => {

        document.getElementById("loginMessage")
            .style.color = "green";

        document.getElementById("loginMessage")
            .textContent =
            "Account created successfully!";

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1000);

    })
    .catch(error => {

        document.getElementById("loginMessage")
            .style.color = "red";

        document.getElementById("loginMessage")
            .textContent =
            error.message;

    });

}


if (document.getElementById("loginForm")) {

    document
        .getElementById("loginForm")
        .addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                loginUser();

            }
        );

}


function loginUser() {

    const email =
        document.getElementById("email")
            .value.trim();

    const password =
        document.getElementById("password")
            .value;


    const message =
        document.getElementById("loginMessage");


    auth.signInWithEmailAndPassword(
        email,
        password
    )
    .then(() => {

        window.location.href =
            "dashboard.html";

    })
    .catch(error => {

        message.style.color = "red";

        message.textContent =
            "Login failed: " +
            error.message;

    });

}


function logout() {

    auth.signOut()
        .then(() => {

            window.location.href =
                "index.html";

        });

}


// ==========================================
// AUTH CHECK
// ==========================================

auth.onAuthStateChanged(function(user) {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (
        !user &&
        currentPage !== "index.html" &&
        currentPage !== ""
    ) {

        window.location.href =
            "index.html";

    }

});


// ==========================================
// PRODUCT DATABASE
// ==========================================

function getProductsReference() {

    return database.ref("products");

}


// ==========================================
// PRODUCT STATUS
// ==========================================

function getStatus(quantity) {

    quantity = Number(quantity);


    if (quantity === 0) {

        return `
            <span class="badge out-stock">
                Out of Stock
            </span>
        `;

    }


    if (quantity <= 10) {

        return `
            <span class="badge low-stock">
                Low Stock
            </span>
        `;

    }


    return `
        <span class="badge in-stock">
            In Stock
        </span>
    `;

}


// ==========================================
// DASHBOARD
// ==========================================

if (
    document.getElementById("totalProducts")
) {

    loadDashboard();

}


function loadDashboard() {

    getProductsReference()
        .on("value", function(snapshot) {

            const data =
                snapshot.val() || {};

            const products =
                Object.keys(data)
                    .map(key => ({
                        id: key,
                        ...data[key]
                    }));


            let totalProducts =
                products.length;

            let totalStock = 0;

            let lowStock = 0;

            let outStock = 0;


            products.forEach(product => {

                const quantity =
                    Number(product.quantity) || 0;

                totalStock += quantity;


                if (
                    quantity > 0 &&
                    quantity <= 10
                ) {

                    lowStock++;

                }


                if (quantity === 0) {

                    outStock++;

                }

            });


            document.getElementById(
                "totalProducts"
            ).textContent =
                totalProducts;


            document.getElementById(
                "totalStock"
            ).textContent =
                totalStock;


            document.getElementById(
                "lowStock"
            ).textContent =
                lowStock;


            document.getElementById(
                "outStock"
            ).textContent =
                outStock;


            displayDashboardProducts(
                products
            );

        });

}


function displayDashboardProducts(
    products
) {

    const table =
        document.getElementById(
            "dashboardProducts"
        );


    if (!table) return;


    table.innerHTML = "";


    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No products yet.
                </td>
            </tr>
        `;

        return;

    }


    products.forEach(product => {

        table.innerHTML += `

            <tr>

                <td>
                    ${escapeHTML(product.name)}
                </td>

                <td>
                    ${escapeHTML(product.category)}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ₱${Number(product.price)
                        .toFixed(2)}
                </td>

                <td>
                    ${getStatus(product.quantity)}
                </td>

            </tr>

        `;

    });

}


// ==========================================
// PRODUCT PAGE
// ==========================================

if (
    document.getElementById("productTable")
) {

    loadProducts();

}


function loadProducts() {

    getProductsReference()
        .on("value", function(snapshot) {

            const data =
                snapshot.val() || {};

            const products =
                Object.keys(data)
                    .map(key => ({
                        id: key,
                        ...data[key]
                    }));


            window.allProducts =
                products;


            displayProducts(products);

        });

}


function displayProducts(
    products
) {

    const table =
        document.getElementById(
            "productTable"
        );


    if (!table) return;


    table.innerHTML = "";


    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    products.forEach(product => {

        table.innerHTML += `

            <tr>

                <td>
                    ${escapeHTML(product.name)}
                </td>

                <td>
                    ${escapeHTML(product.category)}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ₱${Number(product.price)
                        .toFixed(2)}
                </td>

                <td>
                    ${getStatus(product.quantity)}
                </td>

                <td>

                    <button
                        class="action-button edit-button"
                        onclick="editProduct('${product.id}')">

                        Edit

                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteProduct('${product.id}')">

                        Delete

                    </button>

                </td>

            </tr>

        `;

    });

}


// ==========================================
// SEARCH
// ==========================================

function searchProducts() {

    const search =
        document.getElementById(
            "searchProduct"
        )
        .value
        .toLowerCase()
        .trim();


    const filtered =
        (window.allProducts || [])
        .filter(product => {

            return (
                product.name
                    .toLowerCase()
                    .includes(search)
                ||
                product.category
                    .toLowerCase()
                    .includes(search)
            );

        });


    displayProducts(filtered);

}


// ==========================================
// OPEN PRODUCT FORM
// ==========================================

function openProductForm() {

    document.getElementById(
        "productForm"
    ).style.display = "block";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Add Product";


    document.getElementById(
        "productFormElement"
    ).reset();


    document.getElementById(
        "editProductId"
    ).value = "";

}


// ==========================================
// CLOSE PRODUCT FORM
// ==========================================

function closeProductForm() {

    document.getElementById(
        "productForm"
    ).style.display = "none";

}


// ==========================================
// SAVE PRODUCT
// ==========================================

if (
    document.getElementById(
        "productFormElement"
    )
) {

    document
        .getElementById(
            "productFormElement"
        )
        .addEventListener(
            "submit",
            saveProduct
        );

}


function saveProduct(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "editProductId"
        ).value;


    const name =
        document.getElementById(
            "productName"
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


    if (!name) {

        alert("Please enter a product name.");

        return;

    }


    if (quantity < 0) {

        alert("Quantity cannot be negative.");

        return;

    }


    if (price < 0) {

        alert("Price cannot be negative.");

        return;

    }


    const productData = {

        name: name,

        category: category,

        quantity: quantity,

        price: price,

        updatedAt:
            firebase.database.ServerValue
                .TIMESTAMP

    };


    if (id) {

        database
            .ref("products/" + id)
            .update(productData)
            .then(() => {

                alert(
                    "Product updated successfully!"
                );

                closeProductForm();

            })
            .catch(error => {

                alert(
                    "Error: " +
                    error.message
                );

            });

    } else {

        database
            .ref("products")
            .push(productData)
            .then(() => {

                alert(
                    "Product added successfully!"
                );

                closeProductForm();

            })
            .catch(error => {

                alert(
                    "Error: " +
                    error.message
                );

            });

    }

}


// ==========================================
// EDIT PRODUCT
// ==========================================

function editProduct(id) {

    const product =
        (window.allProducts || [])
        .find(p => p.id === id);


    if (!product) return;


    document.getElementById(
        "productForm"
    ).style.display = "block";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Edit Product";


    document.getElementById(
        "editProductId"
    ).value = id;


    document.getElementById(
        "productName"
    ).value =
        product.name;


    document.getElementById(
        "productCategory"
    ).value =
        product.category;


    document.getElementById(
        "productQuantity"
    ).value =
        product.quantity;


    document.getElementById(
        "productPrice"
    ).value =
        product.price;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// DELETE PRODUCT
// ==========================================

function deleteProduct(id) {

    const product =
        (window.allProducts || [])
        .find(p => p.id === id);


    if (!product) return;


    const answer =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!answer) return;


    database
        .ref("products/" + id)
        .remove()
        .then(() => {

            alert(
                "Product deleted successfully!"
            );

        })
        .catch(error => {

            alert(
                "Error: " +
                error.message
            );

        });

}


// ==========================================
// STOCK PAGE
// ==========================================

if (
    document.getElementById("stockProduct")
) {

    loadStockPage();

}


function loadStockPage() {

    getProductsReference()
        .on("value", function(snapshot) {

            const data =
                snapshot.val() || {};

            const products =
                Object.keys(data)
                    .map(key => ({
                        id: key,
                        ...data[key]
                    }));


            window.stockProducts =
                products;


            updateStockProductSelect(
                products
            );


            displayStockTable(
                products
            );

        });

}


function updateStockProductSelect(
    products
) {

    const select =
        document.getElementById(
            "stockProduct"
        );


    if (!select) return;


    select.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;


    products.forEach(product => {

        select.innerHTML += `

            <option value="${product.id}">

                ${escapeHTML(product.name)}
                - Stock: ${product.quantity}

            </option>

        `;

    });

}


function displayStockTable(
    products
) {

    const table =
        document.getElementById(
            "stockTable"
        );


    if (!table) return;


    table.innerHTML = "";


    products.forEach(product => {

        table.innerHTML += `

            <tr>

                <td>
                    ${escapeHTML(product.name)}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ${getStatus(product.quantity)}
                </td>

            </tr>

        `;

    });

}


// ==========================================
// STOCK TRANSACTION
// ==========================================

if (
    document.getElementById("stockForm")
) {

    document
        .getElementById("stockForm")
        .addEventListener(
            "submit",
            processStock
        );

}


function processStock(event) {

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


    const message =
        document.getElementById(
            "stockMessage"
        );


    if (!productId) {

        message.style.color = "red";

        message.textContent =
            "Please select a product.";

        return;

    }


    if (!amount || amount <= 0) {

        message.style.color = "red";

        message.textContent =
            "Please enter a valid quantity.";

        return;

    }


    const product =
        (window.stockProducts || [])
        .find(
            p => p.id === productId
        );


    if (!product) {

        message.style.color = "red";

        message.textContent =
            "Product not found.";

        return;

    }


    const currentStock =
        Number(product.quantity) || 0;


    let newStock;


    if (type === "in") {

        newStock =
            currentStock + amount;

    } else {

        if (amount > currentStock) {

            message.style.color = "red";

            message.textContent =
                "Not enough stock.";

            return;

        }


        newStock =
            currentStock - amount;

    }


    database
        .ref("products/" + productId)
        .update({

            quantity: newStock,

            updatedAt:
                firebase.database
                    .ServerValue
                    .TIMESTAMP

        })
        .then(() => {

            message.style.color = "green";

            message.textContent =
                type === "in"
                ? "Stock added successfully!"
                : "Stock removed successfully!";


            document
                .getElementById(
                    "stockForm"
                )
                .reset();

        })
        .catch(error => {

            message.style.color = "red";

            message.textContent =
                error.message;

        });

}


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

    if (value === undefined ||
        value === null) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
