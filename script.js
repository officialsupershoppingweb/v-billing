// --- GLOBAL DATA STORES ---
let MASTER_PASSWORD = "1234"; // Aapka password

// Categories ke sath unke specific FontAwesome icons aur sizes mapping
let categoriesData = [
    { name: "Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Pant", icon: "fa-user-ninja", sizes: ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Tunic", icon: "fa-person-dress", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { name: "Ricon Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tousure Pant", icon: "fa-user-ninja", sizes: ["32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Skirt", icon: "fa-person-dress-fairy", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36"] },
    { name: "RPS Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Pant", icon: "fa-user-ninja", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Skirt", icon: "fa-person-dress", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Lower", icon: "fa-socks", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS T-shirt", icon: "fa-tshirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tie", icon: "fa-tie", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Belt", icon: "fa-hard-drive", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Bag", icon: "fa-bag-shopping", sizes: ["200-250", "250-300", "300-350", "350-400", "400-500", "500-550", "550-600"] }
];

let inventory = JSON.parse(localStorage.getItem('vb_inventory')) || [];
let cart = [];
let historyLogs = JSON.parse(localStorage.getItem('vb_history')) || [];
let currentFilteredHistory = [];
let uploadedImageBase64 = "";

window.onload = function() {
    renderCategories();
    cleanOldHistory();
    resetHistoryFilter();
};

// --- SECURITY: PASSWORD ---
function checkPassword() {
    let enteredInput = document.getElementById('master-password').value;
    if(enteredInput === MASTER_PASSWORD) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
    } else {
        document.getElementById('login-error').innerText = "Wrong Password! Please try again.";
    }
}

// --- NAVIGATION ---
function switchPage(pageId) {
    document.querySelectorAll('.app-page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    event.currentTarget.classList.add('active-nav');
    
    if(pageId === 'home') {
        document.getElementById('top-search-bar').classList.remove('hidden');
        showCategories();
    } else {
        document.getElementById('top-search-bar').classList.add('hidden');
    }
    if(pageId === 'cart') { renderCart(); }
    if(pageId === 'billing') { updateInvoicePreview(); }
    if(pageId === 'calculator') { renderLedgerTable(); }
}

// --- HOME & CATEGORIES ---
function renderCategories() {
    let container = document.getElementById('categories-container');
    container.innerHTML = "";
    categoriesData.forEach(cat => {
        container.innerHTML += `
            <div class="category-card" onclick="openCategory('${cat.name}')">
                <i class="fa ${cat.icon}"></i>
                ${cat.name}
            </div>
        `;
    });
    // Add Category button
    container.innerHTML += `
        <div class="category-card add-btn" onclick="alert('To add new master category, contact admin or add items with new title.')">
            <i class="fa fa-plus-circle"></i>
            [+] Add Category
        </div>
    `;
}

function openCategory(categoryName) {
    document.getElementById('categories-container').classList.add('hidden');
    let view = document.getElementById('product-view');
    view.classList.remove('hidden');
    document.getElementById('current-category-title').innerText = categoryName;
    
    let catObj = categoriesData.find(c => c.name === categoryName);
    let sizeContainer = document.getElementById('size-filters-container');
    sizeContainer.innerHTML = "";
    
    catObj.sizes.forEach((size, idx) => {
        let activeClass = idx === 0 ? 'active-size' : '';
        sizeContainer.innerHTML += `<button class="size-chip ${activeClass}" onclick="filterSize('${categoryName}', '${size}', this)">${size}</button>`;
    });
    
    if(catObj.sizes.length > 0) { renderProducts(categoryName, catObj.sizes[0]); }
}

function showCategories() {
    document.getElementById('product-view').classList.add('hidden');
    document.getElementById('categories-container').classList.remove('hidden');
}

function filterSize(category, size, btnElement) {
    document.querySelectorAll('.size-chip').forEach(chip => chip.classList.remove('active-size'));
    btnElement.classList.add('active-size');
    renderProducts(category, size);
}

function renderProducts(category, size) {
    let container = document.getElementById('products-list-container');
    container.innerHTML = "";
    let filtered = inventory.filter(item => item.category === category && item.size === size);
    if(filtered.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/3; color:#666; text-align:center; padding:20px;">No items added in this size.</p>`;
        return;
    }
    filtered.forEach(item => {
        let cartItem = cart.find(c => c.id === item.id);
        let currentQty = cartItem ? cartItem.qty : 0;
        container.innerHTML += `
            <div class="product-card">
                <img src="${item.image || 'https://via.placeholder.com/150?text=No+Photo'}" alt="Product">
                <h4>${item.title}</h4>
                <p class="price">₹${item.price}</p>
                <p class="stock">Stock: ${item.stock} Pcs</p>
                <div class="qty-control">
                    <button onclick="updateCartQty('${item.id}', -1)">-</button>
                    <span>${currentQty}</span>
                    <button onclick="updateCartQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function searchProducts() {
    let query = document.getElementById('search-input').value.toLowerCase();
    if(!query) { showCategories(); return; }
    document.getElementById('categories-container').classList.add('hidden');
    let view = document.getElementById('product-view');
    view.classList.remove('hidden');
    document.getElementById('current-category-title').innerText = "Search Results";
    document.getElementById('size-filters-container').innerHTML = "";
    
    let container = document.getElementById('products-list-container');
    container.innerHTML = "";
    let filtered = inventory.filter(item => item.title.toLowerCase().includes(query));
    filtered.forEach(item => {
        let cartItem = cart.find(c => c.id === item.id);
        let currentQty = cartItem ? cartItem.qty : 0;
        container.innerHTML += `
            <div class="product-card">
                <img src="${item.image}" alt="Product">
                <h4>${item.title} (${item.size})</h4>
                <p class="price">₹${item.price}</p>
                <div class="qty-control">
                    <button onclick="updateCartQty('${item.id}', -1)">-</button>
                    <span>${currentQty}</span>
                    <button onclick="updateCartQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

// --- CART & EXTRA CUSTOM ITEM ---
function updateCartQty(id, change) {
    let item = inventory.find(i => i.id === id);
    let cartItem = cart.find(c => c.id === id);
    
    if(cartItem) {
        cartItem.qty += change;
        if(cartItem.qty <= 0) cart = cart.filter(c => c.id !== id);
    } else if(change > 0) {
        cart.push({ id: item.id, title: item.title, size: item.size, price: item.price, qty: 1, isCustom: false });
    }
    
    document.getElementById('cart-total-qty').innerText = cart.reduce((acc, curr) => acc + curr.qty, 0);
}

function addCustomItemToCart() {
    let name = document.getElementById('extra-name').value;
    let price = Number(document.getElementById('extra-price').value);
    let qty = Number(document.getElementById('extra-qty').value) || 1;
    
    if(!name || !price) { alert("Please enter custom item name and price!"); return; }
    
    cart.push({
        id: "CUSTOM-" + Date.now(),
        title: name,
        size: "Extra",
        price: price,
        qty: qty,
        isCustom: true
    });
    
    document.getElementById('extra-name').value = "";
    document.getElementById('extra-price').value = "";
    document.getElementById('extra-qty').value = "1";
    document.getElementById('cart-total-qty').innerText = cart.reduce((acc, curr) => acc + curr.qty, 0);
    renderCart();
}

function renderCart() {
    let container = document.getElementById('cart-items-container');
    container.innerHTML = "";
    if(cart.length === 0) { container.innerHTML = "<p style='color:#666; text-align:center;'>Your cart is empty.</p>"; return; }
    
    cart.forEach(item => {
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                <div>
                    <strong>${item.title} (${item.size})</strong>
                    <p style="color:#1a365d; font-weight:600;">₹${item.price} x ${item.qty}</p>
                </div>
                <div class="qty-control">
                    <button onclick="removeOrDecreaseCartItem('${item.id}')">-</button>
                    <span>${item.qty}</span>
                    <button onclick="increaseCartItem('${item.id}')">+</button>
                </div>
            </div>
        `;
    });
}

function increaseCartItem(id) {
    let cartItem = cart.find(c => c.id === id);
    if(cartItem) {
        if(cartItem.isCustom) { cartItem.qty += 1; } else { updateCartQty(id, 1); }
    }
    renderCart();
}

function removeOrDecreaseCartItem(id) {
    let cartItem = cart.find(c => c.id === id);
    if(cartItem) {
        if(cartItem.isCustom) {
            cartItem.qty -= 1;
            if(cartItem.qty <= 0) cart = cart.filter(c => c.id !== id);
        } else {
            updateCartQty(id, -1);
        }
    }
    renderCart();
}

function confirmToReceipt() {
    if(cart.length === 0) { alert("Please add items to cart first!"); return; }
    switchPage('billing');
}

// --- BILLING PAGE & THERMAL INVOICE ---
function updateInvoicePreview() {
    let area = document.getElementById('invoice-print-area');
    let name = document.getElementById('cust-name').value || "Walk-in Customer";
    let phone = document.getElementById('cust-phone').value || "N/A";
    let dateStr = new Date().toLocaleDateString('en-IN');
    let timeStr = new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
    let invNo = "VB-" + Date.now().toString().slice(-6);
    
    let totalBill = cart.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    let selectedMode = document.querySelector('input[name="bill-payment-mode"]:checked').value;
    
    let upiID = "yourshopupi@okaxis"; // Real UPI link placeholder
    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${upiID}%26pn=Vbilling%26am=${totalBill}%26cu=INR`;

    let itemRows = "";
    cart.forEach(item => {
        itemRows += `<tr><td style="padding:4px 0;">${item.title} (${item.size})</td><td style="text-align:center;">${item.qty}</td><td style="text-align:right;">${item.price}.00</td><td style="text-align:right;">${item.price * item.qty}.00</td></tr>`;
    });

    area.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #1a365d; padding-bottom:5px; margin-bottom:5px;">
            <h2 style="margin:0; font-size:16px; color:#1a365d; font-weight:bold;">V billing</h2>
            <p style="font-size:10px; margin:2px 0; color:#555;">Chopra Kala Mau, Lucknow<br>School Uniform Specialist</p>
        </div>
        <table style="width:100%; font-size:10px; margin-bottom:5px;">
            <tr><td><strong>Cust:</strong> ${name}</td><td style="text-align:right;"><strong>Date:</strong> ${dateStr}</td></tr>
            <tr><td><strong>Mob:</strong> ${phone}</td><td style="text-align:right;"><strong>Inv:</strong> ${invNo}</td></tr>
        </table>
        <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:5px;">
            <thead>
                <tr style="border-top:1px solid #1a365d; border-bottom:1px solid #1a365d; font-weight:bold; color:#1a365d;">
                    <th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Total</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>
        
        <div style="display:flex; justify-content:space-between; border-top:1px solid #1a365d; padding-top:4px; font-weight:bold; font-size:11px;">
            <span style="color:green;">MODE: ${selectedMode.toUpperCase()}</span>
            <span style="color:#1a365d; font-size:12px;">GRAND TOTAL: ₹${totalBill}.00</span>
        </div>

        <div style="text-align:center; margin-top:8px;">
            <div style="width:100px; height:100px; border:1px solid #1a365d; margin:0 auto; padding:2px;">
                <img src="${totalBill > 0 ? qrUrl : ''}" style="width:100%; height:100%;" alt="QR Code">
            </div>
            <p style="font-size:8px; color:#555; margin-top:2px;">Scan via PhonePe, GPay, Paytm</p>
        </div>
        <div style="text-align:center; border-top:1px dashed #1a365d; padding-top:4px; margin-top:8px; font-weight:bold; font-size:9px; color:#c62828; letter-spacing:0.5px;">
            GOODS SOLD WILL NOT BE RETURNED
        </div>
    `;
    area.dataset.total = totalBill;
    area.dataset.name = name;
    area.dataset.phone = phone;
}

function enableInvoiceEdit() { switchPage('cart'); }

function cancelCurrentBill() {
    if(confirm("Are you sure you want to delete/cancel this current bill?")) {
        cart = [];
        document.getElementById('cart-total-qty').innerText = "0";
        document.getElementById('cust-name').value = "";
        document.getElementById('cust-phone').value = "";
        switchPage('home');
        alert("Bill deleted successfully.");
    }
}

function printThermalBill() {
    let total = document.getElementById('invoice-print-area').dataset.total;
    let name = document.getElementById('invoice-print-area').dataset.name;
    let phone = document.getElementById('invoice-print-area').dataset.phone;
    let selectedMode = document.querySelector('input[name="bill-payment-mode"]:checked').value;
    
    if(!total || total == 0) return;
    
    // Automatic Inventory Stock Deduct Logic
    cart.forEach(c => {
        if(!c.isCustom) {
            let invItem = inventory.find(i => i.id === c.id);
            if(invItem) { invItem.stock = Math.max(0, invItem.stock - c.qty); }
        }
    });
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));

    // Save logs
    let log = {
        id: "LOG-" + Date.now(),
        name: name,
        phone: phone,
        total: total,
        mode: selectedMode,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-IN')
    };
    historyLogs.unshift(log);
    localStorage.setItem('vb_history', JSON.stringify(historyLogs));
    
    window.print();
    cart = [];
    document.getElementById('cart-total-qty').innerText = "0";
    document.getElementById('cust-name').value = "";
    document.getElementById('cust-phone').value = "";
    resetHistoryFilter();
}

function shareOnWhatsApp() {
    let phone = document.getElementById('cust-phone').value;
    let total = document.getElementById('invoice-print-area').dataset.total;
    if(!phone) { alert("Please input Customer Mobile Number!"); return; }
    
    let text = `*V billing Invoice*\nCustomer: ${document.getElementById('cust-name').value || 'Customer'}\nTotal Bill: ₹${total}.00\n\nGOODS SOLD WILL NOT BE RETURNED.\nThank you!`;
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`);
}

// --- PAGE 4: ADD STOCK ---
function previewImage(event) {
    let reader = new FileReader();
    reader.onload = function() {
        uploadedImageBase64 = reader.result;
        document.getElementById('image-preview-container').innerHTML = `<img src="${uploadedImageBase64}">`;
    };
    reader.readAsDataURL(event.target.files[0]);
}

function saveNewStock() {
    let title = document.getElementById('stock-title').value;
    let category = document.getElementById('stock-category').value;
    let size = document.getElementById('stock-size').value;
    let price = document.getElementById('stock-price').value;
    let qty = document.getElementById('stock-qty').value;
    let desc = document.getElementById('stock-desc').value;

    if(!title || !size || !price || !qty) { alert("Please fill all compulsory fields!"); return; }

    inventory.push({
        id: "ITEM-" + Date.now(),
        title, category, size,
        price: Number(price),
        stock: Number(qty),
        description: desc,
        image: uploadedImageBase64 || ""
    });
    
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));
    alert("Stock saved successfully!");
    
    document.getElementById('stock-title').value = "";
    document.getElementById('stock-size').value = "";
    document.getElementById('stock-price').value = "";
    document.getElementById('stock-qty').value = "";
    document.getElementById('stock-desc').value = "";
    document.getElementById('image-preview-container').innerHTML = "";
    uploadedImageBase64 = "";
}

// --- PAGE 5: HISTORY WITH DATE FILTERS ---
function renderHistory(logsData = historyLogs) {
    let tbody = document.getElementById('history-table-body');
    tbody.innerHTML = "";
    logsData.forEach(log => {
        let modeColor = log.mode === 'Online' ? 'var(--purple-online)' : 'var(--success-green)';
        tbody.innerHTML += `
            <tr>
                <td><strong>${log.name}</strong><br><span style="color:#666; font-size:10px;">Mob: ${log.phone || 'N/A'}</span></td>
                <td>₹${log.total}</td>
                <td><span style="color:${modeColor}; font-weight:bold;">${log.mode}</span></td>
                <td style="font-size:10px;">${log.dateStr}</td>
            </tr>
        `;
    });
}

function filterHistoryByDay(day) {
    let todayStr = new Date().toLocaleDateString('en-IN');
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayStr = yesterday.toLocaleDateString('en-IN');
    
    let targetStr = (day === 'today') ? todayStr : yesterdayStr;
    let filtered = historyLogs.filter(log => log.dateStr === targetStr);
    renderHistory(filtered);
}

function filterHistoryByCustomDate() {
    let rawDate = document.getElementById('history-custom-date').value;
    if(!rawDate) return;
    let selectedDateStr = new Date(rawDate).toLocaleDateString('en-IN');
    let filtered = historyLogs.filter(log => log.dateStr === selectedDateStr);
    renderHistory(filtered);
}

function resetHistoryFilter() {
    document.getElementById('history-custom-date').value = "";
    renderHistory(historyLogs);
}

function cleanOldHistory() {
    let sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    historyLogs = historyLogs.filter(log => log.timestamp > sixMonthsAgo);
    localStorage.setItem('vb_history', JSON.stringify(historyLogs));
}

// --- PAGE 6: LEDGER CALCULATOR ---
let ledgerItems = [];
function addLedgerRow() {
    let item = document.getElementById('calc-item-name').value || "General Item";
    let price = Number(document.getElementById('calc-item-price').value);
    let qty = Number(document.getElementById('calc-item-qty').value) || 1;
    if(!price) { alert("Please input Price!"); return; }

    ledgerItems.push({ item, qty, price, total: price * qty });
    renderLedgerTable();
    
    document.getElementById('calc-item-name').value = "";
    document.getElementById('calc-item-price').value = "";
    document.getElementById('calc-item-qty').value = "1";
}

function renderLedgerTable() {
    let container = document.getElementById('calculator-bill-area');
    let selectedMode = document.querySelector('input[name="calc-payment-mode"]:checked').value;
    let grandTotal = ledgerItems.reduce((acc, row) => acc + row.total, 0);
    let dateStr = new Date().toLocaleDateString('en-IN');

    let rowsHtml = "";
    ledgerItems.forEach((row, idx) => {
        rowsHtml += `
            <tr>
                <td>${row.item}</td>
                <td style="text-align:center;">${row.qty}</td>
                <td style="text-align:right;">₹${row.price}</td>
                <td style="text-align:right;">₹${row.total}</td>
                <td style="text-align:center;" class="no-print"><button onclick="removeLedgerRow(${idx})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa fa-trash"></i></button></td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #333; padding-bottom:5px; margin-bottom:5px;">
            <h3 style="margin:0;">V billing (Quick Calc)</h3>
            <p style="font-size:10px; margin:0;">Date: ${dateStr}</p>
        </div>
        <table id="ledger-table" style="width:100%; font-size:12px;">
            <thead>
                <tr style="border-bottom:1px solid #333;">
                    <th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th><th class="no-print" style="text-align:center;">Del</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:4px; border-top:1px solid #333; font-weight:bold;">
            <span style="color:green;">MODE: ${selectedMode.toUpperCase()}</span>
            <span>Grand Total: ₹${grandTotal}.00</span>
        </div>
        <div style="text-align:center; border-top:1px dashed #333; padding-top:5px; margin-top:8px; font-weight:bold; font-size:10px; color:#c62828;">
            GOODS SOLD WILL NOT BE RETURNED
        </div>
    `;
    container.dataset.total = grandTotal;
}

function removeLedgerRow(index) {
    ledgerItems.splice(index, 1);
    renderLedgerTable();
}

function printCalculatorBill() {
    let grandTotal = document.getElementById('calculator-bill-area').dataset.total;
    let selectedMode = document.querySelector('input[name="calc-payment-mode"]:checked').value;
    if(ledgerItems.length === 0 || grandTotal == 0) { alert("Ledger calculator list is empty!"); return; }
    
    // History log entry save
    let log = {
        id: "LOG-" + Date.now(),
        name: "Quick Calc Customer",
        phone: "N/A",
        total: grandTotal,
        mode: selectedMode,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-IN')
    };
    historyLogs.unshift(log);
    localStorage.setItem('vb_history', JSON.stringify(historyLogs));
    
    window.print();
    ledgerItems = [];
    renderLedgerTable();
    resetHistoryFilter();
}
