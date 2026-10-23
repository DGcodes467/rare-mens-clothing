/* =========================================================
   RARE MENS CLOTHING — shop.js
   Cart, Quick View (with colours), size selection, checkout
   (WhatsApp), search, and live products from Firestore.
========================================================= */

(function () {

  /* ── SETTINGS ─────────────────────────────────────────── */
  var WHATSAPP_NUMBER = "917010085603";
  var DISCOUNT_MIN    = 1999;
  var DISCOUNT_AMOUNT = 200;

  var firebaseConfig = {
    apiKey:            "AIzaSyBvdBYSLanVfnz5TiTWAyxIKPbee8fMDYw",
    authDomain:        "rare-mens-clothing.firebaseapp.com",
    projectId:         "rare-mens-clothing",
    storageBucket:     "rare-mens-clothing.appspot.com",
    messagingSenderId: "409895222910",
    appId:             "1:409895222910:web:dca2c6d2431730077ba22f"
  };

  var CATEGORY_NAMES = { shirts: "Shirts", tshirts: "T-Shirts", pants: "Pants", trackpants: "Track Pants" };
  var DEFAULT_SIZES = {
    shirts:     ["S", "M", "L", "XL"],
    tshirts:    ["S", "M", "L", "XL"],
    trackpants: ["S", "M", "L", "XL"],
    pants:      ["28", "30", "32", "34", "36", "38"]
  };

  /* colour thumbnails in Quick View (no need to edit the CSS files) */
  var thumbCss = document.createElement("style");
  thumbCss.textContent =
    ".qv-swatch.thumb{width:52px;height:66px;border-radius:4px;background-size:cover;background-position:center}";
  document.head.appendChild(thumbCss);

  /* ── STATE ────────────────────────────────────────────── */
  var cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("rare_cart") || "[]");
    if (!Array.isArray(cart)) cart = [];
  } catch (e) { cart = []; }

  var qv = { name: "", price: 0, qty: 1, colors: [], color: "" };
  var fsProducts = {};

  /* ── HELPERS ──────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function rupee(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function saveCart() { try { localStorage.setItem("rare_cart", JSON.stringify(cart)); } catch (e) {} }
  function lockScroll(lock) { document.body.style.overflow = lock ? "hidden" : ""; }


  /* ── TOAST ────────────────────────────────────────────── */
  function showToast(title, sub, type) {
    var box = $("toast-container");
    if (!box) return;
    var t = document.createElement("div");
    t.className = "toast" + (type === "error" ? " error" : "");
    t.innerHTML =
      '<div class="toast-icon">' + (type === "error" ? "!" : "✓") + '</div>' +
      '<div class="toast-text"><div class="toast-name">' + esc(title) + '</div>' +
      (sub ? '<div class="toast-sub">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="toast-progress"></div>';
    box.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("show"); }); });
    setTimeout(function () {
      t.classList.add("hide");
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  }


  /* ── CART ─────────────────────────────────────────────── */
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }

  function renderCart() {
    var ul = $("cart-items"), count = $("cart-count"), total = $("cart-total");

    if (count) count.textContent = cartCount();
    if (total) total.textContent = cartTotal().toLocaleString("en-IN");
    if (!ul) return;

    if (!cart.length) {
      ul.innerHTML = '<li style="text-align:center;color:#857f72;padding:40px 0;">Your cart is empty</li>';
      return;
    }

    ul.innerHTML = cart.map(function (it, i) {
      return '<li>' +
        '<b>' + esc(it.name) + '</b><br>' +
        (it.color ? 'Colour: ' + esc(it.color) + ' · ' : '') + 'Size: ' + esc(it.size) +
        '<div class="cart-qty">' +
          '<button onclick="changeQty(' + i + ',-1)" aria-label="Decrease">-</button>' +
          '<span>' + it.qty + '</span>' +
          '<button onclick="changeQty(' + i + ',1)" aria-label="Increase">+</button>' +
        '</div>' +
        rupee(it.price * it.qty) +
        '<button class="remove-btn" onclick="removeItem(' + i + ')" aria-label="Remove">✕</button>' +
      '</li>';
    }).join("");
  }

  function bounceCartIcon() {
    var icon = $("cartIcon");
    if (!icon) return;
    icon.classList.remove("bounce");
    void icon.offsetWidth;
    icon.classList.add("bounce");
  }

  function addItem(name, price, size, qty, color) {
    color = color || "";
    var found = cart.filter(function (i) {
      return i.name === name && i.size === size && (i.color || "") === color;
    })[0];
    if (found) found.qty += qty;
    else cart.push({ name: name, price: Number(price), size: size, color: color, qty: qty });
    saveCart();
    renderCart();
    bounceCartIcon();
    showToast(name, (color ? color + " · " : "") + "Size " + size + " · Qty " + qty + " added to cart");
  }

  /* Add to Cart button on a product card (products without colours) */
  window.addToCart = function (name, price, btn) {
    var card  = btn.closest(".product");
    var sel   = card.querySelector("select.size");
    var qtyIn = card.querySelector("input.qty");

    var size = sel ? sel.value : "";
    if (!size) {
      showToast("Select a size", "Please choose a size for " + name, "error");
      if (sel) sel.focus();
      return;
    }

    var qty = Math.max(1, parseInt(qtyIn ? qtyIn.value : 1, 10) || 1);
    addItem(name, price, size, qty);

    sel.value = "";
    if (qtyIn) qtyIn.value = 1;
  };

  window.changeQty = function (index, delta) {
    var it = cart[index];
    if (!it) return;
    it.qty += delta;
    if (it.qty < 1) cart.splice(index, 1);
    saveCart();
    renderCart();
  };

  window.removeItem = function (index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  };

  function closeCart() {
    var d = $("cartDrawer"), o = $("cartOverlay");
    if (d) d.classList.remove("active");
    if (o) o.classList.remove("active");
    lockScroll(false);
  }

  window.toggleCart = function () {
    var d = $("cartDrawer"), o = $("cartOverlay");
    if (!d) return;
    var open = d.classList.toggle("active");
    if (o) o.classList.toggle("active", open);
    lockScroll(open);
    if (open) renderCart();
  };


  /* ── CHECKOUT ─────────────────────────────────────────── */
  window.checkout = function () {
    if (!cart.length) {
      showToast("Your cart is empty", "Add something first", "error");
      return;
    }

    var sub  = cartTotal();
    var disc = sub >= DISCOUNT_MIN ? DISCOUNT_AMOUNT : 0;

    $("display-total").textContent = sub.toLocaleString("en-IN");
    $("display-final").textContent = (sub - disc).toLocaleString("en-IN");
    var tag = $("discount-tag");
    if (tag) tag.classList.toggle("show", disc > 0);

    closeCart();
    $("deliveryModal").classList.add("open");
    lockScroll(true);
  };

  window.closeDeliveryModal = function () {
    var m = $("deliveryModal");
    if (m) m.classList.remove("open");
    lockScroll(false);
  };

  window.confirmOrder = function () {
    var fields = ["d_name", "d_phone", "d_address", "d_city", "d_pincode"];
    fields.forEach(function (id) { $(id).classList.remove("error"); });

    var name    = $("d_name").value.trim();
    var phone   = $("d_phone").value.replace(/\D/g, "");
    var address = $("d_address").value.trim();
    var city    = $("d_city").value.trim();
    var pincode = $("d_pincode").value.trim();

    var ok = true;
    if (!name)                     { $("d_name").classList.add("error");    ok = false; }
    if (phone.length !== 10)       { $("d_phone").classList.add("error");   ok = false; }
    if (!address)                  { $("d_address").classList.add("error"); ok = false; }
    if (!city)                     { $("d_city").classList.add("error");    ok = false; }
    if (!/^\d{6}$/.test(pincode))  { $("d_pincode").classList.add("error"); ok = false; }

    if (!ok) {
      showToast("Check your details", "Please fill all fields correctly", "error");
      return;
    }

    var sub   = cartTotal();
    var disc  = sub >= DISCOUNT_MIN ? DISCOUNT_AMOUNT : 0;
    var final = sub - disc;

    var lines = cart.map(function (it, i) {
      return (i + 1) + ". " + it.name + (it.color ? " | Colour: " + it.color : "") +
             " | Size: " + it.size + " | Qty: " + it.qty + " | " + rupee(it.price * it.qty);
    });

    var msg =
      "*New Order - Rare Mens Clothing*\n\n" +
      lines.join("\n") + "\n\n" +
      "Subtotal: " + rupee(sub) + "\n" +
      (disc ? "Discount: -" + rupee(disc) + "\n" : "") +
      "*Total: " + rupee(final) + "*\n" +
      "Payment: Cash on Delivery\n\n" +
      "*Delivery Details*\n" +
      "Name: " + name + "\n" +
      "Phone: +91 " + phone + "\n" +
      "Address: " + address + "\n" +
      "City: " + city + " - " + pincode;

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
    var w = window.open(url, "_blank");
    if (!w) window.location.href = url;

    cart = [];
    saveCart();
    renderCart();
    window.closeDeliveryModal();
    fields.forEach(function (id) { $(id).value = ""; });
    showToast("Order sent", "Complete it in WhatsApp");
  };


  /* ── QUICK VIEW ───────────────────────────────────────── */
  function renderQvColors() {
    var group = $("qv-color-group"), box = $("qv-colors");
    if (!group || !box) return;

    if (!qv.colors.length) {
      group.style.display = "none";
      box.innerHTML = "";
      return;
    }

    group.style.display = "";
    box.innerHTML = qv.colors.map(function (c, i) {
      var hex = esc(c.hex || "#ccc");
      var bg  = c.image ? 'url(' + esc(c.image) + ')' : hex;
      return '<button type="button" class="qv-swatch thumb" title="' + esc(c.name) + '" aria-label="' + esc(c.name) + '" ' +
             'onclick="selectQvColor(' + i + ')" style="background-image:' + bg + ';background-color:' + hex + '"></button>';
    }).join("");

    window.selectQvColor(0);
  }

  window.selectQvColor = function (i) {
    var c = qv.colors[i];
    if (!c) return;
    qv.color = c.name;
    $("qv-color-selected").textContent = c.name;
    if (c.image) $("qv-image").src = c.image;
    [].forEach.call(document.querySelectorAll("#qv-colors .qv-swatch"), function (b, idx) {
      b.classList.toggle("selected", idx === i);
    });
  };

  window.openQuickView = function (name, priceText, image, desc, category, sizes, colors) {
    qv.name  = name;
    qv.price = parseInt(String(priceText).replace(/[^\d]/g, ""), 10) || 0;
    qv.qty   = 1;

    $("qv-image").src            = image || "";
    $("qv-image").alt            = name;
    $("qv-category").textContent = CATEGORY_NAMES[category] || category || "";
    $("qv-name").textContent     = name;
    $("qv-price").textContent    = rupee(qv.price);
    $("qv-desc").textContent     = desc || "";
    $("qv-qty-display").textContent = "1";

    var list = (sizes && sizes.length) ? sizes : (DEFAULT_SIZES[category] || DEFAULT_SIZES.shirts);
    $("qv-size").innerHTML =
      '<option value="">Select Size</option>' +
      list.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join("");

    qv.colors = Array.isArray(colors) ? colors.filter(function (c) { return c && c.name; }) : [];
    qv.color  = "";
    renderQvColors();

    $("quickViewModal").classList.add("open");
    lockScroll(true);
  };

  window.closeQuickView = function () {
    var m = $("quickViewModal");
    if (m) m.classList.remove("open");
    lockScroll(false);
  };

  window.qvChangeQty = function (delta) {
    qv.qty = Math.max(1, qv.qty + delta);
    $("qv-qty-display").textContent = qv.qty;
  };

  window.addFromQuickView = function () {
    var size = $("qv-size").value;
    if (!size) {
      showToast("Select a size", "Please choose a size first", "error");
      $("qv-size").focus();
      return;
    }
    addItem(qv.name, qv.price, size, qv.qty, qv.color);
    window.closeQuickView();
  };


  /* ── SEARCH ───────────────────────────────────────────── */
  var lastQuery = "";

  function ensureResultsBox() {
    var box = $("searchResults");
    if (box) return box;

    box = document.createElement("section");
    box.id = "searchResults";
    box.className = "search-results";
    box.style.display = "none";
    box.innerHTML =
      '<div class="section-head">' +
        '<span class="eyebrow">Search</span>' +
        '<h2 class="section-title" id="searchTitle">Results</h2>' +
      '</div>' +
      '<div class="products" id="searchGrid"></div>';

    var anchor = document.querySelector(".categories");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
    else document.body.appendChild(box);
    return box;
  }

  function applySearch() {
    var input = $("searchInput");
    var q = (input ? input.value : "").trim().toLowerCase();
    var searching = q.length > 0;

    document.querySelectorAll(".hero, .categories, .banner, .collection").forEach(function (el) {
      el.style.display = searching ? "none" : "";
    });

    var box = ensureResultsBox();
    var grid = $("searchGrid");

    if (!searching) {
      box.style.display = "none";
      grid.innerHTML = "";
      lastQuery = "";
      return;
    }

    var terms = q.split(/\s+/);
    var count = 0;
    grid.innerHTML = "";

    document.querySelectorAll(".collection .product").forEach(function (p) {
      var h3  = p.querySelector("h3");
      var sec = p.closest(".collection");
      var cat = sec ? sec.id : "";
      var hay = ((h3 ? h3.textContent : "") + " " + cat + " " + (CATEGORY_NAMES[cat] || "")).toLowerCase();
      var match = terms.every(function (t) { return hay.indexOf(t) !== -1; });
      if (match) {
        grid.appendChild(p.cloneNode(true));
        count++;
      }
    });

    if (!count) {
      grid.innerHTML = '<p class="search-empty">No products found. Try shirts, jeans, cargo or track pants.</p>';
    }

    $("searchTitle").textContent = count
      ? count + (count === 1 ? " result" : " results") + " for \u201C" + (input.value.trim()) + "\u201D"
      : "No results";

    box.style.display = "";

    if (!lastQuery) window.scrollTo({ top: 0, behavior: "smooth" });
    lastQuery = q;
  }

  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "searchInput") {
      e.stopPropagation();
      applySearch();
    }
  }, true);


  /* ── LIVE PRODUCTS FROM FIRESTORE (admin panel) ───────── */
  function addProductCard(p) {
    var wrap = document.querySelector("#" + p.category + " .products");
    if (!wrap) return;

    var sizes = (p.sizes && p.sizes.length) ? p.sizes : (DEFAULT_SIZES[p.category] || DEFAULT_SIZES.shirts);
    var hasColors = Array.isArray(p.colors) && p.colors.length > 0;

    var dots = hasColors
      ? '<div class="card-colors">' + p.colors.map(function (c) {
          return '<span class="card-color-dot" title="' + esc(c.name) + '" style="background:' + esc(c.hex || "#ccc") + '"></span>';
        }).join("") + '</div>'
      : '';

    var card = document.createElement("div");
    card.className = "product";
    card.setAttribute("data-fs", "1");
    card.innerHTML =
      '<div class="product-img-wrap" onclick="openQuickViewById(\'' + p.id + '\')">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '<div class="quick-view-btn">Quick View</div>' +
      '</div>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="price">' + rupee(p.price) + '</p>' +
      dots +
      '<select class="size"><option value="">Select Size</option>' +
        sizes.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join("") +
      '</select>' +
      '<input type="number" class="qty" value="1" min="1">' +
      (hasColors
        ? '<button onclick="openQuickViewById(\'' + p.id + '\')">Choose Colour</button>'
        : '<button onclick="addToCartById(\'' + p.id + '\', this)">Add to Cart</button>');
    wrap.appendChild(card);
  }

  window.openQuickViewById = function (id) {
    var p = fsProducts[id];
    if (!p) return;
    window.openQuickView(p.name, rupee(p.price), p.image, p.description || "", p.category, p.sizes, p.colors);
  };

  window.addToCartById = function (id, btn) {
    var p = fsProducts[id];
    if (!p) return;
    window.addToCart(p.name, p.price, btn);
  };

  function loadFirestoreProducts() {
    if (typeof firebase === "undefined" || !firebase.firestore) return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      firebase.firestore().collection("products").get()
        .then(function (snap) {
          snap.forEach(function (doc) {
            var p = doc.data();
            p.id = doc.id;
            if (!p.name || !p.category) return;
            fsProducts[p.id] = p;
            addProductCard(p);
          });
          applySearch();
        })
        .catch(function (err) { console.warn("Could not load products:", err); });
    } catch (err) {
      console.warn("Firebase init failed:", err);
    }
  }


  /* ── INIT ─────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    renderCart();
    loadFirestoreProducts();

    var input = $("searchInput");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") input.blur();
      });
    }

    var origToggle = window.toggleSearch;
    if (typeof origToggle === "function") {
      window.toggleSearch = function () {
        origToggle.apply(this, arguments);
        var panel = $("searchPanel");
        var inp   = $("searchInput");
        if (panel && !panel.classList.contains("open") && inp && inp.value) {
          inp.value = "";
          applySearch();
        }
      };
    }

    var qvm = $("quickViewModal");
    if (qvm) qvm.addEventListener("click", function (e) { if (e.target === qvm) window.closeQuickView(); });
    var dm = $("deliveryModal");
    if (dm) dm.addEventListener("click", function (e) { if (e.target === dm) window.closeDeliveryModal(); });

    ["d_phone", "d_pincode"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    window.closeQuickView();
    window.closeDeliveryModal();
    closeCart();
  });

  window.showToast = showToast;

})();