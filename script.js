// =========================
// ELEMENTS
// =========================
const productCards = document.querySelectorAll(".product");
const cartBox = document.querySelector(".cart");
const cartCount = document.querySelector(".cart-count");
const cartList = document.querySelector(".cart-list");
const grandTotal = document.querySelector(".grand-total");
const confirmBtn = document.querySelector(".confirm-btn");
const modal = document.querySelector(".confirm-modal");
const orderList = document.querySelector(".order-list");
const newOrderBtn = document.querySelector(".new-order-btn");

// cart items: { name, price, qty, thumbnail, card }
let cart = [];

// =========================
// HELPERS
// =========================
function money(num) {
    return "$" + Number(num).toFixed(2);
}

function findItem(name) {
    return cart.find(function (item) {
        return item.name === name;
    });
}

function photoSrc(card) {
    const img = card.querySelector(":scope > img");
    return img.currentSrc || img.src || img.getAttribute("src") || "";
}

function thumbSrc(card) {
    return photoSrc(card)
        .replace("-desktop.jpg", "-thumbnail.jpg")
        .replace("-tablet.jpg", "-thumbnail.jpg")
        .replace("-mobile.jpg", "-thumbnail.jpg");
}

function putThumb(img, item) {
    img.src = item.thumbnail || photoSrc(item.card);
    img.alt = "";
    img.onerror = function () {
        img.onerror = null;
        img.src = photoSrc(item.card);
    };
}

function ensureQtyBar(card) {
    let bar = card.querySelector(".qty-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "qty-bar";
        card.appendChild(bar);
    }

    bar.innerHTML =
        '<button type="button" class="minus" aria-label="Decrease">−</button>' +
        '<span class="qty-num">1</span>' +
        '<button type="button" class="plus" aria-label="Increase">+</button>';
}

// =========================
// FILL CARDS FROM JSON
// =========================
fetch("data.json")
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        productCards.forEach(function (card, index) {
            const product = data[index];
            if (!product) return;

            const img = card.querySelector(":scope > img");
            img.src = product.image.desktop;
            img.alt = product.name;

            card.querySelector(".category").textContent = product.category;
            card.querySelector(".name").textContent = product.name;
            card.querySelector(".price").textContent = money(product.price);

            card.dataset.name = product.name;
            card.dataset.price = product.price;
            card.dataset.thumb = thumbSrc(card);

            ensureQtyBar(card);
        });
    })
    .catch(function () {
        productCards.forEach(function (card) {
            const name = card.querySelector(".name").textContent;
            const price = Number(card.querySelector(".price").textContent.replace("$", ""));
            const src = card.querySelector(":scope > img").getAttribute("src") || "";

            card.dataset.name = name;
            card.dataset.price = price;
            card.dataset.thumb = thumbSrc(card);
            ensureQtyBar(card);
        });
    });

// bars still exist if fetch is slow
productCards.forEach(ensureQtyBar);

// =========================
// DRAW CART
// =========================
function renderCart() {
    cartList.innerHTML = "";

    let totalQty = 0;
    let totalMoney = 0;

    cart.forEach(function (item) {
        totalQty += item.qty;
        totalMoney += item.price * item.qty;

        const li = document.createElement("li");
        li.className = "cart-item";

        const thumb = document.createElement("img");
        thumb.className = "cart-thumb";
        putThumb(thumb, item);

        const info = document.createElement("div");
        info.innerHTML =
            "<h3>" + item.name + "</h3>" +
            "<p class='cart-meta'><span class='qty'>" + item.qty + "x</span> @ " +
            money(item.price) + " <span class='cart-item-total'>" +
            money(item.price * item.qty) + "</span></p>";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("aria-label", "Remove");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", function () {
            removeAll(item.name);
        });

        li.appendChild(thumb);
        li.appendChild(info);
        li.appendChild(removeBtn);
        cartList.appendChild(li);
    });

    cartCount.textContent = totalQty;
    grandTotal.textContent = money(totalMoney);

    if (cart.length === 0) {
        cartBox.classList.add("empty");
    } else {
        cartBox.classList.remove("empty");
    }
}

function updateCardQty(item) {
    const qtyNum = item.card.querySelector(".qty-num");
    if (qtyNum) qtyNum.textContent = item.qty;
}

// =========================
// CART ACTIONS
// =========================
function addItem(card) {
    const name = card.dataset.name || card.querySelector(".name").textContent;
    const price = Number(card.dataset.price || card.querySelector(".price").textContent.replace("$", ""));
    const thumbnail = card.dataset.thumb || thumbSrc(card);
    let item = findItem(name);

    if (!item) {
        item = {
            name: name,
            price: price,
            thumbnail: thumbnail,
            card: card,
            qty: 1
        };
        cart.push(item);
        card.classList.add("selected");
    } else {
        item.qty += 1;
    }

    updateCardQty(item);
    renderCart();
}

function minusItem(card) {
    const name = card.dataset.name || card.querySelector(".name").textContent;
    const item = findItem(name);
    if (!item) return;

    item.qty -= 1;

    if (item.qty <= 0) {
        removeAll(name);
        return;
    }

    updateCardQty(item);
    renderCart();
}

function removeAll(name) {
    const item = findItem(name);
    if (!item) return;

    item.card.classList.remove("selected");
    const qtyNum = item.card.querySelector(".qty-num");
    if (qtyNum) qtyNum.textContent = "1";

    cart = cart.filter(function (i) {
        return i.name !== name;
    });
    renderCart();
}

// =========================
// CLICKS ON CARDS
// =========================
document.querySelector(".products").addEventListener("click", function (e) {
    const card = e.target.closest(".product");
    if (!card) return;

    if (e.target.closest(".add-btn") || e.target.closest(".plus")) {
        addItem(card);
    }

    if (e.target.closest(".minus")) {
        minusItem(card);
    }
});

// =========================
// CONFIRM + RESET
// =========================
confirmBtn.addEventListener("click", function () {
    if (cart.length === 0) return;

    orderList.innerHTML = "";
    let totalMoney = 0;

    cart.forEach(function (item) {
        totalMoney += item.price * item.qty;

        const li = document.createElement("li");
        li.className = "order-row";

        const thumb = document.createElement("img");
        putThumb(thumb, item);

        const info = document.createElement("div");
        info.innerHTML =
            "<h3>" + item.name + "</h3>" +
            "<p class='cart-meta'><span class='qty'>" + item.qty + "x</span> @ " +
            money(item.price) + "</p>";

        const lineTotal = document.createElement("span");
        lineTotal.className = "line-total";
        lineTotal.textContent = money(item.price * item.qty);

        li.appendChild(thumb);
        li.appendChild(info);
        li.appendChild(lineTotal);
        orderList.appendChild(li);
    });

    const totalLine = document.createElement("p");
    totalLine.className = "order-total";
    totalLine.innerHTML = "Order Total <span>" + money(totalMoney) + "</span>";
    orderList.appendChild(totalLine);

    modal.showModal();
});

newOrderBtn.addEventListener("click", function () {
    cart.forEach(function (item) {
        item.card.classList.remove("selected");
        const qtyNum = item.card.querySelector(".qty-num");
        if (qtyNum) qtyNum.textContent = "1";
    });
    cart = [];
    renderCart();
    modal.close();
});

renderCart()