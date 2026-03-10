/* ===============================
   FIREBASE CONFIG
=============================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvdBYSLanVfnz5TiTWAyxIKPbee8fMDYw",
  authDomain: "rare-mens-clothing.firebaseapp.com",
  projectId: "rare-mens-clothing",
  storageBucket: "rare-mens-clothing.appspot.com",
  messagingSenderId: "409895222910",
  appId: "1:409895222910:web:dca2c6d2431730077ba22f"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


/* ===============================
   LOAD PRODUCTS (FROM FIREBASE)
=============================== */

async function loadStoreProducts() {

  const snapshot = await getDocs(collection(db, "products"));

  snapshot.forEach((docData) => {

    let product   = docData.data();
    let container;

    if (product.category === "shirts")      container = document.querySelector("#shirts .products");
    if (product.category === "tshirts")     container = document.querySelector("#tshirts .products");
    if (product.category === "pants")       container = document.querySelector("#pants .products");
    if (product.category === "trackpants")  container = document.querySelector("#trackpants .products");

    if (!container) return;

    let sizesHTML = product.category === "pants"
      ? `<option value="">Select Size</option><option>30</option><option>32</option><option>34</option><option>36</option>`
      : `<option value="">Select Size</option><option>S</option><option>M</option><option>L</option><option>XL</option>`;

    container.innerHTML += `
      <div class="product">
        <div class="product-img-wrap" onclick="openQuickView('${product.name}','₹${product.price}','${product.image}','${product.description || ""}','${product.category}')">
          <img src="${product.image}" loading="lazy">
          <div class="quick-view-btn">Quick View</div>
        </div>
        <h3>${product.name}</h3>
        <p class="price">₹${product.price}</p>
        <select class="size">${sizesHTML}</select>
        <input type="number" class="qty" value="1" min="1">
        <button onclick="addToCart('${product.name}',${product.price},this)">Add to Cart</button>
      </div>
    `;
  });
}

loadStoreProducts();


/* ===============================
   CART DATA
=============================== */

let cart  = [];
let total = 0;


/* ===============================
   ADD TO CART
=============================== */

window.addToCart = function(name, price, button) {

  let product  = button.parentElement;
  let size     = product.querySelector(".size").value;
  let qtyInput = product.querySelector(".qty");
  let qty      = qtyInput ? parseInt(qtyInput.value) : 1;

  if (!size || size === "Select Size") {
    showToast("Please select a size", "error");
    return;
  }

  cart.push({ name, price, size, qty });
  total += price * qty;

  updateCart();
  bounceCart();
  showToast(name, "success", size, qty);
  flashButton(button);
};


/* ===============================
   FLASH BUTTON ON ADD
=============================== */

function flashButton(btn) {
  let orig = btn.textContent;
  btn.textContent   = "✓ Added!";
  btn.style.background = "#1db954";
  setTimeout(() => {
    btn.textContent      = orig;
    btn.style.background = "";
  }, 1200);
}


/* ===============================
   CART ICON BOUNCE
=============================== */

function bounceCart() {
  let icon = document.getElementById("cartIcon");
  if (!icon) return;
  icon.classList.remove("bounce");
  void icon.offsetWidth; // force reflow so animation restarts
  icon.classList.add("bounce");
  icon.addEventListener("animationend", () => icon.classList.remove("bounce"), { once: true });
}


/* ===============================
   UPDATE CART DRAWER
=============================== */

window.updateCart = function() {

  let list = document.getElementById("cart-items");
  if (!list) return;

  list.innerHTML = "";
  total = 0;

  cart.forEach((item, index) => {

    let itemTotal = item.price * item.qty;

    let li = document.createElement("li");
    li.innerHTML = `
      <b>${item.name}</b><br>
      Size: ${item.size}<br>
      <div class="cart-qty">
        <button onclick="decreaseQty(${index})">-</button>
        <span>${item.qty}</span>
        <button onclick="increaseQty(${index})">+</button>
      </div>
      ₹${itemTotal}
      <button class="remove-btn" onclick="removeItem(${index})">❌</button>
    `;

    list.appendChild(li);
    total += itemTotal;
  });

  document.getElementById("cart-total").innerText = total;

  let cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.innerText = cart.length;
};


/* ===============================
   INCREASE / DECREASE / REMOVE
=============================== */

window.increaseQty = function(index) {
  cart[index].qty++;
  updateCart();
};

window.decreaseQty = function(index) {
  if (cart[index].qty > 1) cart[index].qty--;
  updateCart();
};

window.removeItem = function(index) {
  cart.splice(index, 1);
  updateCart();
};


/* ===============================
   TOAST NOTIFICATIONS
=============================== */

function showToast(name, type = "success", size = "", qty = 1) {

  let container = document.getElementById("toast-container");
  let toast     = document.createElement("div");

  toast.className = "toast" + (type === "error" ? " error" : "");

  if (type === "success") {
    toast.innerHTML = `
      <div class="toast-icon">✓</div>
      <div class="toast-text">
        <div class="toast-name">${name}</div>
        <div class="toast-sub">Size ${size} · Qty ${qty} added to cart</div>
      </div>
      <div class="toast-progress"></div>
    `;
  } else {
    toast.innerHTML = `
      <div class="toast-icon">!</div>
      <div class="toast-text">
        <div class="toast-name">${name}</div>
      </div>
      <div class="toast-progress"></div>
    `;
  }

  container.appendChild(toast);

  // Animate in (double rAF ensures transition fires)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Animate out
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Make showToast available globally (used from quick view too)
window.showToast = showToast;


/* ===============================
   CHECKOUT — opens delivery modal
=============================== */

window.checkout = function() {

  if (cart.length === 0) {
    showToast("Your cart is empty", "error");
    return;
  }

  // Update summary bar
  document.getElementById("display-total").textContent = total;
  let finalAmt = total >= 1999 ? total - 200 : total;
  document.getElementById("display-final").textContent = finalAmt;
  document.getElementById("discount-tag").classList.toggle("show", total >= 1999);

  document.getElementById("deliveryModal").classList.add("open");
  document.body.style.overflow = "hidden";
};


/* ===============================
   DELIVERY MODAL
=============================== */

window.closeDeliveryModal = function() {
  document.getElementById("deliveryModal").classList.remove("open");
  document.body.style.overflow = "";
};

// Close on overlay click
document.getElementById("deliveryModal").addEventListener("click", function(e) {
  if (e.target === this) window.closeDeliveryModal();
});

// Phone & pincode — digits only
document.getElementById("d_phone").addEventListener("input", function() {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
});
document.getElementById("d_pincode").addEventListener("input", function() {
  this.value = this.value.replace(/\D/g, "").slice(0, 6);
});

window.confirmOrder = function() {

  // Clear previous errors
  ["d_name","d_phone","d_address","d_city","d_pincode"].forEach(id => {
    document.getElementById(id).classList.remove("error");
  });

  let name    = document.getElementById("d_name").value.trim();
  let phone   = document.getElementById("d_phone").value.trim();
  let address = document.getElementById("d_address").value.trim();
  let city    = document.getElementById("d_city").value.trim();
  let pincode = document.getElementById("d_pincode").value.trim();

  let valid = true;
  if (!name)                         { document.getElementById("d_name").classList.add("error");    valid = false; }
  if (!phone || phone.length < 10)   { document.getElementById("d_phone").classList.add("error");   valid = false; }
  if (!address)                      { document.getElementById("d_address").classList.add("error"); valid = false; }
  if (!city)                         { document.getElementById("d_city").classList.add("error");    valid = false; }
  if (!pincode || pincode.length < 6){ document.getElementById("d_pincode").classList.add("error"); valid = false; }

  if (!valid) {
    showToast("Please fill all fields correctly", "error");
    return;
  }

  // Generate order
  let orderId = "RMC-" + Math.floor(Math.random() * 10000);
  let today   = new Date();
  let date    =
    today.getDate().toString().padStart(2, "0") + "-" +
    (today.getMonth() + 1).toString().padStart(2, "0") + "-" +
    today.getFullYear();

  let finalTotal   = total >= 1999 ? total - 200 : total;
  let discountLine = total >= 1999 ? "\n🎉 Discount Applied: -₹200" : "";

  let message  = "Hello 👋 New Order Received!\n\n";
  message     += "🧾 Order ID: " + orderId + "\n";
  message     += "📅 Date: " + date + "\n\n";
  message     += "👤 Customer Details\n";
  message     += "------------------------\n";
  message     += "Name: " + name + "\n";
  message     += "Phone: +91 " + phone + "\n";
  message     += "Address: " + address + "\n";
  message     += "City: " + city + "\n";
  message     += "Pincode: " + pincode + "\n\n";
  message     += "🛒 Order Items\n";
  message     += "------------------------\n\n";

  cart.forEach(item => {
    let t = item.price * item.qty;
    message +=
      "Product: " + item.name + "\n" +
      "Size: " + item.size + "\n" +
      "Qty: " + item.qty + "\n" +
      "Price: ₹" + t + "\n\n";
  });

  message += "------------------------\n";
  message += "💰 Total: ₹" + total;
  message += discountLine;
  message += "\n💵 Final Amount: ₹" + finalTotal;
  message += "\n🚚 Payment: COD (Cash on Delivery)";

  window.closeDeliveryModal();
  let url = "https://wa.me/917010085603?text=" + encodeURIComponent(message);
  window.open(url, "_blank");
};


/* ===============================
   CART DRAWER TOGGLE
=============================== */

window.toggleCart = function() {
  const cartDrawer = document.getElementById("cartDrawer");
  const overlay    = document.getElementById("cartOverlay");
  if (!cartDrawer) return;
  cartDrawer.classList.toggle("active");
  overlay.classList.toggle("active");
};


/* ===============================
   PRODUCT SEARCH
=============================== */

const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("keyup", function() {
    let value    = this.value.toLowerCase();
    let products = document.querySelectorAll(".product");
    products.forEach(product => {
      let name = product.innerText.toLowerCase();
      product.style.display = name.includes(value) ? "block" : "none";
    });
  });
}


/* ===============================
   HERO IMAGE SLIDER
=============================== */

const heroImage = document.getElementById("heroImage");

if (heroImage) {
  const heroImages = [
    "images/hero1.jpg",
    "images/hero2.jpg",
    "images/hero3.jpg",
    "images/hero4.jpg",
    "images/hero5.jpg"
  ];

  let heroIndex = 0;

  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroImages.length;
    heroImage.src = heroImages[heroIndex];
  }, 4000);
}


/* ===============================
   QUICK VIEW MODAL
=============================== */

let qvCurrentProduct = {
  name: "",
  price: 0,
  category: "",
  qty: 1
};

window.openQuickView = function(name, priceStr, image, desc, category) {

  let price = parseInt(priceStr.replace("₹", "").replace(",", ""));

  qvCurrentProduct = { name, price, category, qty: 1 };

  document.getElementById("qv-image").src    = image;
  document.getElementById("qv-name").textContent  = name;
  document.getElementById("qv-price").textContent = priceStr;
  document.getElementById("qv-desc").textContent  = desc || "";
  document.getElementById("qv-category").textContent = category.charAt(0).toUpperCase() + category.slice(1);
  document.getElementById("qv-qty-display").textContent = 1;

  // Populate sizes
  let sizeSelect = document.getElementById("qv-size");
  sizeSelect.innerHTML = "";

  let sizes = category === "pants"
    ? ["", "30", "32", "34", "36"]
    : ["", "S", "M", "L", "XL"];

  sizes.forEach((s, i) => {
    let opt = document.createElement("option");
    opt.value = s;
    opt.textContent = i === 0 ? "Select Size" : s;
    sizeSelect.appendChild(opt);
  });

  // Reset add button
  let addBtn = document.getElementById("qv-add-btn");
  addBtn.textContent   = "Add to Cart";
  addBtn.style.background = "";

  document.getElementById("quickViewModal").classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeQuickView = function() {
  document.getElementById("quickViewModal").classList.remove("open");
  document.body.style.overflow = "";
};

// Close on overlay click
document.getElementById("quickViewModal").addEventListener("click", function(e) {
  if (e.target === this) window.closeQuickView();
});

window.qvChangeQty = function(delta) {
  qvCurrentProduct.qty = Math.max(1, qvCurrentProduct.qty + delta);
  document.getElementById("qv-qty-display").textContent = qvCurrentProduct.qty;
};

window.addFromQuickView = function() {

  let size = document.getElementById("qv-size").value;

  if (!size || size === "Select Size") {
    showToast("Please select a size", "error");
    return;
  }

  cart.push({
    name:  qvCurrentProduct.name,
    price: qvCurrentProduct.price,
    size:  size,
    qty:   qvCurrentProduct.qty
  });

  total += qvCurrentProduct.price * qvCurrentProduct.qty;

  updateCart();
  bounceCart();
  showToast(qvCurrentProduct.name, "success", size, qvCurrentProduct.qty);

  // Flash add button
  let addBtn = document.getElementById("qv-add-btn");
  addBtn.textContent      = "✓ Added!";
  addBtn.style.background = "#1db954";
  setTimeout(() => {
    addBtn.textContent      = "Add to Cart";
    addBtn.style.background = "";
    window.closeQuickView();
  }, 900);
};