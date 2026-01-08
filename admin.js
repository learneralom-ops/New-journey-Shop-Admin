// Admin Panel Fixed Version
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

let adminLoggedIn = false;
let adminProducts = [];
let adminOrders = [];
let adminUsers = [];
let adminCategories = [];

// DOM Elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogout');
const adminSections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize Admin
function initAdminPanel() {
    console.log("Admin panel initializing...");
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        adminLoggedIn = true;
        showAdminDashboard();
    }
    
    setupAdminEventListeners();
    loadCategories();
}

// Show Admin Dashboard
function showAdminDashboard() {
    console.log("Showing admin dashboard...");
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'flex';
    loadAdminData();
}

// Load All Admin Data
function loadAdminData() {
    console.log("Loading admin data...");
    loadProducts();
    loadOrders();
    loadUsers();
    updateDashboardStats();
}

// Load Products
function loadProducts() {
    console.log("Loading products...");
    database.ref('products').on('value', (snapshot) => {
        adminProducts = [];
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            product.firebaseId = childSnapshot.key;
            adminProducts.push(product);
        });
        console.log("Products loaded:", adminProducts.length);
        displayProductsTable();
        updateDashboardStats();
    });
}

// Load Orders
function loadOrders() {
    console.log("Loading orders...");
    database.ref('orders').on('value', (snapshot) => {
        adminOrders = [];
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            order.firebaseId = childSnapshot.key;
            adminOrders.push(order);
        });
        console.log("Orders loaded:", adminOrders.length);
        displayOrdersTable();
        updateDashboardStats();
    });
}

// Load Users
function loadUsers() {
    console.log("Loading users...");
    database.ref('users').on('value', (snapshot) => {
        adminUsers = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            user.firebaseId = childSnapshot.key;
            adminUsers.push(user);
        });
        console.log("Users loaded:", adminUsers.length);
        displayUsersTable();
        updateDashboardStats();
    });
}

// Load Categories
function loadCategories() {
    database.ref('categories').on('value', (snapshot) => {
        adminCategories = [];
        snapshot.forEach((childSnapshot) => {
            const category = childSnapshot.val();
            category.firebaseId = childSnapshot.key;
            adminCategories.push(category);
        });
        console.log("Categories loaded:", adminCategories.length);
        displayCategories();
    });
}

// Display Products in Table
function displayProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    adminProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id || product.firebaseId}</td>
            <td class="product-image-cell">
                <img src="${product.image || 'https://via.placeholder.com/50x50?text=No+Image'}" 
                     alt="${product.name}"
                     width="50" height="50">
            </td>
            <td>${product.name || 'N/A'}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>৳ ${(product.price || 0).toLocaleString()}</td>
            <td>${product.stock || 0}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${product.firebaseId || product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${product.firebaseId || product.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display Orders in Table
function displayOrdersTable(status = 'all') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filteredOrders = adminOrders;
    if (status !== 'all') {
        filteredOrders = adminOrders.filter(order => order.status === status);
    }
    
    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId || order.firebaseId}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${order.items ? order.items.length : 0} items</td>
            <td>৳ ${(order.total || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>${formatDate(order.date)}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrderDetails('${order.firebaseId}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${order.status === 'pending' ? `
                    <button class="action-btn edit-btn" onclick="updateOrderStatus('${order.firebaseId}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn delete-btn" onclick="updateOrderStatus('${order.firebaseId}', 'cancelled')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display Users in Table
function displayUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    adminUsers.forEach(user => {
        const userOrders = adminOrders.filter(order => order.userId === user.firebaseId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.firebaseId ? user.firebaseId.substring(0, 8) + '...' : 'N/A'}</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${userOrders.length}</td>
            <td>${formatDate(user.createdAt)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Display Categories
function displayCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    adminCategories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-icon">
                <i class="${category.icon || 'fas fa-folder'}"></i>
            </div>
            <h3 class="category-name">${category.name || 'N/A'}</h3>
            <p class="category-count">${category.count || 0} Products</p>
            <div class="category-actions">
                <button class="action-btn edit-btn" onclick="editCategory('${category.firebaseId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteCategory('${category.firebaseId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        grid.appendChild(categoryCard);
    });
}

// Update Dashboard Statistics
function updateDashboardStats() {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalUsers = document.getElementById('totalUsers');
    const totalRevenue = document.getElementById('totalRevenue');
    
    if (totalProducts) totalProducts.textContent = adminProducts.length;
    if (totalOrders) totalOrders.textContent = adminOrders.length;
    if (totalUsers) totalUsers.textContent = adminUsers.length;
    
    const revenue = adminOrders
        .filter(order => order.status === 'approved')
        .reduce((sum, order) => sum + (order.total || 0), 0);
    
    if (totalRevenue) totalRevenue.textContent = `৳ ${revenue.toLocaleString()}`;
}

// Product Management
function addNewProduct() {
    document.getElementById('modalProductTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productFormModal').classList.add('active');
}

function editProduct(productId) {
    const product = adminProducts.find(p => p.firebaseId === productId || p.id == productId);
    if (!product) {
        alert('Product not found!');
        return;
    }
    
    document.getElementById('modalProductTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.firebaseId || product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productOriginalPrice').value = product.originalPrice || '';
    document.getElementById('productStock').value = product.stock || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    
    document.getElementById('productFormModal').classList.add('active');
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    database.ref('products/' + productId).remove()
        .then(() => {
            alert('Product deleted successfully!');
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Order Management
function viewOrderDetails(orderId) {
    const order = adminOrders.find(o => o.firebaseId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const content = document.getElementById('orderDetailsContent');
    content.innerHTML = `
        <div class="order-details">
            <div class="order-info-grid">
                <div class="info-item">
                    <h4>Order ID</h4>
                    <p>${order.orderId || order.firebaseId}</p>
                </div>
                <div class="info-item">
                    <h4>Customer Name</h4>
                    <p>${order.customerName || 'N/A'}</p>
                </div>
                <div class="info-item">
                    <h4>Phone</h4>
                    <p>${order.customerPhone || 'N/A'}</p>
                </div>
                <div class="info-item">
                    <h4>Status</h4>
                    <p><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></p>
                </div>
                <div class="info-item">
                    <h4>Date</h4>
                    <p>${formatDate(order.date)}</p>
                </div>
                <div class="info-item">
                    <h4>Total</h4>
                    <p>৳ ${(order.total || 0).toLocaleString()}</p>
                </div>
            </div>
            
            <div class="order-address">
                <h4>Address</h4>
                <p>${order.customerAddress || 'N/A'}</p>
            </div>
            
            <div class="order-items">
                <h4>Items (${order.items ? order.items.length : 0})</h4>
                ${order.items ? order.items.map(item => `
                    <div class="order-item-details">
                        <img src="${item.image || 'https://via.placeholder.com/60x60?text=No+Image'}" 
                             alt="${item.name}" 
                             class="order-item-image">
                        <div>
                            <h5>${item.name || 'N/A'}</h5>
                            <p>Price: ৳ ${(item.price || 0).toLocaleString()} × ${item.quantity || 1}</p>
                            <p>Total: ৳ ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                        </div>
                    </div>
                `).join('') : '<p>No items</p>'}
            </div>
        </div>
    `;
    
    document.getElementById('orderDetailsModal').classList.add('active');
}

function updateOrderStatus(orderId, status) {
    if (!confirm(`Change order status to ${status}?`)) return;
    
    database.ref('orders/' + orderId + '/status').set(status)
        .then(() => {
            alert('Order status updated!');
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Category Management
function addNewCategory() {
    const name = prompt('Enter category name:');
    if (!name) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const categoryData = {
        id: id,
        name: name,
        count: 0,
        icon: 'fas fa-folder'
    };
    
    database.ref('categories/' + id).set(categoryData)
        .then(() => {
            alert('Category added!');
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

function editCategory(categoryId) {
    const category = adminCategories.find(c => c.firebaseId === categoryId);
    if (!category) {
        alert('Category not found!');
        return;
    }
    
    const newName = prompt('Enter new name:', category.name);
    if (!newName) return;
    
    database.ref('categories/' + categoryId + '/name').set(newName)
        .then(() => {
            alert('Category updated!');
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

function deleteCategory(categoryId) {
    if (!confirm('Delete this category?')) return;
    
    database.ref('categories/' + categoryId).remove()
        .then(() => {
            alert('Category deleted!');
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Save Product Form
function saveProductForm(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        originalPrice: parseFloat(document.getElementById('productOriginalPrice').value) || 0,
        stock: parseInt(document.getElementById('productStock').value) || 0,
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value,
        updatedAt: new Date().toISOString()
    };
    
    // Remove empty original price if 0
    if (!productData.originalPrice) {
        delete productData.originalPrice;
    }
    
    let promise;
    if (productId) {
        // Update existing product
        productData.id = parseInt(productId) || Date.now();
        promise = database.ref('products/' + productId).update(productData);
    } else {
        // Add new product
        const newId = Date.now();
        productData.id = newId;
        productData.createdAt = new Date().toISOString();
        promise = database.ref('products/' + newId).set(productData);
        
        // Update category count
        if (productData.category) {
            database.ref('categories/' + productData.category + '/count').transaction((count) => {
                return (count || 0) + 1;
            });
        }
    }
    
    promise
        .then(() => {
            alert('Product saved successfully!');
            document.getElementById('productFormModal').classList.remove('active');
            document.getElementById('productForm').reset();
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Utility Functions
function getCategoryName(categoryId) {
    const category = adminCategories.find(c => c.id === categoryId || c.firebaseId === categoryId);
    return category ? category.name : categoryId || 'N/A';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

// Admin Authentication
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminDashboard();
    } else {
        alert('Invalid credentials! Use admin / admin123');
    }
    
    event.target.reset();
}

function handleAdminLogout() {
    if (confirm('Logout from admin panel?')) {
        adminLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        adminDashboard.style.display = 'none';
        adminLogin.style.display = 'flex';
        adminProducts = [];
        adminOrders = [];
        adminUsers = [];
    }
}

// Setup Event Listeners
function setupAdminEventListeners() {
    console.log("Setting up admin event listeners...");
    
    // Admin login form
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Admin logout
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Navigation links
    navLinks.forEach(link => {
        if (link.classList.contains('logout-btn')) return;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked link
            this.classList.add('active');
            
            // Hide all sections
            adminSections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const sectionId = this.dataset.section + 'Section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Load data if needed
            if (this.dataset.section === 'categories') {
                displayCategories();
            }
        });
    });
    
    // Order tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked tab
            this.classList.add('active');
            // Display orders for this status
            displayOrdersTable(this.dataset.status);
        });
    });
    
    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', saveProductForm);
    }
    
    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', addNewProduct);
    }
    
    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addNewCategory);
    }
    
    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.remove('active');
        });
    });
}

// Make functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing admin panel...");
    initAdminPanel();
});
