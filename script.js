// Star Fruniture & Bedding Works – billing app
// Features:
// - Product catalogue with photos and prices
// - Cart CRUD (create, read, update, delete line items)
// - Simple totals calculator (no tax)
// - Pay now (QR preview) and monthly sales report (stored in localStorage)

const itemsBody = document.getElementById("itemsBody");
const addItemBtn = document.getElementById("addItemBtn");
const subtotalDisplay = document.getElementById("subtotalDisplay");
const grandTotalDisplay = document.getElementById("grandTotalDisplay");
const printBtn = document.getElementById("printBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const payNowBtn = document.getElementById("payNowBtn");
const reportBtn = document.getElementById("reportBtn");

const catalogGrid = document.getElementById("catalogGrid");
const qrModal = document.getElementById("qrModal");
const closeQrBtn = document.getElementById("closeQrBtn");
const reportModal = document.getElementById("reportModal");
const closeReportBtn = document.getElementById("closeReportBtn");
const monthlyReportBody = document.getElementById("monthlyReportBody");
const monthlyReportEmpty = document.getElementById("monthlyReportEmpty");

const SALES_STORAGE_KEY = "starFurnitureSales";

// Open‑source-friendly photos from Unsplash Source (royalty-free).
// These endpoints always return a furniture-related image.
const products = [
  {
    id: "bed",
    name: "King size bed",
    description: "Solid wood bed with storage.",
    price: 25000,
    image: "https://source.unsplash.com/featured/?bed,furniture",
    tag: "Bed",
  },
  {
    id: "wooden-sofa",
    name: "Wooden sofa",
    description: "Three seater classic wooden sofa.",
    price: 18000,
    image: "https://source.unsplash.com/featured/?wooden,sofa",
    tag: "Wooden sofa",
  },
  {
    id: "cushion-sofa",
    name: "Cushion sofa",
    description: "Soft cushion sofa for living room.",
    price: 22000,
    image: "https://source.unsplash.com/featured/?cushion,sofa",
    tag: "Cushion sofa",
  },
];

function formatCurrency(value) {
  if (isNaN(value) || !isFinite(value)) return "₹0.00";
  return `₹${value.toFixed(2)}`;
}

function parseCurrency(text) {
  if (!text) return 0;
  const cleaned = text.toString().replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function createItemRow(description = "", quantity = 1, unitPrice = 0) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <input
        type="text"
        class="item-desc"
        placeholder="e.g. Wooden dining table"
        value="${description}"
      />
    </td>
    <td>
      <input
        type="number"
        min="0"
        step="1"
        class="item-qty number-input"
        value="${quantity}"
      />
    </td>
    <td>
      <input
        type="number"
        min="0"
        step="0.01"
        class="item-price number-input"
        value="${unitPrice}"
      />
    </td>
    <td class="line-total">₹0.00</td>
    <td>
      <button type="button" class="remove-btn" title="Remove item">✕</button>
    </td>
  `;

  itemsBody.appendChild(tr);
  attachRowEvents(tr);
  updateTotals();
}

function attachRowEvents(row) {
  const qtyInput = row.querySelector(".item-qty");
  const priceInput = row.querySelector(".item-price");
  const removeBtn = row.querySelector(".remove-btn");

  function onChange() {
    updateTotals();
  }

  qtyInput.addEventListener("input", onChange);
  priceInput.addEventListener("input", onChange);

  removeBtn.addEventListener("click", () => {
    row.remove();
    updateTotals();
  });
}

function updateTotals() {
  let subtotal = 0;

  Array.from(itemsBody.querySelectorAll("tr")).forEach((row) => {
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");
    const lineTotalCell = row.querySelector(".line-total");

    const qty = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const lineTotal = qty * price;

    lineTotalCell.textContent = formatCurrency(lineTotal);
    subtotal += lineTotal;
  });

  const grandTotal = subtotal;

  subtotalDisplay.textContent = formatCurrency(subtotal);
  grandTotalDisplay.textContent = formatCurrency(grandTotal);
}

// ----- Product catalogue -----

function renderCatalog() {
  if (!catalogGrid) return;
  catalogGrid.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.description}</div>
        <div class="product-meta">
          <span class="product-price">${formatCurrency(product.price)}</span>
          <span class="badge">${product.tag}</span>
        </div>
        <div class="product-actions">
          <button
            type="button"
            class="product-add-btn"
            data-product-id="${product.id}"
          >
            Add to bill
          </button>
        </div>
      </div>
    `;
    catalogGrid.appendChild(card);
  });
}

// ----- Sales storage & report -----

function loadSales() {
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSales(sales) {
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  } catch {
    // ignore write errors (e.g. private mode)
  }
}

function recordSale(invoiceDate, totalAmount) {
  const sales = loadSales();
  sales.push({
    date: invoiceDate,
    total: totalAmount,
    createdAt: new Date().toISOString(),
  });
  saveSales(sales);
}

function buildMonthlyReport() {
  if (!monthlyReportBody || !monthlyReportEmpty) return;

  const sales = loadSales();
  const monthlyTotals = {};

  sales.forEach((sale) => {
    const date = sale.date || sale.createdAt || "";
    const monthKey = date.slice(0, 7); // YYYY-MM
    if (!monthKey) return;
    const amount = Number(sale.total) || 0;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
  });

  const entries = Object.entries(monthlyTotals).sort(
    (a, b) => (a[0] < b[0] ? -1 : 1)
  );

  monthlyReportBody.innerHTML = "";

  if (entries.length === 0) {
    monthlyReportEmpty.style.display = "block";
    return;
  }

  monthlyReportEmpty.style.display = "none";

  entries.forEach(([month, total]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${month}</td>
      <td>${formatCurrency(total)}</td>
    `;
    monthlyReportBody.appendChild(tr);
  });
}

// ----- Modals -----

function openModal(modal) {
  if (modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
}

// ----- Event wiring -----

addItemBtn.addEventListener("click", () => {
  createItemRow();
});

printBtn.addEventListener("click", () => {
  window.print();
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all items and fields?")) return;

  // Clear item rows
  itemsBody.innerHTML = "";
  // Clear text inputs and textareas except date and invoice #
  document
    .querySelectorAll(
      "#customerName, #customerPhone, #customerAddress, #notes"
    )
    .forEach((el) => {
      el.value = "";
    });
  updateTotals();
});

// Add items from catalogue into cart (Create in CRUD)
if (catalogGrid) {
  catalogGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".product-add-btn");
    if (!button) return;
    const id = button.getAttribute("data-product-id");
    const product = products.find((p) => p.id === id);
    if (!product) return;
    createItemRow(product.name, 1, product.price);
  });
}

// Pay now: save sale and show QR modal
if (payNowBtn) {
  payNowBtn.addEventListener("click", () => {
    const grandTotal = parseCurrency(grandTotalDisplay.textContent);
    if (grandTotal <= 0) {
      alert("Please add at least one item before taking payment.");
      return;
    }

    const dateInput = document.getElementById("invoiceDate");
    let invoiceDate =
      dateInput && dateInput.value
        ? dateInput.value
        : new Date().toISOString().slice(0, 10);

    recordSale(invoiceDate, grandTotal);
    openModal(qrModal);
  });
}

if (closeQrBtn) {
  closeQrBtn.addEventListener("click", () => closeModal(qrModal));
}

if (qrModal) {
  qrModal.addEventListener("click", (event) => {
    if (event.target === qrModal) {
      closeModal(qrModal);
    }
  });
}

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
    buildMonthlyReport();
    openModal(reportModal);
  });
}

if (closeReportBtn) {
  closeReportBtn.addEventListener("click", () => closeModal(reportModal));
}

if (reportModal) {
  reportModal.addEventListener("click", (event) => {
    if (event.target === reportModal) {
      closeModal(reportModal);
    }
  });
}

// Initialize with one empty row and set today as default date
window.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("invoiceDate");
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  if (itemsBody.children.length === 0) {
    createItemRow();
  } else {
    updateTotals();
  }

  renderCatalog();
});
