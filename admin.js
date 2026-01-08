// Admin Application State
let adminLoggedIn = false;
let adminProducts = [];
let adminOrders = [];
let adminUsers = [];

// DOM Elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogout');
const adminSections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize Admin Panel
function initAdminPanel() {
    checkAdminAuth();
    setupAdminEventListeners();
    
    if (adminLoggedIn) {
        loadAdminData();
    }
}

// Check Admin Authentication
function checkAdminAuth() {
    const savedAdmin = localStorage.getItem('adminLoggedIn');
    if (savedAdmin === 'true') {
        adminLoggedIn = true;
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'flex';
    }
}

// Load Admin Data
function loadAdminData() {
    loadProductsForAdmin();
    loadOrdersForAdmin();
    loadUsersForAdmin();
    updateDashboardStats();
}

// Load Products for Admin
function loadProductsForAdmin() {
    database.ref('products').on('value', (snapshot) => {
        adminProducts = [];
        snapshot.forEach((childSnapshot) => {
            adminProducts.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        displayProductsTable();
        updateDashboardStats();
    });
}

// Load Orders for Admin
function loadOrdersForAdmin() {
    database.ref('orders').on('value', (snapshot) => {
        adminOrders = [];
        snapshot.forEach((childSnapshot) => {
            adminOrders.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        displayOrdersTable();
        updateDashboardStats();
    });
}

// Load Users for Admin
function loadUsersForAdmin() {
    database.ref('users').on('value', (snapshot) => {
        adminUsers = [];
        snapshot.forEach((childSnapshot) => {
            adminUsers.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        displayUsersTable();
        updateDashboardStats();
    });
}

// Update Dashboard Statistics
function updateDashboardStats() {
    document.getElementById('totalProducts').textContent = adminProducts.length;
    document.getElementById('totalOrders').textContent = adminOrders.length;
    document.getElementById('totalUsers').textContent = adminUsers.length;
    
    const totalRevenue = adminOrders
        .filter(order => order.status === 'approved')
        .reduce((sum, order) => sum + (order.total || 0), 0);
    
    document.getElementById('totalRevenue').textContent = `৳ ${totalRevenue.toLocaleString()}`;
}

// Display Products Table
function displayProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    adminProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td class="product-image-cell">
                <img src="${product.image || 'https://via.placeholder.com/50x50?text=No+Image'}" 
                     alt="${product.name}"
                     width="50">
            </td>
            <td>${product.name}</td>
            <td><span class="category-badge">${getCategoryName(product.category)}</span></td>
            <td>৳ ${product.price?.toLocaleString() || '0'}</td>
            <td>${product.stock || 0}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display Orders Table
function displayOrdersTable(status = 'all') {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    let filteredOrders = adminOrders;
    if (status !== 'all') {
        filteredOrders = adminOrders.filter(order => order.status === status);
    }
    
    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId || order.id}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${order.items?.length || 0} items</td>
            <td>৳ ${order.total?.toLocaleString() || '0'}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>${formatDate(order.date)}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${order.status === 'pending' ? `
                    <button class="action-btn edit-btn" onclick="updateOrderStatus('${order.id}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn delete-btn" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display Users Table
function displayUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    adminUsers.forEach(user => {
        const userOrders = adminOrders.filter(order => order.userId === user.id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
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
    
    database.ref('categories').once('value', (snapshot) => {
        grid.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const category = childSnapshot.val();
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="${category.icon || 'fas fa-folder'}"></i>
                </div>
                <h3 class="category-name">${category.name}</h3>
                <p class="category-count">${category.count || 0} Products</p>
                <div class="category-actions">
                    <button class="action-btn edit-btn" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            grid.appendChild(categoryCard);
        });
    });
}

// Product Management Functions
function addNewProduct() {
    document.getElementById('modalProductTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productFormModal').classList.add('active');
}

function editProduct(productId) {
    const product = adminProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modalProductTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
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
    if (confirm('Are you sure you want to delete this product?')) {
        database.ref('products/' + productId).remove()
            .then(() => {
                alert('Product deleted successfully!');
            })
            .catch((error) => {
                alert('Error deleting product: ' + error.message);
            });
    }
}

function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        originalPrice: parseFloat(document.getElementById('productOriginalPrice').value) || null,
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value,
        updatedAt: new Date().toISOString()
    };
    
    let promise;
    if (productId) {
        // Update existing product
        productData.id = parseInt(productId);
        promise = database.ref('products/' + productId).update(productData);
    } else {
        // Add new product
        const newId = Date.now();
        productData.id = newId;
        productData.createdAt = new Date().toISOString();
        promise = database.ref('products/' + newId).set(productData);
        
        // Update category count
        database.ref('categories/' + productData.category + '/count').transaction((count) => {
            return (count || 0) + 1;
        });
    }
    
    promise
        .then(() => {
            alert('Product saved successfully!');
            document.getElementById('productFormModal').classList.remove('active');
            event.target.reset();
        })
        .catch((error) => {
            alert('Error saving product: ' + error.message);
        });
}

// Order Management Functions
function viewOrderDetails(orderId) {
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const content = document.getElementById('orderDetailsContent');
    content.innerHTML = `
        <div class="order-details">
            <div class="order-info-grid">
                <div class="info-item">
                    <h4>Order ID</h4>
                    <p>${order.orderId || order.id}</p>
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
                    <p><span class="status-badge status-${order.status}">${order.status}</span></p>
                </div>
                <div class="info-item">
                    <h4>Order Date</h4>
                    <p>${formatDate(order.date)}</p>
                </div>
                <div class="info-item">
                    <h4>Total Amount</h4>
                    <p>৳ ${order.total?.toLocaleString() || '0'}</p>
                </div>
            </div>
            
            <div class="order-address">
                <h4>Delivery Address</h4>
                <p>${order.customerAddress || 'N/A'}</p>
            </div>
            
            <div class="order-items">
                <h4>Order Items (${order.items?.length || 0})</h4>
                ${order.items ? order.items.map(item => `
                    <div class="order-item-details">
                        <img src="${item.image || 'https://via.placeholder.com/60x60?text=No+Image'}" 
                             alt="${item.name}" 
                             class="order-item-image">
                        <div>
                            <h5>${item.name}</h5>
                            <p>Price: ৳ ${item.price?.toLocaleString() || '0'} × ${item.quantity || 1}</p>
                            <p>Total: ৳ ${(item.price * item.quantity)?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                `).join('') : '<p>No items found</p>'}
            </div>
        </div>
    `;
    
    document.getElementById('orderDetailsModal').classList.add('active');
}

function updateOrderStatus(orderId, status) {
    if (confirm(`Are you sure you want to ${status} this order?`)) {
        database.ref('orders/' + orderId + '/status').set(status)
            .then(() => {
                alert(`Order ${status} successfully!`);
            })
            .catch((error) => {
                alert('Error updating order: ' + error.message);
            });
    }
}

// Category Management Functions
function addNewCategory() {
    const categoryName = prompt('Enter new category name:');
    if (!categoryName) return;
    
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    const categoryData = {
        id: categoryId,
        name: categoryName,
        count: 0,
        icon: 'fas fa-folder',
        createdAt: new Date().toISOString()
    };
    
    database.ref('categories/' + categoryId).set(categoryData)
        .then(() => {
            alert('Category added successfully!');
        })
        .catch((error) => {
            alert('Error adding category: ' + error.message);
        });
}

function editCategory(categoryId) {
    const newName = prompt('Enter new category name:');
    if (!newName) return;
    
    database.ref('categories/' + categoryId + '/name').set(newName)
        .then(() => {
            alert('Category updated successfully!');
        })
        .catch((error) => {
            alert('Error updating category: ' + error.message);
        });
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
        database.ref('categories/' + categoryId).remove()
            .then(() => {
                alert('Category deleted successfully!');
            })
            .catch((error) => {
                alert('Error deleting category: ' + error.message);
            });
    }
}

// Utility Functions
function getCategoryName(categoryId) {
    const categories = {
        'sex-toy': 'Sex Toy',
        'electronics': 'Electronics',
        'fashion': 'Fashion',
        'grocery': 'Grocery',
        'mobile': 'Mobile',
        'accessories': 'Accessories'
    };
    return categories[categoryId] || categoryId;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Admin Authentication Functions
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Simple admin authentication (for demo)
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'flex';
        loadAdminData();
    } else {
        alert('Invalid admin credentials');
    }
    
    event.target.reset();
}

function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        adminLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        adminDashboard.style.display = 'none';
        adminLogin.style.display = 'flex';
    }
}

// Event Listeners Setup
function setupAdminEventListeners() {
    // Admin login
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Admin logout
    adminLogoutBtn.addEventListener('click', handleAdminLogout);
    
    // Navigation
    navLinks.forEach(link => {
        if (link.classList.contains('logout-btn')) return;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected section
            const section = link.dataset.section;
            adminSections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === section + 'Section') {
                    sec.classList.add('active');
                }
            });
            
            // Load data for section
            if (section === 'categories') {
                displayCategories();
            } else if (section === 'dashboard') {
                updateDashboardStats();
            }
        });
    });
    
    // Order tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayOrdersTable(btn.dataset.status);
        });
    });
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    
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
    
    // Close modals
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);

// Global functions for inline onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
