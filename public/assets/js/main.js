// assets/js/main.js
import { setupRouter, registerViewInit } from './router.js';

const products = [];
const sales = [];
let currentEditIndex = null;

// ============ AUTH CHECK ============
function redirectIfNotLoggedIn() {
  const username = localStorage.getItem('username');
  if (!username) location.replace('landing.html');
}

// ============ USER DISPLAY & LOGOUT ============
export function initDashboardView() {
  redirectIfNotLoggedIn();

  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');
  const username = localStorage.getItem('username');
  if (username && usernameDisplay) usernameDisplay.textContent = username;

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('username');
    location.replace('landing.html');
  });

  // ============ STOCK MODAL FUNCTIONALITY ============
  const openModalBtn = document.getElementById('open-stock-modal');
  const stockModal = document.getElementById('stock-modal');
  const closeModalBtn = document.getElementById('close-stock-modal');
  const stockForm = document.getElementById('stock-form');

  if (openModalBtn && stockModal && closeModalBtn && stockForm) {
    openModalBtn.addEventListener('click', () => stockModal.style.display = 'flex');
    closeModalBtn.addEventListener('click', () => stockModal.style.display = 'none');
    window.addEventListener('click', e => {
      if (e.target === stockModal) stockModal.style.display = 'none';
    });

    stockForm.addEventListener('submit', handleStockFormSubmit);
  }

  const sortSelect = document.getElementById('sort-order');
  if (sortSelect) {
    sortSelect.addEventListener('change', loadStockItems);
  }

  loadStockItems();
}

// ─── Handle Stock Form Submit ──────────────────────
async function handleStockFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('stock-name');
  const priceInput = document.getElementById('stock-price');
  const quantityInput = document.getElementById('stock-quantity');
  const imageInput = document.getElementById('stock-image');
  const dateInput = document.getElementById('stock-date');

  const name = nameInput.value.trim();
  const price = priceInput.value;
  const quantity = quantityInput.value;
  const imageFile = imageInput.files[0];
  const date = dateInput.value;

  if (!name || !price || !quantity || !imageFile || !date) return alert('Fill all fields properly.');

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('quantity', quantity);
  formData.append('image', imageFile);
  formData.append('date', date);

  try {
    const res = await fetch('/api/stock', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      alert('✅ Stock added and saved!');
      document.getElementById('stock-modal').style.display = 'none';
      document.getElementById('stock-form').reset();
      loadStockItems();
    } else {
      alert('🚫 Error: ' + data.message);
    }
  } catch (err) {
    alert('🔥 Server error.');
    console.error(err);
  }
}

// ─── Exported Function to Load Stock Items ──────────────────────
export async function loadStockItems() {
  try {
    const res = await fetch('/stock.json');
    let stockList = await res.json();
    const container = document.getElementById('stock-list');
    const sortOrder = document.getElementById('sort-order')?.value || 'latest';

    if (!container) return console.error('❌ Element with ID "stock-list" not found in DOM.');

    stockList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'earliest' ? dateA - dateB : dateB - dateA;
    });

    container.innerHTML = '';
    stockList.forEach(item => {
      const div = document.createElement('div');
      div.className = 'bg-white rounded-xl p-4 shadow-md flex items-center gap-4';

      div.innerHTML = `
        <img src="/uploads/${item.image}" alt="${item.name}" class="w-24 h-24 object-contain rounded-md border" />
        <div>
          <h3 class="text-lg font-semibold">${item.name}</h3>
          <p>Quantity: <span class="font-bold">${item.quantity}</span></p>
          <p>Price: <span class="text-green-600 font-bold">KSH ${item.price}</span></p>
          <p>Date: <span class="font-medium">${new Date(item.date).toLocaleDateString()}</span></p>
        </div>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error('❌ Failed to load stock items:', err);
  }
}

// Register dashboard view load
registerViewInit('dashboard', initDashboardView);

// ============ PRODUCT VIEW ============
export function initProductsView() {
  redirectIfNotLoggedIn();

  const idInput = document.getElementById('product-id');
  const nameInput = document.getElementById('product-name');
  const qtyInput = document.getElementById('product-qty');
  const productListEl = document.getElementById('product-list');
  const modal = document.getElementById('edit-modal');
  const editNameInput = document.getElementById('edit-name');
  const editQtyInput = document.getElementById('edit-qty');
  const saveEditBtn = document.getElementById('save-edit-btn');
  const editClose = document.getElementById('edit-close');

  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    const id = idInput.value.trim();
    const name = nameInput.value.trim();
    const quantity = qtyInput.value.trim();
    if (!id || !name || !quantity) return alert('Please fill all fields.');

    if (products.some(p => p.id === id)) return alert('Product ID already exists.');

    products.push({ id, name, quantity: parseInt(quantity) });
    renderProducts();
    idInput.value = nameInput.value = qtyInput.value = '';
  });

  function renderProducts() {
    productListEl.innerHTML = '';
    products.forEach((p, index) => {
      const li = document.createElement('li');
      li.innerHTML = `ID: ${p.id} | ${p.name} | Qty: ${p.quantity} <button class="edit-btn" data-index="${index}">Edit</button>`;
      productListEl.appendChild(li);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-index'));
        currentEditIndex = i;
        editNameInput.value = products[i].name;
        editQtyInput.value = products[i].quantity;
        modal.style.display = 'flex';
      });
    });
  }

  saveEditBtn.onclick = () => {
    const newName = editNameInput.value.trim();
    const newQty = parseInt(editQtyInput.value.trim());
    if (!newName || isNaN(newQty) || newQty < 0) return alert('Please enter valid product details.');
    products[currentEditIndex].name = newName;
    products[currentEditIndex].quantity = newQty;
    renderProducts();
    modal.style.display = 'none';
  };

  editClose.onclick = () => modal.style.display = 'none';
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  renderProducts();
}

// ============ SALES VIEW ============
export function initSalesView() {
  redirectIfNotLoggedIn();

  const newSaleBtn = document.getElementById('new-sale-btn');
  const saleProductDropdown = document.getElementById('sale-product');
  const saleQtyInput = document.getElementById('sale-qty');
  const saleModal = document.getElementById('sale-modal');
  const saleClose = document.getElementById('sale-close');
  const confirmSaleBtn = document.getElementById('confirm-sale-btn');

  newSaleBtn?.addEventListener('click', () => {
    const availableProducts = products.filter(p => p.quantity > 0);
    if (!availableProducts.length) return alert('No products available for sale.');

    saleProductDropdown.innerHTML = '';
    availableProducts.forEach(product => {
      const option = document.createElement('option');
      option.value = products.indexOf(product);
      option.textContent = `${product.name} (Available: ${product.quantity})`;
      saleProductDropdown.appendChild(option);
    });
    saleModal.style.display = 'flex';
  });

  confirmSaleBtn?.addEventListener('click', () => {
    const selectedIndex = saleProductDropdown.value;
    const quantity = parseInt(saleQtyInput.value.trim());

    if (selectedIndex === '' || isNaN(quantity) || quantity <= 0)
      return alert('Please select a product and enter a valid quantity.');

    const product = products[selectedIndex];
    if (quantity > product.quantity)
      return alert(`Not enough stock for ${product.name}`);

    product.quantity -= quantity;
    const timestamp = new Date().toLocaleString();
    sales.push({ items: [{ name: product.name, soldQty: quantity }], timestamp });

    saleModal.style.display = 'none';
    saleProductDropdown.value = '';
    saleQtyInput.value = '';
    showToast();
  });

  saleClose.onclick = () => saleModal.style.display = 'none';
  window.addEventListener('click', e => { if (e.target === saleModal) saleModal.style.display = 'none'; });
}

// ============ REPORT VIEW ============
export function initReportsView() {
  redirectIfNotLoggedIn();

  const reportList = document.getElementById('report-list');
  if (!reportList) return;
  reportList.innerHTML = '';

  sales.forEach(sale => {
    const li = document.createElement('li');
    const itemsText = sale.items.map(item => `${item.name} x ${item.soldQty}`).join(', ');
    li.textContent = `${sale.timestamp} | ${itemsText}`;
    reportList.appendChild(li);
  });
}

// ============ Register in Router ============
registerViewInit('products', initProductsView);
registerViewInit('sales', initSalesView);
registerViewInit('reports', initReportsView);
registerViewInit('dashboard', initDashboardView);

export function initView(viewId) {
  const views = {
    products: initProductsView,
    sales: initSalesView,
    reports: initReportsView
  };
  views[viewId]?.();
}

function showToast(message = '✅ Sale complete!') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2500);
}

// Start routing
setupRouter();
