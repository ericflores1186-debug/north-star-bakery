/* North Star Bakery - Touchstone 4.
   Pre-order list builder, category filter, form validation, localStorage. */

"use strict";

/* ---------- Data ---------- */

// Array 1: the counter menu. Each id matches a data-product-id in products.html.
const PRODUCTS = [



   
  { id: "sig-loaf", name: "Signature North Star Loaf", price: 8.0, category: "breads" },
  { id: "country-white", name: "Country white sandwich pan loaf", price: 6.5, category: "breads" },
  { id: "seeded-rye", name: "Seeded rye and caraway", price: 7.25, category: "breads" },
  { id: "honey-oat", name: "Honey oat sandwich loaf", price: 6.75, category: "breads" },
  { id: "half-loaf", name: "Half loaf, baker's choice", price: 3.5, category: "breads" },
  { id: "croissant", name: "Butter croissant", price: 3.75, category: "pastries" },
  { id: "almond-croissant", name: "Almond or chocolate croissant", price: 4.5, category: "pastries" },
  { id: "morning-bun", name: "Maple pecan morning bun", price: 4.25, category: "pastries" },
  { id: "hand-pie", name: "Seasonal fruit hand pie", price: 4.0, category: "pastries" },
  { id: "pastry-box", name: "Baker's dozen pastry box", price: 42.0, category: "pastries" },
  { id: "cake-6", name: "6 inch round cake", price: 32.0, category: "cakes", estimate: true },
  { id: "cake-8", name: "8 inch round cake", price: 48.0, category: "cakes", estimate: true },
  { id: "cake-sheet", name: "Quarter sheet cake", price: 65.0, category: "cakes", estimate: true },
  { id: "cupcakes", name: "Cupcakes, by the dozen", price: 30.0, category: "cakes", estimate: true }




   
];

// Array 2: the filter buttons built on the products page.
const CATEGORIES = [
   
  { id: "all", label: "Everything" },
   
  { id: "breads", label: "Breads" },
   
  { id: "pastries", label: "Pastries" },
   
  { id: "cakes", label: "Cakes" }
];

// Array 3: one rule per field. Each rule is checked on submit and on blur.
const FIELD_RULES = [
  {
    id: "full-name",
    check: (value) => value.trim().length >= 2,
    message: "Enter your full name so we know whose order to hold."
  },
  {
    id: "email",
      check: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
    message: "Enter a valid email address, for example name@example.com."
  },
  {
    id: "phone",
    optional: true,
    check: (value) => /^\d{3}-\d{3}-\d{4}$/.test(value.trim()),
    message: "Use the format 612-555-0147, or leave this blank."
  },
  {
    id: "pickup-date",
    check: (value) => value !== "" && value >= todayAsInputValue(),
     
    message: "Choose a pickup date of today or later."
  },
  {
    id: "item-details",
    check: (value) => value.trim().length >= 10,
     
    message: "Tell us what you would like and how many (at least 10 characters)."
  }
];

// Object: every storage key in one place.
const STORAGE_KEYS = {
   
  basket: "nsb-basket",
   
  filter: "nsb-filter",
   
  customer: "nsb-customer"
};

/* ---------- Storage helpers ---------- */

// localStorage throws in private mode, so every read and write is guarded.
function readStore(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
     
    return raw === null ? fallback : JSON.parse(raw);
     
  } catch (err) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Storage unavailable. The page still works, it just will not remember.
  }
}

/* ---------- Basket model ---------- */

function findProduct(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function getBasket() {
  const saved = readStore(STORAGE_KEYS.basket, []);
   
  return Array.isArray(saved) ? saved : [];
}

// Join saved ids to the menu, dropping anything no longer sold.
function getBasketLines() {
  return getBasket()
     
    .map((line) => ({ product: findProduct(line.id), qty: line.qty }))
    .filter((line) => line.product && line.qty > 0);
}

function saveBasket(basket) {
  writeStore(STORAGE_KEYS.basket, basket);
  updateBasketStatus();
}

function countBasketItems() {
   
  return getBasketLines().reduce((total, line) => total + line.qty, 0);
}

function basketTotal() {
   
  return getBasketLines().reduce((total, line) => total + line.product.price * line.qty, 0);
}

function addToBasket(id) {
   
  const basket = getBasket();
   
  const existing = basket.find((line) => line.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    basket.push({ id: id, qty: 1 });
  }
  saveBasket(basket);
  renderBasket();
  announce(findProduct(id).name + " added. Your list now has " + countBasketItems() + " items.");
}

function removeFromBasket(id) {
   
  const product = findProduct(id);
  saveBasket(getBasket().filter((line) => line.id !== id));
  renderBasket();
  announce(product.name + " removed from your list.");
   
}

function changeQty(id, delta) {
   
  const basket = getBasket();
  const line = basket.find((item) => item.id === id);
  if (!line) {
    return;
     
  }
  line.qty += delta;
  saveBasket(basket.filter((item) => item.qty > 0));
  renderBasket();
}

function clearBasket() {
  saveBasket([]);
  renderBasket();
}

function formatMoney(amount) {
  return "$" + amount.toFixed(2);
}

// Plain-text version used to pre-fill the contact form.
function basketAsText() {
  return getBasketLines()
    .map((line) => line.qty + " x " + line.product.name)
    .join("\n");
}

/* ---------- Shared header status ---------- */

// Runs all four pages so the saved list is visible everywhere.
function updateBasketStatus() {
  const count = countBasketItems();
  document.querySelectorAll("[data-basket-status]").forEach((holder) => {
    holder.hidden = count === 0;
  });
  document.querySelectorAll("[data-basket-count]").forEach((slot) => {
    slot.textContent = count === 1 ? "1 item" : count + " items";
  });
}

function announce(message) {
  const region = document.querySelector("[data-live-region]");
  if (region) {
    region.textContent = message;
  }
}

/* ---------- Products page: filter ---------- */

function buildFilterBar() {
  const bar = document.querySelector("[data-filter-bar]");
  if (!bar) {
    return;
  }
  CATEGORIES.forEach((category) => {
     
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-btn";
    button.textContent = category.label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => applyFilter(category.id, true));
    bar.appendChild(button);
    category.button = button;
     
  });
  applyFilter(readStore(STORAGE_KEYS.filter, "all"), false);
}

function applyFilter(categoryId, save) {
  const known = CATEGORIES.some((category) => category.id === categoryId);
  const active = known ? categoryId : "all";

  document.querySelectorAll("[data-category-section]").forEach((section) => {
    section.hidden = active !== "all" && section.dataset.categorySection !== active;
  });
  CATEGORIES.forEach((category) => {
    if (category.button) {
      category.button.setAttribute("aria-pressed", String(category.id === active));
    }
  });
  if (save) {
    writeStore(STORAGE_KEYS.filter, active);
  }
}

/* ---------- Products page: add buttons and list panel ---------- */

function buildAddButtons() {
  document.querySelectorAll("[data-product-id]").forEach((row) => {
    const product = findProduct(row.dataset.productId);
    if (!product) {
      return;
    }
    const button = document.createElement("button");
     
    button.type = "button";
    button.className = "add-btn";
    button.textContent = "Add";
    button.setAttribute("aria-label", "Add " + product.name + " to your pre-order list");
    button.addEventListener("click", () => addToBasket(product.id));
     
    row.appendChild(button);
  });
}

function renderBasket() {
  const panel = document.querySelector("[data-basket-panel]");
  if (!panel) {
    return;
  }
  const lines = getBasketLines();
  panel.textContent = "";

  if (lines.length === 0) {
    const empty = document.createElement("p");
    empty.className = "note";
    empty.textContent = "Nothing chosen yet. Use the Add buttons above and your list is saved on this device.";
    panel.appendChild(empty);
    toggleBasketActions(false);
    return;
  }

  const list = document.createElement("ul");
  list.className = "basket-list";

  lines.forEach((line) => {
     
    const item = document.createElement("li");

    const name = document.createElement("span");
     
    name.className = "basket-name";
    name.textContent = line.qty + " x " + line.product.name + (line.product.estimate ? " (est.)" : "");
    item.appendChild(name);

     
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = formatMoney(line.product.price * line.qty);
    item.appendChild(price);

     
    item.appendChild(makeQtyButton("−", line.product, -1));
    item.appendChild(makeQtyButton("+", line.product, 1));

    const remove = document.createElement("button");
     
    remove.type = "button";
    remove.className = "link-btn";
    remove.textContent = "Remove";
     
    remove.setAttribute("aria-label", "Remove " + line.product.name + " from your list");
    remove.addEventListener("click", () => removeFromBasket(line.product.id));
    item.appendChild(remove);

    list.appendChild(item);
  });

  panel.appendChild(list);

  const total = document.createElement("p");
   
  total.className = "basket-total";
  total.textContent = "Estimated total: " + formatMoney(basketTotal());
  panel.appendChild(total);
   

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Cake prices are starting estimates. We confirm the final price when we call you back.";
  panel.appendChild(note);

  toggleBasketActions(true);
}

function makeQtyButton(label, product, delta) {
  const button = document.createElement("button");
   
  button.type = "button";
  button.className = "qty-btn";
   
  button.textContent = label;
  button.setAttribute("aria-label", (delta > 0 ? "Add one more " : "Remove one ") + product.name);
  button.addEventListener("click", () => changeQty(product.id, delta));
  return button;
}

function toggleBasketActions(hasItems) {
  document.querySelectorAll("[data-basket-actions]").forEach((box) => {
    box.hidden = !hasItems;
  });
}

/* ---------- Contact page: pre-fill from saved data ---------- */

function prefillContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) {
    return;
  }
  const filledFrom = [];

  const details = form.querySelector("#item-details");
   
  const basketText = basketAsText();
  if (details && details.value.trim() === "" && basketText !== "") {
    details.value = basketText;
     
    filledFrom.push("your saved pre-order list");
  }

  const customer = readStore(STORAGE_KEYS.customer, null);
  if (customer && typeof customer === "object") {
    const filledContact = ["full-name", "email", "phone"].filter((id) => {
      const field = form.querySelector("#" + id);
      if (field && field.value.trim() === "" && customer[id]) {
        field.value = customer[id];
        return true;
      }
      return false;
    });
    if (filledContact.length > 0) {
      filledFrom.push("your details from last time");
    }
  }

  const notice = document.querySelector("[data-prefill-notice]");
  if (notice) {
    notice.hidden = filledFrom.length === 0;
    const text = notice.querySelector("[data-prefill-text]");
    if (text) {
      text.textContent = "We filled this in from " + filledFrom.join(" and ") + ".";
    }
  }
}

function saveCustomer(form) {
  const customer = {};
  ["full-name", "email", "phone"].forEach((id) => {
    const field = form.querySelector("#" + id);
    if (field) {
      customer[id] = field.value.trim();
    }
  });
  writeStore(STORAGE_KEYS.customer, customer);
}

/* ---------- Contact page: validation ---------- */

function todayAsInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function showError(field, message) {
  const holder = document.querySelector("#" + field.id + "-error");
  if (holder) {
    holder.textContent = message;
  }
  field.setAttribute("aria-invalid", "true");
}

function clearError(field) {
  const holder = document.querySelector("#" + field.id + "-error");
  if (holder) {
    holder.textContent = "";
  }
  field.removeAttribute("aria-invalid");
}

// Returns an error message, or an empty string when the field is fine.
function checkField(rule, form) {
  const field = form.querySelector("#" + rule.id);
  if (!field) {
    return "";
  }
  const value = field.value;
  if (rule.optional && value.trim() === "") {
    clearError(field);
    return "";
  }
  if (rule.check(value)) {
    clearError(field);
    return "";
  }
  showError(field, rule.message);
  return rule.message;
}

// The radio group needs its own check because the value lives across four inputs.
function checkRequestType(form) {
  const chosen = form.querySelector("input[name='request-type']:checked");
  const holder = document.querySelector("#request-type-error");
  if (chosen) {
    if (holder) {
      holder.textContent = "";
    }
    return "";
  }
  const message = "Choose a request type so we send this to the right person.";
  if (holder) {
    holder.textContent = message;
  }
  return message;
}

function validateForm(form) {
  const problems = [];
  FIELD_RULES.forEach((rule) => {
    if (checkField(rule, form) !== "") {
      problems.push(rule.id);
    }
  });
  if (checkRequestType(form) !== "") {
    problems.push("type-preorder");
  }
  return problems;
}

function setFormStatus(message, isError) {
  const status = document.querySelector("[data-form-status]");
  if (!status) {
    return;
  }
  status.hidden = message === "";
  status.textContent = message;
  status.classList.toggle("status-error", Boolean(isError));
  status.classList.toggle("status-ok", message !== "" && !isError);
}

function setUpForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) {
    return;
  }

  // Set here, not in the HTML, so native validation still runs if JS fails to load.
  form.setAttribute("novalidate", "novalidate");

  // Re-check a field once the user leaves it, so errors clear as they are fixed.
  FIELD_RULES.forEach((rule) => {
    const field = form.querySelector("#" + rule.id);
    if (field) {
      field.addEventListener("blur", () => checkField(rule, form));
    }
  });
  form.querySelectorAll("input[name='request-type']").forEach((radio) => {
    radio.addEventListener("change", () => checkRequestType(form));
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // No server on this project, so we handle it here.
    const problems = validateForm(form);

    if (problems.length > 0) {
      setFormStatus(
        problems.length === 1
          ? "One field needs attention. See the message below it."
          : problems.length + " fields need attention. See the messages below them.",
        true
      );
      const first = document.getElementById(problems[0]);
      if (first) {
        first.focus();
      }
      return;
    }

    saveCustomer(form);
    clearBasket();
    setFormStatus(
      "Thank you. Your pre-order request is ready to send, and we saved your details for next time.",
      false
    );
  });
  const clearPrefill = document.querySelector("[data-clear-prefill]");
  if (clearPrefill) {
    clearPrefill.addEventListener("click", function () {
      const details = form.querySelector("#item-details");
      if (details) {
        details.value = "";
        details.focus();
      }
      const notice = document.querySelector("[data-prefill-notice]");
      if (notice) {
        notice.hidden = true;
      }
    });
  }
}

/* ---------- Start ---------- */


function init() {
  updateBasketStatus();
  buildFilterBar();
  buildAddButtons();
  renderBasket();
  prefillContactForm();
  setUpForm();

  const clearAll = document.querySelector("[data-clear-basket]");
  if (clearAll) {
    clearAll.addEventListener("click", clearBasket);
  }
}

document.addEventListener("DOMContentLoaded", init);
