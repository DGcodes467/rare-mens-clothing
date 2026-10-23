/* admin-colors.js — adds a "Colours" editor to admin.html.
   Load it AFTER the main <script> block:  <script src="admin-colors.js"></script> */
(function () {

  var rows = [], uid = 0;

  /* ── CSS ── */
  var st = document.createElement("style");
  st.textContent =
    ".color-section{margin-bottom:16px}" +
    ".color-section>label{display:block;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px}" +
    ".color-row{background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px;margin-bottom:10px}" +
    ".color-row-top{display:flex;gap:8px;align-items:center}" +
    ".color-row-top input[type=color]{width:40px;height:38px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;flex-shrink:0}" +
    ".color-row-top input[type=text]{flex:1;min-width:0;padding:9px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;color:var(--white);font-family:var(--font);font-size:13px;outline:none}" +
    ".color-row-top input[type=text]:focus{border-color:var(--gold)}" +
    ".color-remove{width:32px;height:32px;border-radius:50%;flex-shrink:0;cursor:pointer;background:rgba(229,57,53,.1);border:1px solid rgba(229,57,53,.3);color:var(--red)}" +
    ".color-row-img{display:flex;align-items:center;gap:10px;margin-top:10px}" +
    ".color-thumb,.color-thumb-empty{width:48px;height:60px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid var(--border)}" +
    ".color-thumb-empty{display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--muted);background:var(--bg)}" +
    ".color-upload-btn{position:relative;overflow:hidden;cursor:pointer;padding:8px 14px;border:1px dashed var(--gold);color:var(--gold);border-radius:8px;font-size:12px;font-weight:600}" +
    ".color-upload-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}";
  document.head.appendChild(st);

  /* ── UI block, placed above the Add/Update button ── */
  var saveBtn = document.getElementById("saveBtn");
  var sec = document.createElement("div");
  sec.className = "color-section";
  sec.innerHTML = '<label>Colours (optional)</label><div id="colorList"></div>' +
    '<button type="button" class="btn-secondary" onclick="addColorRow()">＋ Add Colour</button>';
  saveBtn.parentNode.insertBefore(sec, saveBtn);

  /* ── helpers ── */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function find(id) { return rows.filter(function (c) { return c.uid === id; })[0]; }

  function render() {
    var box = document.getElementById("colorList");
    if (!rows.length) {
      box.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:2px 0 8px;">No colours added</p>';
      return;
    }
    box.innerHTML = rows.map(function (c) {
      return '<div class="color-row"><div class="color-row-top">' +
        '<input type="color" value="' + esc(c.hex) + '" oninput="updateColor(' + c.uid + ',\'hex\',this.value)">' +
        '<input type="text" placeholder="Colour name e.g. Brown / Cream" value="' + esc(c.name) + '" oninput="updateColor(' + c.uid + ',\'name\',this.value)">' +
        '<button type="button" class="color-remove" onclick="removeColorRow(' + c.uid + ')">✕</button></div>' +
        '<div class="color-row-img">' +
        (c.image ? '<img class="color-thumb" src="' + esc(c.image) + '">' : '<div class="color-thumb-empty">No image</div>') +
        '<label class="color-upload-btn">' + (c.uploading ? "Uploading..." : (c.image ? "Change image" : "Upload image")) +
        '<input type="file" accept="image/*"' + (c.uploading ? " disabled" : "") + ' onchange="uploadColorImage(' + c.uid + ',this.files[0])"></label>' +
        '</div></div>';
    }).join("");
  }

  window.addColorRow = function () {
    rows.push({ uid: ++uid, name: "", hex: "#000000", image: "", uploading: false });
    render();
  };
  window.removeColorRow = function (id) {
    rows = rows.filter(function (c) { return c.uid !== id; });
    render();
  };
  window.updateColor = function (id, key, val) {
    var c = find(id);
    if (c) c[key] = val;
  };

  window.uploadColorImage = function (id, file) {
    var c = find(id);
    if (!c || !file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB", "error"); return; }
    c.uploading = true;
    render();

    var fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    fd.append("folder", "rare-mens-clothing");

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var r = find(id);
      if (!r) return;
      r.uploading = false;
      if (xhr.status === 200) { r.image = JSON.parse(xhr.responseText).secure_url; showToast("✓ Colour image uploaded", "success"); }
      else showToast("Colour image upload failed", "error");
      render();
    };
    xhr.onerror = function () {
      var r = find(id);
      if (r) { r.uploading = false; render(); }
      showToast("Upload failed. Check internet.", "error");
    };
    xhr.open("POST", "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload");
    xhr.send(fd);
  };

  /* ── hook: reset form clears colours ── */
  var origReset = window.resetForm;
  window.resetForm = function () {
    origReset();
    rows = [];
    render();
  };

  /* ── hook: editing loads the product's colours ── */
  var origEdit = window.editProduct;
  window.editProduct = function (id) {
    origEdit(id);
    var p = allProducts.find(function (x) { return x.id === id; });
    rows = ((p && p.colors) || []).map(function (c) {
      return { uid: ++uid, name: c.name || "", hex: c.hex || "#000000", image: c.image || "", uploading: false };
    });
    render();
  };

  /* ── replaces saveProduct: same as before + colours ── */
  window.saveProduct = function () {
    var name        = document.getElementById("f_name").value.trim();
    var price       = document.getElementById("f_price").value.trim();
    var category    = document.getElementById("f_category").value;
    var description = document.getElementById("f_description").value.trim();
    var sizes       = getSelectedSizes();
    var editId      = document.getElementById("editId").value;

    ["f_name", "f_price", "f_category"].forEach(function (id) {
      document.getElementById(id).classList.remove("error");
    });

    var valid = true;
    if (!name)     { document.getElementById("f_name").classList.add("error");     valid = false; }
    if (!price)    { document.getElementById("f_price").classList.add("error");    valid = false; }
    if (!category) { document.getElementById("f_category").classList.add("error"); valid = false; }
    if (sizes.length === 0) { showToast("Please select at least one size", "error"); valid = false; }
    if (!uploadedImageUrl)  { showToast("Please wait for image to finish uploading", "error"); valid = false; }
    if (rows.some(function (c) { return c.uploading; })) {
      showToast("Please wait for colour images to finish uploading", "error"); valid = false;
    }
    if (rows.some(function (c) { return !c.name.trim() || !c.image; })) {
      showToast("Each colour needs a name and an image (or remove the row)", "error"); valid = false;
    }
    if (!valid) return;

    var btn = document.getElementById("saveBtn");
    btn.disabled    = true;
    btn.textContent = editId ? "⏳ Updating..." : "⏳ Saving...";

    var data = {
      name: name,
      price: Number(price),
      category: category,
      description: description,
      sizes: sizes,
      colors: rows.map(function (c) { return { name: c.name.trim(), hex: c.hex, image: c.image }; }),
      image: uploadedImageUrl,
      updatedAt: new Date().toISOString()
    };

    var promise;
    if (editId) promise = db.collection("products").doc(editId).update(data);
    else { data.createdAt = new Date().toISOString(); promise = db.collection("products").add(data); }

    promise
      .then(function () {
        showToast(editId ? "✓ Product updated!" : "✓ Product added to store!", "success");
        window.resetForm();
        loadProducts();
      })
      .catch(function (err) {
        console.error(err);
        showToast("Error: " + err.message, "error");
      })
      .finally(function () {
        btn.disabled    = false;
        btn.textContent = document.getElementById("editId").value ? "✓ Update Product" : "＋ Add Product";
      });
  };

  render();
})();