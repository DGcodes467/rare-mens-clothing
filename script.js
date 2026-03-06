/* ===============================
   FIREBASE CONFIG
================================ */

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
const db = getFirestore(app);


/* ===============================
   LOAD PRODUCTS (ADMIN PANEL)
================================ */

async function loadStoreProducts(){

const snapshot = await getDocs(collection(db,"products"));

snapshot.forEach((docData)=>{

let product = docData.data();

let container;

if(product.category === "shirts"){
container = document.querySelector("#shirts .products");
}

if(product.category === "tshirts"){
container = document.querySelector("#tshirts .products");
}

if(product.category === "pants"){
container = document.querySelector("#pants .products");
}

if(product.category === "trackpants"){
container = document.querySelector("#trackpants .products");
}

if(!container) return;

container.innerHTML += `

<div class="product">

<img src="${product.image}">

<h3>${product.name}</h3>

<p class="price">₹${product.price}</p>

<select class="size">
<option value="">Select Size</option>
<option>S</option>
<option>M</option>
<option>L</option>
<option>XL</option>
</select>

<input type="number" class="qty" value="1" min="1">

<button onclick="addToCart('${product.name}',${product.price},this)">
Add to Cart
</button>

</div>

`;

});

}

loadStoreProducts();


/* ===============================
   CART DATA
================================ */

let cart = [];
let total = 0;


/* ===============================
   ADD TO CART
================================ */

window.addToCart = function(name, price, button){

let product = button.parentElement;

let size = product.querySelector(".size").value;
let qtyInput = product.querySelector(".qty");

let qty = qtyInput ? parseInt(qtyInput.value) : 1;

if(size === "" || size === "Select Size"){
alert("Please select size");
return;
}

cart.push({
name:name,
price:price,
size:size,
qty:qty
});

updateCart();

}


/* ===============================
   UPDATE CART
================================ */

window.updateCart = function(){

let list = document.getElementById("cart-items");

if(!list) return;

list.innerHTML = "";

total = 0;

cart.forEach((item,index)=>{

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
document.getElementById("cart-count").innerText = cart.length;

}


/* ===============================
   INCREASE QUANTITY
================================ */

window.increaseQty = function(index){

cart[index].qty++;

updateCart();

}


/* ===============================
   DECREASE QUANTITY
================================ */

window.decreaseQty = function(index){

if(cart[index].qty > 1){

cart[index].qty--;

}

updateCart();

}


/* ===============================
   REMOVE ITEM
================================ */

window.removeItem = function(index){
cart.splice(index,1);
updateCart();
}


/* ===============================
   WHATSAPP CHECKOUT
================================ */

window.checkout = function(){

if(cart.length === 0){
alert("Your cart is empty");
return;
}

/* Generate Order ID */

let orderId = "RMC-" + Math.floor(Math.random()*10000);

/* Get Date */

let today = new Date();

let date =
today.getDate().toString().padStart(2,'0') + "-" +
(today.getMonth()+1).toString().padStart(2,'0') + "-" +
today.getFullYear();

/* Create message */

let message = "Hello 👋 Greetings from Rare Mens Clothing!\n\n";

message += "Order ID: " + orderId + "\n";
message += "Date: " + date + "\n\n";

message += "Order Details:\n\n";

cart.forEach(item => {

let itemTotal = item.price * item.qty;

message +=
"Product: " + item.name + "\n" +
"Size: " + item.size + "\n" +
"Qty: " + item.qty + "\n" +
"Price: ₹" + itemTotal + "\n\n";

});

message += "Total Amount: ₹" + total;

/* Open WhatsApp */

let url = "https://wa.me/917010085603?text=" + encodeURIComponent(message);

window.open(url,"_blank");

}


/* ===============================
   CART DRAWER TOGGLE
================================ */

window.toggleCart = function(){

const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("cartOverlay");

if(!cartDrawer) return;

cartDrawer.classList.toggle("active");
overlay.classList.toggle("active");

}


/* ===============================
   PRODUCT SEARCH
================================ */

const searchInput = document.getElementById("searchInput");

if(searchInput){

searchInput.addEventListener("keyup", function(){

let value = this.value.toLowerCase();

let products = document.querySelectorAll(".product");

products.forEach(product => {

let name = product.innerText.toLowerCase();

if(name.includes(value)){

product.style.display = "block";

}else{

product.style.display = "none";

}

});

});

}


/* ===============================
   HERO IMAGE SLIDER
================================ */

const heroImage = document.getElementById("heroImage");

if(heroImage){

const heroImages = [
"images/hero1.jpg",
"images/hero2.jpg",
"images/hero3.jpg"
];

let heroIndex = 0;

setInterval(() => {

heroIndex++;

if(heroIndex >= heroImages.length){
heroIndex = 0;
}

heroImage.src = heroImages[heroIndex];

},4000);

}