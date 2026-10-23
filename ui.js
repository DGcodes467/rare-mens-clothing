/* =========================================================
   ui.js — menu (accordion), search panel, navbar, countdown
   Cart / quick view / checkout / search results live in shop.js
========================================================= */

/* ── SALE COUNTDOWN — edit these two lines ──────────────── */
var SALE_END   = new Date("2026-11-08T23:59:59+05:30");   // when the sale ends
var SALE_LABEL = "Festive Sale is Live";                   // text on the bar


(function () {

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ── SIDE MENU ──────────────────────────────────────────── */
  var MENU_CATS = [
    { id: "shirts",     label: "Shirts" },
    { id: "tshirts",    label: "T-Shirts" },
    { id: "pants",      label: "Pants" },
    { id: "trackpants", label: "Track Pants" }
  ];

  var MENU_PROMOS = [
    { id: "shirts",     title: "Shirts",      img: "images/plain1.jpg" },
    { id: "tshirts",    title: "T-Shirts",    img: "images/tshirt1.jpg" },
    { id: "pants",      title: "Pants",       img: "images/mom1.jpg" },
    { id: "trackpants", title: "Track Pants", img: "images/track1.jpg" }
  ];

  function clearSearch() {
    var i = $("searchInput");
    if (i && i.value) {
      i.value = "";
      i.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /* scroll to a section (clears any active search first) */
  window.goTo = function (id) {
    clearSearch();
    window.closeMenu();
    var t = $(id);
    if (t) setTimeout(function () { t.scrollIntoView({ behavior: "smooth" }); }, 80);
  };

  /* search for a product name from the menu */
  window.menuSearch = function (text) {
    window.closeMenu();
    var panel = $("searchPanel"), input = $("searchInput"), navbar = $("navbar");
    if (!input) return;
    if (panel) panel.classList.add("open");
    if (navbar) navbar.classList.add("solid");
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  function group(nav, label, badge, links) {
    var item = el("div", "mm-item");
    var btn  = el("button", "mm-row");
    btn.type = "button";

    var span = el("span", "", label);
    if (badge) span.appendChild(el("em", "mm-badge", badge));
    btn.appendChild(span);
    btn.appendChild(el("i", "mm-plus"));

    btn.addEventListener("click", function () {
      var willOpen = !item.classList.contains("open");
      [].slice.call(nav.querySelectorAll(".mm-item.open")).forEach(function (o) { o.classList.remove("open"); });
      if (willOpen) item.classList.add("open");
    });

    var sub = el("div", "mm-sub");
    links.forEach(function (l) {
      var a = el("a", "", l.text);
      a.href = "#";
      a.addEventListener("click", function (ev) { ev.preventDefault(); l.action(); });
      sub.appendChild(a);
    });

    item.appendChild(btn);
    item.appendChild(sub);
    nav.appendChild(item);
  }

  function productNames(selector) {
    return [].slice.call(document.querySelectorAll(selector)).map(function (h) { return h.textContent; });
  }

  function buildMenu() {
    var nav = document.querySelector("#sideMenu .side-links");
    if (!nav) return;
    nav.innerHTML = "";

    // "New Arrival" = products added from the admin panel (only shown if there are any)
    var fresh = productNames(".collection .product[data-fs] h3");
    if (fresh.length) {
      group(nav, "New Arrival", "NEW", fresh.map(function (n) {
        return { text: n, action: function () { window.menuSearch(n); } };
      }));
    }

    // one expandable row per category, built from the products on the page
    MENU_CATS.forEach(function (c) {
      var links = [{ text: "View all " + c.label, action: function () { window.goTo(c.id); } }];
      productNames("#" + c.id + " .product h3").forEach(function (n) {
        links.push({ text: n, action: function () { window.menuSearch(n); } });
      });
      group(nav, c.label, "", links);
    });

    // plain rows
    var contact = el("a", "mm-row", "Contact");
    contact.href = "#contact";
    contact.addEventListener("click", function (ev) { ev.preventDefault(); window.goTo("contact"); });
    var wrap = el("div", "mm-item");
    wrap.appendChild(contact);
    nav.appendChild(wrap);

    // promo cards
    var promos = el("div", "mm-promos");
    MENU_PROMOS.forEach(function (p) {
      var a = el("a", "mm-promo");
      a.href = "#" + p.id;
      var img = el("img");
      img.src = p.img; img.alt = p.title; img.loading = "lazy";
      a.appendChild(img);
      a.appendChild(el("span", "mm-promo-title", p.title));
      a.appendChild(el("span", "mm-tag", "FLAT \u20B9200 OFF"));
      a.addEventListener("click", function (ev) { ev.preventDefault(); window.goTo(p.id); });
      promos.appendChild(a);
    });
    nav.appendChild(promos);
  }

  window.openMenu = function () {
    buildMenu();
    $("sideMenu").classList.add("open");
    $("menuOverlay").classList.add("active");
    document.body.style.overflow = "hidden";
  };

  window.closeMenu = function () {
    $("sideMenu").classList.remove("open");
    $("menuOverlay").classList.remove("active");
    document.body.style.overflow = "";
  };


  /* ── SEARCH PANEL ───────────────────────────────────────── */
  window.toggleSearch = function () {
    var panel  = $("searchPanel");
    var navbar = $("navbar");
    var open = panel.classList.toggle("open");

    if (open) {
      navbar.classList.add("solid");
      setTimeout(function () { $("searchInput").focus(); }, 250);
    } else {
      updateNavbar();
    }
  };


  /* ── NAVBAR: transparent on hero, solid after scrolling ─── */
  function updateNavbar() {
    var navbar = $("navbar");
    var panel  = $("searchPanel");
    var searchOpen = panel && panel.classList.contains("open");
    if (window.scrollY > 40 || searchOpen) navbar.classList.add("solid");
    else navbar.classList.remove("solid");
  }

  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();

  // Escape closes overlays
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      window.closeMenu();
      var panel = $("searchPanel");
      if (panel && panel.classList.contains("open")) window.toggleSearch();
    }
  });


  /* ── HERO: blurred backdrop on wide screens + fade on change ── */
  (function () {
    var hero = document.querySelector(".hero");
    var img  = $("heroImage");
    if (!hero || !img) return;

    function sync() {
      var src = img.currentSrc || img.src;
      if (src) hero.style.setProperty("--hero-bg", 'url("' + src + '")');
    }
    sync();
    img.addEventListener("load", sync);

    if (window.MutationObserver) {
      new MutationObserver(function () {
        sync();
        img.style.animation = "none";
        void img.offsetWidth;
        img.style.animation = "";
      }).observe(img, { attributes: true, attributeFilter: ["src"] });
    }
  })();


  /* ── SALE BAR: "Shop Now" link + countdown ──────────────── */
  (function () {
    var bar = $("saleBar");
    if (!bar) return;

    $("saleLabel").textContent = SALE_LABEL;

    var text = bar.querySelector(".sale-text");
    if (text && !text.querySelector(".sale-cta")) {
      var cta = el("a", "sale-cta", "Shop Now");
      cta.href = "#shirts";
      text.appendChild(cta);
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    function tick() {
      var diff = SALE_END - new Date();
      if (diff <= 0) { bar.style.display = "none"; return false; }

      var s = Math.floor(diff / 1000);
      $("cd-d").textContent = pad(Math.floor(s / 86400));
      $("cd-h").textContent = pad(Math.floor((s % 86400) / 3600));
      $("cd-m").textContent = pad(Math.floor((s % 3600) / 60));
      $("cd-s").textContent = pad(s % 60);
      return true;
    }

    if (tick()) {
      var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
    }
  })();

})();