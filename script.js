// --- V BILLING CORE ENGINE v2.1 ---

let MASTER_PASSWORD = "1234"; // Aapka password sequence

// Icons ko bina file jhanjhat ke solid FontAwesome tags par map kar diya hai takki dabba na dikhe
let categoriesData = JSON.parse(localStorage.getItem('vb_categories')) || [
    { name: "Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Pant", icon: "fa-user-ninja", sizes: ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Tunic", icon: "fa-person-dress", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { name: "Ricon Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tousure Pant", icon: "fa-user-ninja", sizes: ["32", "34", "36", "38", "40", "42", "W28", "W30", "W32", "W34"] },
    { name: "Skirt", icon: "fa-person-dress", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36"] },
    { name: "RPS Shirt", icon: "fa-shirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Pant", icon: "fa-user-ninja", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Skirt", icon: "fa-person-dress", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS Lower", icon: "fa-socks", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "RPS T-shirt", icon: "fa-tshirt", sizes: ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"] },
    { name: "Tie", icon: "fa-black-tie", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Belt", icon: "fa-hard-drive", sizes: ["Normal", "RPS School", "Other"] },
    { name: "Bag", icon: "fa-bag-shopping", sizes: ["200-250", "250-300", "300-350", "350-400", "400-500", "500-550", "550-600"] }
];

let inventory = JSON.parse(localStorage.getItem('vb_inventory')) || [];
let cart = [];
let historyLogs = JSON.parse(localStorage.getItem('vb_history')) || [];
let tempCatIconBase64 = "";
let tempEditProdBase64 = "";
let uploadedImageBase64 = "";

let basicNamesList = ["Nitish Kumar", "Amit Singh", "Rajesh Maurya", "Raju Jaiswal", "Vijay Yadav", "Vikram Verma", "Suresh Maurya", "Sunil Maurya", "Anil Kumar", "Sanjay Singh"];

window.onload = function() {
    renderCategories();
    populateCategoryDropdowns();
    cleanOldHistory();
    resetHistoryFilter();
    populateStockPanelDetails();
    populateStockSizeSelector();
};

// --- SECURITY PROTOCOL ---
function checkPassword() {
    let input = document.getElementById('master-password').value;
    if(input === MASTER_PASSWORD) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
    } else {
        document.getElementById('login-error').innerText = "Galat Password Hai! Try again.";
    }
}

// --- NAV MANAGER ---
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

// --- PAGE 1: CATEGORIES LOADER ---
function renderCategories() {
    let container = document.getElementById('categories-container');
    if(!container) return; container.innerHTML = "";
    
    categoriesData.forEach(cat => {
        let iconHtml = cat.icon.startsWith("data:image") 
            ? `<img src="${cat.icon}" style="width:40px; height:40px; object-fit:contain; margin-bottom:8px;">` 
            : `<i class="fa ${cat.icon}" style="font-size:26px; display:block; margin-bottom:8px; color:var(--primary-blue);"></i>`;
            
        container.innerHTML += `
            <div class="category-card" onclick="openCategory('${cat.name}')">
                ${iconHtml}
                <span>${cat.name}</span>
            </div>
        `;
    });
    container.innerHTML += `
        <div class="category-card add-btn" onclick="openCategoryModal()">
            <i class="fa fa-plus-circle" style="font-size:24px; display:block; margin-bottom:8px; color:var(--primary-blue);"></i>
            <strong>Add Layout</strong>
        </div>
    `;
}

function openCategoryModal() { document.getElementById('category-modal').classList.remove('hidden'); }
function closeCategoryModal() { document.getElementById('category-modal').classList.add('hidden'); }

function previewCatIcon(event) {
    let reader = new FileReader();
    reader.onload = function() {
        tempCatIconBase64 = reader.result;
        document.getElementById('cat-icon-preview').innerHTML = `<img src="${tempCatIconBase64}">`;
    };
    reader.readAsDataURL(event.target.files[0]);
}

function saveNewCategory() {
    let name = document.getElementById('new-cat-name').value.trim();
    let sizesRaw = document.getElementById('new-cat-sizes').value.trim();
    if(!name) { alert("Enter category title!"); return; }
    let sizeArr = sizesRaw ? sizesRaw.split(',').map(s => s.trim()) : ["Standard"];
    let finalIcon = tempCatIconBase64 || "fa-box"; 
    
    categoriesData.push({ name, icon: finalIcon, sizes: sizeArr });
    localStorage.setItem('vb_categories', JSON.stringify(categoriesData));
    alert("New Category Layout Set!");
    
    document.getElementById('new-cat-name').value = ""; document.getElementById('new-cat-sizes').value = ""; document.getElementById('cat-icon-preview').innerHTML = ""; tempCatIconBase64 = "";
    closeCategoryModal(); renderCategories(); populateCategoryDropdowns();
}

function openCategory(categoryName) {
    document.getElementById('categories-container').classList.add('hidden');
    let view = document.getElementById('product-view'); view.classList.remove('hidden');
    document.getElementById('current-category-title').innerText = categoryName;
    let catObj = categoriesData.find(c => c.name === categoryName);
    let sizeContainer = document.getElementById('size-filters-container'); sizeContainer.innerHTML = "";
    catObj.sizes.forEach((size, idx) => {
        let activeClass = idx === 0 ? 'active-size' : '';
        sizeContainer.innerHTML += `<button class="size-chip ${activeClass}" onclick="filterSize('${categoryName}', '${size}', this)">${size}</button>`;
    });
    if(catObj.sizes.length > 0) { renderProducts(categoryName, catObj.sizes[0]); }
}

function showCategories() { document.getElementById('product-view').classList.add('hidden'); document.getElementById('categories-container').classList.remove('hidden'); }
function filterSize(category, size, btnElement) {
    document.querySelectorAll('.size-chip').forEach(chip => chip.classList.remove('active-size'));
    btnElement.classList.add('active-size');
    renderProducts(category, size);
}

function renderProducts(category, size) {
    let container = document.getElementById('products-list-container');
    container.innerHTML = "";
    let filtered = inventory.filter(item => item.category === category && item.size === size);
    if(filtered.length === 0) { container.innerHTML = `<p style="grid-column: 1/3; color:#666; text-align:center; padding:20px;">No items added in this size bracket.</p>`; return; }
    
    filtered.forEach(item => {
        let cartItem = cart.find(c => c.id === item.id);
        let currentQty = cartItem ? cartItem.qty : 0;
        let stockStatusHtml = "";
        
        if(item.stock <= 0) {
            stockStatusHtml = `<span class="stock-badge stock-warning">Out Of Stock</span><br>
                               <button class="btn-update-stock-inline" onclick="promptRefillStock('${item.id}')">RefillPieces</button>`;
        } else if(item.stock <= 3) {
            stockStatusHtml = `<span class="stock-badge stock-warning">Only ${item.stock} left!</span>`;
        } else {
            stockStatusHtml = `<span class="stock-badge" style="color:#666;">Stock: ${item.stock}</span>`;
        }
        
        container.innerHTML += `
            <div class="product-card">
                <div class="three-dots-menu" onclick="toggleDropdown('${item.id}')"><i class="fa fa-ellipsis-v"></i></div>
                <div id="dropdown-${item.id}" class="three-dots-dropdown hidden">
                    <button onclick="triggerProductEdit('${item.id}')"><i class="fa fa-pencil"></i> Edit Details</button>
                    <button onclick="removeProductPhoto('${item.id}')"><i class="fa fa-image"></i> Delete Photo</button>
                    <button onclick="deleteProductComplete('${item.id}')" style="color:red;"><i class="fa fa-trash"></i> Delete All</button>
                </div>

                <img src="${item.image || 'https://via.placeholder.com/150?text=No+Photo'}" alt="Product">
                <h4>${item.title}</h4>
                <p class="price">₹${item.price}</p>
                <p style="margin-bottom:6px;">${stockStatusHtml}</p>
                <div class="qty-control">
                    <button onclick="instantUpdateQty('${item.id}', -1)">-</button>
                    <span id="card-qty-${item.id}">${currentQty}</span>
                    <button onclick="instantUpdateQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function promptRefillStock(id) {
    let pieces = prompt("Enter pieces count to add:");
    if(!pieces || pieces.trim() == "" || isNaN(pieces)) return;
    let item = inventory.find(i => i.id === id);
    if(item) {
        item.stock += Number(pieces);
        localStorage.setItem('vb_inventory', JSON.stringify(inventory));
        populateStockPanelDetails();
        let activeCat = document.getElementById('current-category-title').innerText;
        let activeSize = document.querySelector('.size-chip.active-size')?.innerText;
        if(activeSize) renderProducts(activeCat, activeSize);
    }
}

function toggleDropdown(id) {
    let drop = document.getElementById(`dropdown-${id}`);
    let state = drop.classList.contains('hidden');
    document.querySelectorAll('.three-dots-dropdown').forEach(d => d.classList.add('hidden'));
    if(state) drop.classList.remove('hidden');
    event.stopPropagation();
}
document.addEventListener('click', () => document.querySelectorAll('.three-dots-dropdown').forEach(d => d.classList.add('hidden')));

function removeProductPhoto(id) {
    if(confirm("Delete only this item photo?")) {
        let item = inventory.find(i => i.id === id);
        if(item) { item.image = ""; localStorage.setItem('vb_inventory', JSON.stringify(inventory)); }
        closeAllAfterAction();
    }
}
function deleteProductComplete(id) {
    if(confirm("DELETE COMPLETE product container?")) {
        inventory = inventory.filter(i => i.id !== id);
        localStorage.setItem('vb_inventory', JSON.stringify(inventory));
        populateStockPanelDetails();
        closeAllAfterAction();
    }
}
function triggerProductEdit(id) {
    let item = inventory.find(i => i.id === id);
    if(!item) return;
    tempEditProdBase64 = item.image;
    document.getElementById('edit-prod-id').value = item.id;
    document.getElementById('edit-prod-title').value = item.title;
    document.getElementById('edit-prod-price').value = item.price;
    document.getElementById('edit-prod-stock').value = item.stock;
    document.getElementById('edit-prod-size').value = item.size;
    document.getElementById('edit-prod-image-preview').innerHTML = item.image ? `<img src="${item.image}">` : "";
    document.getElementById('edit-product-modal').classList.remove('hidden');
}
function previewEditProdImage(event) {
    let reader = new FileReader(); reader.onload = function() { tempEditProdBase64 = reader.result; document.getElementById('edit-prod-image-preview').innerHTML = `<img src="${tempEditProdBase64}">`; }; reader.readAsDataURL(event.target.files[0]);
}
function closeEditProductModal() { document.getElementById('edit-product-modal').classList.add('hidden'); }
function saveEditedProduct() {
    let id = document.getElementById('edit-prod-id').value;
    let title = document.getElementById('edit-prod-title').value.trim();
    let price = Number(document.getElementById('edit-prod-price').value);
    let stock = Number(document.getElementById('edit-prod-stock').value);
    if(!title || price < 0 || stock < 0) { alert("Data inputs incorrect!"); return; }
    
    let item = inventory.find(i => i.id === id);
    if(item) {
        item.title = title; item.price = price; item.stock = stock; item.image = tempEditProdBase64;
        localStorage.setItem('vb_inventory', JSON.stringify(inventory));
        closeEditProductModal(); populateStockPanelDetails(); closeAllAfterAction();
    }
}
function closeAllAfterAction() {
    let activeCat = document.getElementById('current-category-title').innerText;
    let activeSize = document.querySelector('.size-chip.active-size')?.innerText;
    if(activeSize && activeCat !== "Search Results") renderProducts(activeCat, activeSize);
    if(activeCat === "Search Results") searchProducts();
}

function searchProducts() {
    let q = document.getElementById('search-input').value.toLowerCase();
    if(!q) { showCategories(); return; }
    document.getElementById('categories-container').classList.add('hidden');
    let view = document.getElementById('product-view'); view.classList.remove('hidden');
    document.getElementById('current-category-title').innerText = "Search Results";
    document.getElementById('size-filters-container').innerHTML = "";
    
    let container = document.getElementById('products-list-container'); container.innerHTML = "";
    let filtered = inventory.filter(item => item.title.toLowerCase().includes(q));
    filtered.forEach(item => {
        let cartItem = cart.find(c => c.id === item.id);
        container.innerHTML += `
            <div class="product-card">
                <img src="${item.image || 'https://via.placeholder.com/150?text=No+Photo'}" alt="Product">
                <h4>${item.title} (${item.size})</h4>
                <p class="price">₹${item.price}</p>
                <div class="qty-control">
                    <button onclick="instantUpdateQty('${item.id}', -1)">-</button>
                    <span id="card-qty-${item.id}">${cartItem ? cartItem.qty : 0}</span>
                    <button onclick="instantUpdateQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function instantUpdateQty(id, change) {
    let item = inventory.find(i => i.id === id); if(!item) return;
    let cartItem = cart.find(c => c.id === id);
    let curQty = cartItem ? cartItem.qty : 0;
    
    if(change > 0 && curQty >= item.stock) { alert("Maximum Available Stock Reached!"); return; }
    updateCartQty(id, change);
    
    let updatedCartItem = cart.find(c => c.id === id);
    let newQtyDisplay = updatedCartItem ? updatedCartItem.qty : 0;
    
    let qtyDisplaySpan = document.getElementById(`card-qty-${id}`);
    if(qtyDisplaySpan) qtyDisplaySpan.innerText = newQtyDisplay;
}

function updateCartQty(id, change) {
    let item = inventory.find(i => i.id === id); if(!item) return;
    let cartItem = cart.find(c => c.id === id);
    if(cartItem) {
        cartItem.qty += change;
        if(cartItem.qty <= 0) cart = cart.filter(c => c.id !== id);
    } else if(change > 0) {
        cart.push({ id: item.id, title: item.title, size: item.size, price: item.price, qty: 1, isCustom: false });
    }
    document.getElementById('cart-total-qty').innerText = cart.reduce((a, c) => a + c.qty, 0);
}

function addCustomItemToCart() {
    let name = document.getElementById('extra-name').value.trim();
    let price = Number(document.getElementById('extra-price').value);
    let qty = Number(document.getElementById('extra-qty').value) || 1;
    if(!name || !price) { alert("Complete details first!"); return; }
    
    cart.push({ id: "CUSTOM-"+Date.now(), title: name, size: "Extra Item", price: price, qty: qty, isCustom: true });
    
    document.getElementById('extra-name').value = ""; document.getElementById('extra-price').value = ""; document.getElementById('extra-qty').value = "1";
    document.getElementById('cart-total-qty').innerText = cart.reduce((a, c) => a + c.qty, 0);
    renderCart();
}

function renderCart() {
    let container = document.getElementById('cart-items-container');
    if(!container) return; container.innerHTML = "";
    if(cart.length === 0) { container.innerHTML = "<p style='color:#666; text-align:center;'>Cart details are empty.</p>"; return; }
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
function increaseCartItem(id) { let cartItem = cart.find(c => c.id === id); if(cartItem?.isCustom) { cartItem.qty++; } else { instantUpdateQty(id, 1); } renderCart(); }
function removeOrDecreaseCartItem(id) { let cartItem = cart.find(c => c.id === id); if(cartItem?.isCustom) { cartItem.qty--; if(cartItem.qty <= 0) cart = cart.filter(c => c.id !== id); } else { instantUpdateQty(id, -1); } renderCart(); }
function confirmToReceipt() { if(cart.length === 0) { alert("Card is empty!"); return; } switchPage('billing'); }

// --- PAGE 3: BILLING CORES ---
function updateInvoicePreview() {
    let area = document.getElementById('invoice-print-area');
    if(!area) return;
    let name = document.getElementById('cust-name').value.trim() || "Walk-in Customer";
    let phone = document.getElementById('cust-phone').value.trim() || "N/A";
    let dateStr = new Date().toLocaleDateString('en-IN');
    let invNo = "VB-"+Date.now().toString().slice(-6);
    
    let totalBill = cart.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    let selectedMode = document.querySelector('input[name="bill-payment-mode"]:checked').value;
    let upiID = "yourshopupi@okaxis"; 
    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${upiID}%26pn=Vbilling%26am=${totalBill}%26cu=INR`;

    let itemRows = ""; cart.forEach(item => { itemRows += `<tr><td style="padding:4px 0;">${item.title} (${item.size})</td><td style="text-align:center;">${item.qty}</td><td style="text-align:right;">${item.price}.00</td><td style="text-align:right;">${item.price * item.qty}.00</td></tr>`; });

    area.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #1a365d; padding-bottom:5px; margin-bottom:5px;">
            <h2 style="margin:0; font-size:16px; color:#1a365d; font-weight:bold;">V billing</h2>
            <p style="font-size:10px; margin:2px 0; color:#555;">Chopra Kala Mau, Lucknow<br>School Uniform Specialist</p>
        </div>
        <table style="width:100%; font-size:10px; margin-bottom:5px;">
            <tr><td><strong>Cust:</strong> ${name}</td><td style="text-align:right;"><strong>Date:</strong> ${dateStr}</td></tr><tr><td><strong>Mob:</strong> ${phone}</td><td style="text-align:right;"><strong>Inv:</strong> ${invNo}</td></tr>
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
            <div style="width:100px; height:100px; border:1px solid #1a365d; margin:0 auto; padding:2px; background:white;">
                <img src="${totalBill > 0 ? qrUrl : ''}" style="width:100%; height:100%;" alt="QR">
            </div>
            <p style="font-size:8px; color:#555; margin-top:2px;">Scan via PhonePe, GPay, Paytm</p>
        </div>
        <div style="text-align:center; border-top:1px dashed #1a365d; padding-top:4px; margin-top:8px; font-weight:bold; font-size:9px; color:#c62828;">GOODS SOLD WILL NOT BE RETURNED</div>
    `;
    area.dataset.total = totalBill; area.dataset.name = name; area.dataset.phone = phone;
}

function shareInvoiceAsImage() {
    let billElement = document.getElementById('invoice-print-area');
    let phone = document.getElementById('cust-phone').value.trim();
    if(!billElement || cart.length == 0 || !phone) { alert("Info missing!"); return; }
    
    html2canvas(billElement, { scale: 3 }).then(canvas => {
        canvas.toBlob(blob => {
            let item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
                alert("Bill Photo copied! Paste on WhatsApp chat.");
                window.open(`https://api.whatsapp.com/send?phone=91${phone}`);
            }).catch(err => alert("Clipboard triggers blocked."));
        });
    });
}

function enableInvoiceEdit() { switchPage('cart'); }
function cancelCurrentBill() {
    if(confirm("Discard current bill layout entirely?")) {
        cart = []; document.getElementById('cart-total-qty').innerText = "0"; document.getElementById('cust-name').value = ""; document.getElementById('cust-phone').value = ""; switchPage('home');
    }
}
function printThermalBill() {
    let total = document.getElementById('invoice-print-area').dataset.total;
    let name = document.getElementById('invoice-print-area').dataset.name;
    let selectedMode = document.querySelector('input[name="bill-payment-mode"]:checked').value;
    if(!total || total == 0) return;
    
    cart.forEach(c => {
        if(!c.isCustom) {
            let invItem = inventory.find(i => i.id === c.id);
            if(invItem) invItem.stock = Math.max(0, invItem.stock - c.qty);
        }
    });
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));

    let log = { id: "LOG-"+Date.now(), name, total, mode: selectedMode, timestamp: Date.now(), dateStr: new Date().toLocaleDateString('en-IN') };
    historyLogs.unshift(log); localStorage.setItem('vb_history', JSON.stringify(historyLogs));
    showNameSuggestions(); resetHistoryFilter(); 
    window.print();
    cart = []; document.getElementById('cart-total-qty').innerText = "0"; document.getElementById('cust-name').value = ""; document.getElementById('cust-phone').value = "";
}

// --- NAME AUTOCOMPLETE DROP-DOWN SYSTEM ---
function showNameSuggestions() {
    let input = document.getElementById('cust-name');
    let q = input.value.trim().toLowerCase();
    let box = document.getElementById('suggestion-box');
    if(!q) { box.classList.add('hidden'); return; }
    
    let uniqueLogsNames = [...new Set(historyLogs.map(log => log.name))];
    let completeDictionary = [...new Set([...basicNamesList, ...uniqueLogsNames])];
    let filtered = completeDictionary.filter(name => name?.toLowerCase().startsWith(q)).slice(0, 5);
    
    if(filtered.length > 0) {
        box.innerHTML = "";
        filtered.forEach(name => {
            let item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerText = name;
            item.onclick = function() {
                document.getElementById('cust-name').value = name;
                document.getElementById('suggestion-box').classList.add('hidden');
            };
            box.appendChild(item);
        });
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
}
document.addEventListener('click', () => document.getElementById('suggestion-box')?.classList.add('hidden'));

// --- STOCK PAGE 3 BLOCKS ---
function previewImage(event) {
    let reader = new FileReader(); reader.onload = function() { uploadedImageBase64 = reader.result; document.getElementById('image-preview-container').innerHTML = `<img src="${uploadedImageBase64}">`; }; reader.readAsDataURL(event.target.files[0]);
}
function saveNewStock() {
    let title = document.getElementById('stock-title').value.trim();
    let category = document.getElementById('stock-category').value;
    let size = document.getElementById('stock-size-dropdown').value;
    let price = document.getElementById('stock-price').value;
    let qty = document.getElementById('stock-qty').value;
    let desc = document.getElementById('stock-desc').value.trim();
    if(!title || !price || !qty) { alert("Please complete details!"); return; }

    inventory.push({ id: "ITEM-"+Date.now(), title, category, size, price: Number(price), stock: Number(qty), description: desc, image: uploadedImageBase64 || "" });
    localStorage.setItem('vb_inventory', JSON.stringify(inventory));
    alert("Maal chadh gaya successfully!");
    
    document.getElementById('stock-title').value = ""; document.getElementById('image-preview-container').innerHTML = ""; uploadedImageBase64 = "";
    populateStockPanelDetails(); 
}
function populateStockPanelDetails() {
    let allBody = document.getElementById('block-all-stocks-body');
    let outBody = document.getElementById('block-out-stocks-body');
    if(!allBody || !outBody) return;
    
    allBody.innerHTML = ""; outBody.innerHTML = "";
    inventory.forEach(item => {
        let stockColor = item.stock <= 3 ? 'red':'var(--success-green)';
        allBody.innerHTML += `<tr><td><strong>${item.title}</strong><br><span style="font-size:10px; color:#666;">${item.category}</span></td><td>${item.size}</td><td>₹${item.price}</td><td style="color:${stockColor}; font-weight:bold;">${item.stock} pieces</td></tr>`;
        
        if(item.stock === 0) {
            outBody.innerHTML += `<tr><td><strong>${item.title}</strong><br><span style="font-size:10px; color:#666;">${item.category}</span></td><td>${item.size}</td><td style="color:red; font-weight:bold;">Out Stock</td><td><button class="btn-update-stock-inline" onclick="promptRefillStock('${item.id}')">Refill</button></td></tr>`;
        }
    });
    if(outBody.innerHTML === "") {
        outBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:10px; color:green; font-weight:500;">No out-of-stock items available right now! Super.</td></tr>`;
    }
}
function switchStockView(targetView) {
    document.querySelectorAll('.stock-sub-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`stock-view-${targetView}`).classList.remove('hidden');
}

function populateCategoryDropdowns() {
    let dropdown = document.getElementById('stock-category'); if(!dropdown) return; dropdown.innerHTML = "";
    categoriesData.forEach(cat => { dropdown.innerHTML += `<option value="${cat.name}">${cat.name}</option>`; });
    populateStockSizeSelector(); 
}
function populateStockSizeSelector() {
    let cat = document.getElementById('stock-category').value;
    let sizeDrop = document.getElementById('stock-size-dropdown'); if(!sizeDrop || !cat) return; sizeDrop.innerHTML = "";
    let match = categoriesData.find(c => c.name === cat);
    if(match) { match.sizes.forEach(s => { sizeDrop.innerHTML += `<option value="${s}">${s}</option>`; }); }
}
document.getElementById('stock-category')?.addEventListener('change', populateStockSizeSelector);

// --- HISTORY SECTION ---
function renderHistory(data = historyLogs) {
    let tbody = document.getElementById('history-table-body'); if(!tbody) return; tbody.innerHTML = "";
    data.forEach(log => {
        let modeColor = log.mode === 'Online' ? 'var(--purple-online)' : 'var(--success-green)';
        tbody.innerHTML += `<tr><td><strong>${log.name}</strong></td><td>₹${log.total}</td><td><span style="color:${modeColor}; font-weight:bold;">${log.mode}</span></td><td style="font-size:10px;">${log.dateStr}</td></tr>`;
    });
}
function filterHistoryByDay(day) {
    let todayStr = new Date().toLocaleDateString('en-IN');
    let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayStr = yesterday.toLocaleDateString('en-IN');
    let target = day === 'today' ? todayStr : yesterdayStr;
    renderHistory(historyLogs.filter(log => log.dateStr === target));
}
function filterHistoryByCustomDate() {
    let val = document.getElementById('history-custom-date').value; if(!val) return;
    let selectedStr = new Date(val).toLocaleDateString('en-IN');
    renderHistory(historyLogs.filter(log => log.dateStr === selectedStr));
}
function resetHistoryFilter() { document.getElementById('history-custom-date').value = ""; renderHistory(historyLogs); }
function cleanOldHistory() {
    let sixMoAgo = Date.now() - (6*30*24*60*60*1000);
    historyLogs = historyLogs.filter(log => log.timestamp > sixMoAgo); localStorage.setItem('vb_history', JSON.stringify(historyLogs));
}

// --- CALCULATOR SECTION ---
let ledgerItems = [];
function addLedgerRow() {
    let item = document.getElementById('calc-item-name').value.trim() || "Regular Item";
    let price = Number(document.getElementById('calc-item-price').value);
    let qty = Number(document.getElementById('calc-item-qty').value) || 1;
    if(!price || price < 0) { alert("Enter valid price details!"); return; }
    ledgerItems.push({ item, qty, price, total: price * qty });
    renderLedgerTable();
    document.getElementById('calc-item-name').value = ""; document.getElementById('calc-item-price').value = ""; document.getElementById('calc-item-qty').value = "1";
}
function renderLedgerTable() {
    let container = document.getElementById('calculator-bill-area'); if(!container) return;
    let grand = ledgerItems.reduce((a, c) => a + c.total, 0);
    let dateStr = new Date().toLocaleDateString('en-IN');
    let selectedMode = document.querySelector('input[name="calc-payment-mode"]:checked').value;

    let rowsHtml = ""; ledgerItems.forEach((row, idx) => { rowsHtml += `<tr><td>${row.item}</td><td style="text-align:center;">${row.qty}</td><td style="text-align:right;">₹${row.price}.00</td><td style="text-align:right;">₹${row.total}.00</td><td class="no-print" style="text-align:center;"><button onclick="removeLedgerRow(${idx})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa fa-trash"></i></button></td></tr>`; });

    container.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #333; padding-bottom:5px; margin-bottom:5px;">
            <h3 style="margin:0;">V billing (Digital Ledger)</h3>
            <p style="font-size:10px; margin:0;">Date: ${dateStr}</p>
        </div>
        <table id="ledger-table" style="width:100%; font-size:12px;">
            <thead><tr style="border-bottom:1px solid #333;"><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th><th class="no-print" style="text-align:center;">Action</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:4px; border-top:1px solid #333; font-weight:bold;">
            <span style="color:green;">MODE: ${selectedMode.toUpperCase()}</span>
            <span>Total: ₹${grand}.00</span>
        </div>
        <div style="text-align:center; border-top:1px dashed #333; padding-top:5px; margin-top:8px; font-weight:bold; font-size:10px; color:#c62828;">GOODS SOLD WILL NOT BE RETURNED</div>
    `;
    container.dataset.total = grand;
}
function removeLedgerRow(index) { ledgerItems.splice(index, 1); renderLedgerTable(); }
function printCalculatorBill() {
    let grand = Number(document.getElementById('calculator-bill-area').dataset.total);
    if(ledgerItems.length === 0 || grand == 0) { alert("List is empty!"); return; }
    let selectedMode = document.querySelector('input[name="calc-payment-mode"]:checked').value;
    
    let log = { id: "LOG-"+Date.now(), name: "Quick Calc Customer", total: grand, mode: selectedMode, timestamp: Date.now(), dateStr: new Date().toLocaleDateString('en-IN') };
    historyLogs.unshift(log); localStorage.setItem('vb_history', JSON.stringify(historyLogs));
    showNameSuggestions(); window.print();
    ledgerItems = []; renderLedgerTable();
}

function shareCalculatorAsImage() {
    let billEl = document.getElementById('calculator-bill-area');
    let grand = Number(billEl.dataset.total);
    if(!billEl || ledgerItems.length == 0 || grand == 0) { alert("List missing!"); return; }
    let phone = prompt("Enter customer WhatsApp number (10 digit):");
    if(!phone || isNaN(phone) || phone.trim().length !== 10) { alert("Enter valid 10-digit number!"); return; }

    html2canvas(billEl, { scale: 3 }).then(canvas => {
        canvas.toBlob(blob => {
            let item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
                alert("Ledger bill PNG Image copied! Open WhatsApp chat and press Ctrl+V to paste.");
                window.open(`https://api.whatsapp.com/send?phone=91${phone}`);
            }).catch(err => alert("Triggers blocked."));
        });
    });
}
