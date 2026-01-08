// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbc54ZsWBXFqX50KvY85kbHkUo_Ct5hLk",
  authDomain: "arifa-shop.firebaseapp.com",
  databaseURL: "https://arifa-shop-default-rtdb.firebaseio.com",
  projectId: "arifa-shop",
  storageBucket: "arifa-shop.firebasestorage.app",
  messagingSenderId: "792267788402",
  appId: "1:792267788402:web:96dd32886699ff188472eb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Admin Credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// DOM Elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');
const sectionLinks = document.querySelectorAll('.admin-sidebar li');
const contentSections = document.querySelectorAll('.content-section');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const filterBtns = document.querySelectorAll('.filter-btn');

// State
let currentProductId = null;
let currentCategoryId = null;
let products = [];
let categories = [];
let orders = [];
let users = [];

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
        loadData();
    }

    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Admin Login
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    sectionLinks.forEach(link => {
        link.addEventListener('click', () => {
            const section = link.dataset.section;
            showSection(section);
            
            // Update active state
            sectionLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Product Management
    addProductBtn.addEventListener('click', () => {
        currentProductId = null;
        modalTitle.textContent = 'Add Product';
        productForm.reset();
        loadCategoriesForSelect();
        productModal.classList.add('active');
    });

    productForm.addEventListener('submit', handleProductSubmit);

    // Category Management
    addCategoryBtn.addEventListener('click', () => {
        currentCategoryId = null;
        categoryModalTitle.textContent = 'Add Category';
        categoryForm.reset();
        categoryModal.classList.add('active');
    });

    categoryForm.addEventListener('submit', handleCategorySubmit);

    // Order Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterOrders(btn.dataset.status);
        });
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').classList.remove('active');
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Admin Authentication
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        loadData();
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid credentials!', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    adminDashboard.style.display = 'none';
    adminLogin.style.display = 'flex';
    showNotification('Logged out successfully!', 'success');
}

function showDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
}

// Navigation
function showSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}Section`).classList.add('active');
}

// Load Data from Firebase
async function loadData() {
    try {
        await Promise.all([
            loadProducts(),
            loadCategories(),
            loadOrders(),
            loadUsers()
        ]);
        
        updateDashboard();
        renderProductsTable();
        renderCategoriesTable();
        renderOrdersTable();
        renderUsersTable();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data!', 'error');
    }
}

async function loadProducts() {
    const snapshot = await database.ref('products').once('value');
    products = snapshot.val() || [];
    document.getElementById('totalProducts').textContent = Array.isArray(products) ? products.length : Object.keys(products).length;
}

async function loadCategories() {
    const snapshot = await database.ref('categories').once('value');
    const data = snapshot.val();
    
    if (data) {
        categories = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    } else {
        // Initialize with default categories
        categories = [
            { id: '1', name: 'Sex Toy', icon: 'fas fa-heart', status: 'active' },
            { id: '2', name: 'Electronics', icon: 'fas fa-laptop', status: 'active' },
            { id: '3', name: 'Fashion', icon: 'fas fa-tshirt', status: 'active' },
            { id: '4', name: 'Grocery', icon: 'fas fa-shopping-basket', status: 'active' },
            { id: '5', name: 'Mobile', icon: 'fas fa-mobile-alt', status: 'active' },
            { id: '6', name: 'Accessories', icon: 'fas fa-headphones', status: 'active' }
        ];
        
        // Save default categories to Firebase
        const categoriesRef = database.ref('categories');
        categories.forEach(category => {
            categoriesRef.child(category.id).set(category);
        });
    }
}

async function loadOrders() {
    const snapshot = await database.ref('orders').once('value');
    const data = snapshot.val();
    orders = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })) : [];
    document.getElementById('totalOrders').textContent = orders.length;
}

async function loadUsers() {
    const snapshot = await database.ref('users').once('value');
    const data = snapshot.val();
    users = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })) : [];
    document.getElementById('totalUsers').textContent = users.length;
}

// Update Dashboard
function updateDashboard() {
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `৳ ${totalRevenue.toLocaleString('en-BD')}`;
    
    // Render recent orders
    const recentOrders = orders.slice(-5).reverse();
    const tableBody = document.querySelector('#recentOrdersTable tbody');
    tableBody.innerHTML = recentOrders.map(order => `
        <tr>
            <td>#${order.id.substring(0, 8)}</td>
            <td>${order.customerName}</td>
            <td>৳ ${order.total?.toLocaleString('en-BD') || '0'}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Product Management
function renderProductsTable() {
    const tableBody = document.getElementById('productsTableBody');
    const productsArray = Array.isArray(products) ? products : Object.keys(products).map(key => ({
        id: key,
        ...products[key]
    }));

    tableBody.innerHTML = productsArray.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="table-product-image"></td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.price}</td>
            <td>${product.stock || 0}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id == categoryId);
    return category ? category.name : 'Unknown';
}

function loadCategoriesForSelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = categories.map(category => `
        <option value="${category.id}">${category.name}</option>
    `).join('');
}

function editProduct(productId) {
    currentProductId = productId;
    const product = Array.isArray(products) ? 
        products.find(p => p.id == productId) : 
        products[productId];

    if (product) {
        modalTitle.textContent = 'Edit Product';
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price?.replace('৳', '') || '';
        document.getElementById('productDiscount').value = product.discount || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productImage').value = product.image || '';
        
        loadCategoriesForSelect();
        document.getElementById('productCategory').value = product.category || '';
        
        productModal.classList.add('active');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        price: `৳ ${parseFloat(document.getElementById('productPrice').value).toLocaleString('en-BD')}`,
        discount: parseInt(document.getElementById('productDiscount').value) || 0,
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (currentProductId) {
            // Update existing product
            await database.ref(`products/${currentProductId}`).update(productData);
            showNotification('Product updated successfully!', 'success');
        } else {
            // Add new product
            productData.createdAt = new Date().toISOString();
            await database.ref('products').push(productData);
            showNotification('Product added successfully!', 'success');
        }

        productModal.classList.remove('active');
        await loadProducts();
        renderProductsTable();
        updateDashboard();
    } catch (error) {
        showNotification('Error saving product: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await database.ref(`products/${productId}`).remove();
            showNotification('Product deleted successfully!', 'success');
            await loadProducts();
            renderProductsTable();
            updateDashboard();
        } catch (error) {
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    }
}

// Category Management
function renderCategoriesTable() {
    const tableBody = document.getElementById('categoriesTableBody');
    
    tableBody.innerHTML = categories.map(category => `
        <tr>
            <td><i class="${category.icon}"></i> ${category.name}</td>
            <td>0</td> <!-- Product count would need to be calculated -->
            <td><span class="status-badge status-${category.status || 'active'}">${category.status || 'active'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editCategory(categoryId) {
    currentCategoryId = categoryId;
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
        categoryModalTitle.textContent = 'Edit Category';
        document.getElementById('categoryId').value = categoryId;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.icon;
        categoryModal.classList.add('active');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryData = {
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (currentCategoryId) {
            // Update existing category
            await database.ref(`categories/${currentCategoryId}`).update(categoryData);
            showNotification('Category updated successfully!', 'success');
        } else {
            // Add new category
            categoryData.createdAt = new Date().toISOString();
            categoryData.status = 'active';
            await database.ref('categories').push(categoryData);
            showNotification('Category added successfully!', 'success');
        }

        categoryModal.classList.remove('active');
        await loadCategories();
        renderCategoriesTable();
    } catch (error) {
        showNotification('Error saving category: ' + error.message, 'error');
    }
}

async function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        try {
            await database.ref(`categories/${categoryId}`).remove();
            showNotification('Category deleted successfully!', 'success');
            await loadCategories();
            renderCategoriesTable();
        } catch (error) {
            showNotification('Error deleting category: ' + error.message, 'error');
        }
    }
}

// Order Management
function renderOrdersTable(filteredOrders = orders) {
    const tableBody = document.getElementById('ordersTableBody');
    
    tableBody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>#${order.id.substring(0, 8)}</td>
            <td>${order.customerName}</td>
            <td>${order.items?.length || 0} items</td>
            <td>৳ ${order.total?.toLocaleString('en-BD') || '0'}</td>
            <td>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view-btn" onclick="viewOrder('${order.id}')">
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
                </div>
            </td>
        </tr>
    `).join('');
}

function filterOrders(status) {
    let filteredOrders = orders;
    
    if (status !== 'all') {
        filteredOrders = orders.filter(order => order.status === status);
    }
    
    renderOrdersTable(filteredOrders);
}

async function updateOrderStatus(orderId, status) {
    try {
        await database.ref(`orders/${orderId}/status`).set(status);
        showNotification(`Order ${status} successfully!`, 'success');
        await loadOrders();
        renderOrdersTable();
        updateDashboard();
    } catch (error) {
        showNotification('Error updating order: ' + error.message, 'error');
    }
}

function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const orderDetails = `
        <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #${order.id.substring(0, 8)}</p>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Address:</strong> ${order.customerAddress}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            
            <h4>Items:</h4>
            <ul>
                ${order.items?.map(item => `
                    <li>${item.name} - ${item.price} x ${item.quantity}</li>
                `).join('') || '<li>No items</li>'}
            </ul>
            
            <p><strong>Total:</strong> ৳ ${order.total?.toLocaleString('en-BD') || '0'}</p>
        </div>
    `;

    // Show in a modal
    alert(orderDetails); // In a real app, you'd use a proper modal
}

// User Management
function renderUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>0</td> <!-- Order count would need to be calculated -->
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewUser('${user.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const userDetails = `
        <div class="user-details">
            <h3>User Details</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
            <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
            <p><strong>User ID:</strong> ${userId}</p>
        </div>
    `;

    alert(userDetails); // In a real app, you'd use a proper modal
}

// Utility Functions
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions to global scope for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.viewUser = viewUser;
