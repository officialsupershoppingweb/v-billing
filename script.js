// --- GLOBAL DATA STORES (Local Storage ya Default Database) ---
let MASTER_PASSWORD = "1234"; // Aap bante time yahan apna password change kar sakte hain

let categoriesData = [
    { name: "Shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Pant", sizes: ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Tunic", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { name: "Ricon Shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tousure Pant", sizes: ["32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Skirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36"] },
    { name: "RPS Shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Pant", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Skirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Lower", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS T-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tie", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Belt", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Bag", sizes: ["200-250", "250-300", "300-350", "350-400", "400-500", "500-550", "550-600"] }
];

// LocalStorage se inventory aur history load karna
let inventory = JSON.parse(localStorage.getItem('vb_inventory')) || [];
let cart = [];
let historyLogs = JSON.parse(localStorage.getItem('vb_history')) || [];
let uploadedImageBase64 = "";

// APP INITIALIZATION
window.onload = function() {
    renderCategories();
    cleanOldHistory(); // 6 Mahine ka purana data auto delete function
    renderHistory();
};

// --- SECURITY: PASSWORD SYSTEM ---
function checkPassword() {
    let enteredInput = document.getElementById('master-password').value;
    let errorMsg = document.getElementById('login-error');
    
    if(enteredInput === MASTER_PASSWORD) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
    } else {
        errorMsg.innerText = "Wrong Password! Please try again.";
    }
}

// --- NAVIGATION SYSTEM ---
function switchPage(pageId) {
    document.querySelectorAll('.app-page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
    
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    event.currentTarget.classList.add('active-nav');
    
    // Header Search Bar manage karna (Sirf Home page par active dikhe)
    if(pageId === 'home') {
        document.getElementById('top-search-bar').classList.remove('hidden');
        showCategories();
    } else {
        document.getElementById('top-search-bar').classList.add('hidden');
    }

    if(pageId === 'cart') { renderCart(); }
    if(pageId === 'billing') { generateInvoicePreview(); }
}

// --- PAGE 1: HOME (CATEGORIES & PRODUCTS) ---
function renderCategories() {
    let container = document.getElementById('categories-container');
    container.innerHTML = "";
    
    categoriesData.forEach(cat => {
        container.innerHTML += `
            <div class="category-card" onclick="openCategory('${cat.name}')">
                <i class="fa fa-tshirt" style="display:block; margin-bottom:5px; color:#1a365d;"></i>
                ${cat.name}
            </div>
        `;
    });
}

function openCategory(categoryName) {
    document.getElementById('categories-container').classList.add('hidden');
    let view = document.getElementById('product-view');
    view.classList.remove('hidden');
    
    document.getElementById('current-category-title').innerText = categoryName;
    
    // Sizes buttons generate karna
    let catObj = categoriesData.find(c => c.name === categoryName);
    let sizeContainer = document.getElementById('size-filters-container');
    sizeContainer.innerHTML = "";
    
    catObj.sizes.forEach((size, idx) => {
        let activeClass = idx === 0 ? 'active-size' : '';
        sizeContainer.innerHTML += `
            <button class="size-chip ${activeClass}" onclick="filterSize('${categoryName}', '${size}', this)">${size}</button>
        `;
    });
    
    // By default pehla size dikhana
    if(catObj.sizes.length > 0) {
        renderProducts(categoryName, catObj.sizes[0]);
    }
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
        container.innerHTML = `<p style="grid-column: 1/3; color:#666; text-align:center; padding:20px;">No items added in this size yet.</p>`;
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

// Search Function
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

// --- CART LOGIC ---
function updateCartQty(id, change) {
    let item = inventory.find(i => i.id === id);
    let cartItem = cart.find(c => c.id === id);
    
    if(cartItem) {
        cartItem.qty += change;
        if(cartItem.qty <= 0) {
            cart = cart.filter(c => c.id !== id);
        }
    } else if(change > 0) {
        cart.push({ id: item.id, title: item.title, size: item.size, price: item.price, qty: 1 });
    }
    
    // Cart badge update
    let totalItems = cart.reduce((acc, curr) => acc + curr.qty, 0);
    document.getElementById('cart-total-qty').innerText = totalItems;
    
    // Instant re-render
    let activeCat = document.getElementById('current-category-title').innerText;
    let activeSizeChip = document.querySelector('.size-chip.active-size');
    if(activeSizeChip && activeCat !== "Search Results") {
        renderProducts(activeCat, activeSizeChip.innerText);
    } else if(activeCat === "Search Results") {
        searchProducts();
    }
}

function renderCart() {
    let container = document.getElementById('cart-items-container');
    container.innerHTML = "";
    
    if(cart.length === 0) {
        container.innerHTML = "<p style='color:#666; text-align:center;'>Your cart is empty.</p>";
        return;
    }
    
    cart.forEach(item => {
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                <div>
                    <strong>${item.title} (Size: ${item.size})</strong>
                    <p style="color:#1a365d; font-weight:600;">₹${item.price} x ${item.qty}</p>
                </div>
                <div class="qty-control">
                    <button onclick="updateCartQty('${item.id}', -1); renderCart();">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateCartQty('${item.id}', 1); renderCart();">+</button>
                </div>
            </div>
        `;
    });
}

function confirmToReceipt() {
    if(cart.length === 0) { alert("Please add items to cart first!"); return; }
    switchPage('billing');
}

// --- PAGE 3: BILLING & INVOICE PREVIEW ---
function generateInvoicePreview() {
    let area = document.getElementById('invoice-print-area');
    let name = document.getElementById('cust-name').value || "Walk-in Customer";
    let phone = document.getElementById('cust-phone').value || "N/A";
    let dateStr = new Date().toLocaleDateString('en-IN');
    let timeStr = new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
    let invNo = "VB-" + Date.now().toString().slice(-6);
    
    let totalBill = cart.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    
    // Dynamic QR Generator Link (Exact payment amount triggers intent automatically)
    // Replace with your real UPI VPA id
    let upiID = "yourshopupi@okaxis"; 
    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${upiID}%26pn=Vbilling%26am=${totalBill}%26cu=INR`;

    let itemRows = "";
    cart.forEach(item => {
        itemRows += `
            <tr>
                <td style="padding:4px 0;">${item.title} (${item.size})</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">${item.price}.00</td>
                <td style="text-align:right;">${item.price * item.qty}.00</td>
            </tr>
        `;
    });

    area.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #1a365d; padding-bottom:5px; margin-bottom:5px;">
            <h2 style="margin:0; font-size:16px; color:#1a365d; font-weight:bold;">V billing</h2>
            <p style="font-size:10px; margin:2px 0; color:#555;">Chopra Kala Mau, Lucknow<br>School Uniform Specialist</p>
        </div>
        <table style="width:100%; font-size:10px; margin-bottom:8px;">
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
        <div style="border-top:1px solid #1a365d; padding-top:4px; text-align:right; font-weight:bold; font-size:12px; color:#1a365d;">
            GRAND TOTAL: ₹${totalBill}.00
        </div>
        <div style="text-align:center; margin-top:8px;">
            <img src="${totalBill > 0 ? qrUrl : ''}" style="width:100px; height:100px; border:1px solid #1a365d; padding:2px;" alt="Scan to Pay">
            <p style="font-size:8px; color:#555; margin-top:2px;">Scan via PhonePe, GPay, Paytm</p>
        </div>
        <div style="text-align:center; border-top:1px dashed #1a365d; padding-top:4px; margin-top:8px; font-weight:bold; font-size:10px; color:#1a365d;">
            THANK YOU FOR SHOPPING!
        </div>
    `;

    // History me temporary save karne ke liye attach kar rhe hain
    area.dataset.total = totalBill;
    area.dataset.name = name;
}

// Invoice Editing capability (bina paise ke item minus/plus karna)
function enableInvoiceEdit() {
    switchPage('cart');
    alert("You can add, remove, or modify items here instantly.");
}

function printThermalBill() {
    // History me log entry create karein print dabane par
    saveToHistoryLog(document.getElementById('invoice-print-area').dataset.name, document.getElementById('invoice-print-area').dataset.total, "Online/Cash");
    
    // Inventory pieces minus logic
    cart.forEach(c => {
        let invItem = inventory.find(i => i.id === c.id);
        if(invItem) { invItem.stock = Math.max(0, invItem.stock - c.qty); }
    });
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));
    
    window.print();
    cart = []; // Reset cart
    document.getElementById('cart-total-qty').innerText = "0";
}

function shareOnWhatsApp() {
    let phone = document.getElementById('cust-phone').value;
    let total = document.getElementById('invoice-print-area').dataset.total;
    if(!phone) { alert("Please input Customer Mobile Number first!"); return; }
    
    let text = `Hello, Thank you for shopping at V billing. Your total bill amount is ₹${total}.00.`;
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`);
}

// --- PAGE 4: ADD STOCK ENTRY LOGIC ---
function previewImage(event) {
    let reader = new FileReader();
    reader.onload = function() {
        uploadedImageBase64 = reader.result;
        let container = document.getElementById('image-preview-container');
        container.innerHTML = `<img src="${uploadedImageBase64}">`;
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

    let newItem = {
        id: "ITEM-" + Date.now(),
        title: title,
        category: category,
        size: size,
        price: Number(price),
        stock: Number(qty),
        description: desc,
        image: uploadedImageBase64 || "https://via.placeholder.com/150?text=Uniform"
    };

    inventory.push(newItem);
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));
    
    alert("Product saved to stock layout successfully!");
    
    // Form Reset
    document.getElementById('stock-title').value = "";
    document.getElementById('stock-size').value = "";
    document.getElementById('stock-price').value = "";
    document.getElementById('stock-qty').value = "";
    document.getElementById('stock-desc').value = "";
    document.getElementById('image-preview-container').innerHTML = "";
    uploadedImageBase64 = "";
}

// --- PAGE 5: HISTORY MANAGEMENT (6 MONTH LOGS) ---
function saveToHistoryLog(name, total, mode) {
    if(!total || total == 0) return;
    let log = {
        id: "LOG-" + Date.now(),
        name: name,
        total: total,
        mode: window.confirm("Click OK for ONLINE payment, CANCEL for CASH payment.") ? "Online" : "Cash",
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('en-IN')
    };
    historyLogs.unshift(log);
    localStorage.setItem('vb_history', JSON.stringify(historyLogs));
    renderHistory();
}

function renderHistory() {
    let tbody = document.getElementById('history-table-body');
    if(!tbody) return;
    tbody.innerHTML = "";
    
    historyLogs.forEach(log => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${log.name}</strong></td>
                <td>₹${log.total}</td>
                <td><span style="color:${log.mode === 'Online' ? '#2e7d32':'#c62828'}">${log.mode}</span></td>
                <td style="font-size:10px;">${log.dateStr}</td>
            </tr>
        `;
    });
}

function cleanOldHistory() {
    let sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    historyLogs = historyLogs.filter(log => log.timestamp > sixMonthsAgo);
    localStorage.setItem('vb_history', JSON.stringify(historyLogs));
}

// --- PAGE 6: DIGITAL LEDGER CALCULATOR ---
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
    let tbody = document.getElementById('ledger-rows');
    tbody.innerHTML = "";
    let grandTotal = 0;

    ledgerItems.forEach((row, index) => {
        grandTotal += row.total;
        tbody.innerHTML += `
            <tr>
                <td>${row.item}</td>
                <td>${row.qty}</td>
                <td>₹${row.price}</td>
                <td>₹${row.total}</td>
                <td><button onclick="removeLedgerRow(${index})" style="background:none; border:none; color:red; cursor:pointer;"><i class="fa fa-trash"></i></button></td>
            </tr>
        `;
    });

    document.getElementById('ledger-grand-total').innerText = grandTotal;
}

function removeLedgerRow(index) {
    ledgerItems.splice(index, 1);
    renderLedgerTable();
}

function printCalculatorBill() {
    if(ledgerItems.length === 0) { alert("Ledger calculator list is empty!"); return; }
    let grandTotal = document.getElementById('ledger-grand-total').innerText;
    
    // Quick ledger bill alert sequence
    saveToHistoryLog("Quick Calc Customer", grandTotal, "Cash/Online");
    window.print();
    ledgerItems = [];
    renderLedgerTable();
}
