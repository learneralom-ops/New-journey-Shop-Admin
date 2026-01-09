// Admin Panel JavaScript
const adminLoginScreen = document.getElementById('admin-login');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginForm = document.getElementById('admin-login-form');
const adminEmail = document.getElementById('admin-email');
const adminPassword = document.getElementById('admin-password');
const adminLogoutBtn = document.getElementById('admin-logout');
const adminName = document.getElementById('admin-name');

// Menu Items
const menuItems = document.querySelectorAll('.menu-item');
const adminSections = document.querySelectorAll('.admin-section');

// Stats Elements
const totalRevenueEl = document.getElementById('total-revenue');
const totalOrdersEl = document.getElementById('total-orders');
const totalProductsEl = document.getElementById('total-products');
const totalUsersEl = document.getElementById('total-users');

// Table Elements
const productsTable = document.getElementById('products-table');
const ordersTable = document.getElementById('orders-table');
const usersTable = document.getElementById('users-table');
const recentOrdersTable = document.getElementById('recent-orders-table');

// Modal Elements
const addProductModal = document.getElementById('add-product-modal');
const addCategoryModal = document.getElementById('add-category-modal');
const addBannerModal = document.getElementById('add-banner-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const closeProductModalBtn = document.querySelector('.close-product-modal');
const closeCategoryModalBtn = document.querySelector('.close-category-modal');
const closeBannerModalBtn = document.querySelector('.close-banner-modal');

// Form Elements
const addProductBtn = document.getElementById('add-product-btn');
const addCategoryBtn = document.getElementById('add-category-btn');
const addBannerBtn = document.getElementById('add-banner-btn');
const productForm = document.getElementById('product-form');
const categoryForm = document.getElementById('category-form');
const bannerForm = document.getElementById('banner-form');

// Filter Elements
const orderStatusFilter = document.getElementById('order-status-filter');
const orderDateFilter = document.getElementById('order-date-filter');

// Loading Overlay
const adminLoading = document.getElementById('admin-loading');

// State Variables
let currentAdmin = null;
let adminProducts = [];
let adminCategories = [];
let adminOrders = [];
let adminUsers = [];
let adminBanners = [];
let currentEditingProduct = null;

// Initialize Admin App
document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});

// Initialize Admin App
async function initAdminApp() {
    // Check if user is already logged in
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                currentAdmin = user;
                showAdminDashboard();
                loadAdminData();
            } else {
                showAdminLogin();
                showError('Access denied. Admin privileges required.');
                await auth.signOut();
            }
        } else {
            showAdminLogin();
        }
    });
    
    initAdminEventListeners();
}

// Show/Hide Admin Screens
function showAdminLogin() {
    adminLoginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    adminLoginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    adminName.textContent = currentAdmin.displayName || 'Admin';
}

// Event Listeners
function initAdminEventListeners() {
    // Admin Login
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Admin Logout
    adminLogoutBtn.addEventListener('click', handleAdminLogout);
    
    // Menu Navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
            
            // Update active state
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Modal Open/Close
    addProductBtn.addEventListener('click', () => openModal(addProductModal));
    addCategoryBtn.addEventListener('click', () => openModal(addCategoryModal));
    addBannerBtn.addEventListener('click', () => openModal(addBannerModal));
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
            resetProductForm();
        });
    });
    
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
            closeModal(addProductModal);
            resetProductForm();
        });
    }
    
    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', () => {
            closeModal(addCategoryModal);
            categoryForm.reset();
        });
    }
    
    if (closeBannerModalBtn) {
        closeBannerModalBtn.addEventListener('click', () => {
            closeModal(addBannerModal);
            bannerForm.reset();
        });
    }
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === addProductModal) {
            closeModal(addProductModal);
            resetProductForm();
        }
        if (e.target === addCategoryModal) {
            closeModal(addCategoryModal);
            categoryForm.reset();
        }
        if (e.target === addBannerModal) {
            closeModal(addBannerModal);
            bannerForm.reset();
        }
    });
    
    // Form Submissions
    productForm.addEventListener('submit', handleProductSubmit);
    categoryForm.addEventListener('submit', handleCategorySubmit);
    bannerForm.addEventListener('submit', handleBannerSubmit);
    
    // Filters
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', filterOrders);
    }
    
    if (orderDateFilter) {
        orderDateFilter.addEventListener('change', filterOrders);
    }
    
    // Image Upload Preview
    const productImageInput = document.getElementById('product-image');
    if (productImageInput) {
        productImageInput.addEventListener('change', function(e) {
            previewImage(e.target, 'image-preview');
        });
    }
    
    const bannerImageInput = document.getElementById('banner-image');
    if (bannerImageInput) {
        bannerImageInput.addEventListener('change', function(e) {
            previewImage(e.target, 'banner-preview');
        });
    }
}

// Authentication Functions
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = adminEmail.value.trim();
    const password = adminPassword.value;
    
    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }
    
    showAdminLoading();
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user is admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            await auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
        }
        
        currentAdmin = user;
        showAdminDashboard();
        loadAdminData();
        showNotification('Admin login successful!');
        
    } catch (error) {
        console.error('Admin login error:', error);
        showError(error.message || 'Invalid credentials or access denied');
    } finally {
        hideAdminLoading();
    }
}

async function handleAdminLogout() {
    try {
        await auth.signOut();
        currentAdmin = null;
        showAdminLogin();
        showNotification('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed');
    }
}

// Section Navigation
function showSection(sectionId) {
    adminSections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionId) {
            case 'dashboard':
                loadDashboardStats();
                loadRecentOrders();
                break;
            case 'products':
                loadProductsTable();
                break;
            case 'categories':
                loadCategoriesManagement();
                break;
            case 'orders':
                loadOrdersTable();
                break;
            case 'banners':
                loadBannersManagement();
                break;
            case 'users':
                loadUsersTable();
                break;
        }
    }
}

// Data Loading Functions
async function loadAdminData() {
    showAdminLoading();
    
    try {
        await Promise.all([
            loadDashboardStats(),
            loadProductsTable(),
            loadCategoriesManagement(),
            loadOrdersTable(),
            loadUsersTable(),
            loadBannersManagement()
        ]);
    } catch (error) {
        console.error('Error loading admin data:', error);
        showError('Failed to load admin data');
    } finally {
        hideAdminLoading();
    }
}

async function loadDashboardStats() {
    try {
        // Load total revenue (sum of all delivered orders)
        const ordersSnapshot = await db.collection('orders')
            .where('status', '==', 'delivered')
            .get();
        
        let totalRevenue = 0;
        ordersSnapshot.docs.forEach(doc => {
            const order = doc.data();
            totalRevenue += order.total || 0;
        });
        
        totalRevenueEl.textContent = `৳ ${totalRevenue.toFixed(2)}`;
        totalOrdersEl.textContent = ordersSnapshot.size;
        
        // Load total products
        const productsSnapshot = await db.collection('products').get();
        totalProductsEl.textContent = productsSnapshot.size;
        
        // Load total users
        const usersSnapshot = await db.collection('users').get();
        totalUsersEl.textContent = usersSnapshot.size;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const tbody = recentOrdersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            const row = createOrderRow(order);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadProductsTable() {
    try {
        const snapshot = await db.collection('products').get();
        adminProducts = [];
        snapshot.docs.forEach(doc => {
            adminProducts.push({ id: doc.id, ...doc.data() });
        });
        
        const tbody = productsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        adminProducts.forEach(product => {
            const row = createProductRow(product);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

async function loadCategoriesManagement() {
    try {
        const snapshot = await db.collection('categories').get();
        adminCategories = [];
        snapshot.docs.forEach(doc => {
            adminCategories.push({ id: doc.id, ...doc.data() });
        });
        
        const categoriesList = document.querySelector('.categories-list');
        if (!categoriesList) return;
        
        categoriesList.innerHTML = '';
        
        // Populate category select in product form
        const categorySelect = document.getElementById('product-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            adminCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
        
        adminCategories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item-admin';
            categoryItem.innerHTML = `
                <div class="category-icon-admin">
                    <i class="${category.iconUrl || 'fas fa-box'}"></i>
                </div>
                <div>
                    <h4>${category.name}</h4>
                    <p>${category.productsCount || 0} products</p>
                </div>
                <div class="category-actions">
                    <button class="action-btn edit-btn" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            categoriesList.appendChild(categoryItem);
        });
        
        // Add event listeners to category action buttons
        document.querySelectorAll('.category-actions .edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.edit-btn').getAttribute('data-id');
                editCategory(categoryId);
            });
        });
        
        document.querySelectorAll('.category-actions .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.delete-btn').getAttribute('data-id');
                deleteCategory(categoryId);
            });
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadOrdersTable() {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        adminOrders = [];
        snapshot.docs.forEach(doc => {
            adminOrders.push({ id: doc.id, ...doc.data() });
        });
        
        const tbody = ordersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        adminOrders.forEach(order => {
            const row = createOrderRow(order);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function loadUsersTable() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        adminUsers = [];
        snapshot.docs.forEach(doc => {
            adminUsers.push({ id: doc.id, ...doc.data() });
        });
        
        const tbody = usersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        adminUsers.forEach(user => {
            const row = createUserRow(user);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadBannersManagement() {
    try {
        const snapshot = await db.collection('banners').get();
        adminBanners = [];
        snapshot.docs.forEach(doc => {
            adminBanners.push({ id: doc.id, ...doc.data() });
        });
        
        const bannersGrid = document.querySelector('.banners-grid');
        if (!bannersGrid) return;
        
        bannersGrid.innerHTML = '';
        
        adminBanners.forEach(banner => {
            const bannerCard = document.createElement('div');
            bannerCard.className = 'banner-card';
            bannerCard.innerHTML = `
                <img src="${banner.imageUrl}" alt="Banner">
                <div class="banner-info">
                    <span>${new Date(banner.createdAt?.toDate()).toLocaleDateString()}</span>
                    <div class="action-buttons">
                        <button class="action-btn delete-btn" data-id="${banner.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            bannersGrid.appendChild(bannerCard);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.banner-info .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bannerId = e.target.closest('.delete-btn').getAttribute('data-id');
                deleteBanner(bannerId);
            });
        });
        
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

// Row Creation Functions
function createProductRow(product) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" 
                 alt="${product.title}" 
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
        </td>
        <td>${product.title}</td>
        <td>${product.category || 'Uncategorized'}</td>
        <td>৳ ${product.price?.toFixed(2) || '0.00'}</td>
        <td>${product.discount || 0}%</td>
        <td>${product.stock || 0}</td>
        <td>
            <span class="status-badge ${product.status === 'active' ? 'status-delivered' : 'status-cancelled'}">
                ${product.status || 'inactive'}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners
    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => editProduct(product.id));
    
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));
    
    return row;
}

function createOrderRow(order) {
    const row = document.createElement('tr');
    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    
    row.innerHTML = `
        <td>${order.orderId}</td>
        <td>${order.userName || 'Customer'}</td>
        <td>${order.items?.length || 0} items</td>
        <td>৳ ${order.total?.toFixed(2) || '0.00'}</td>
        <td>
            <select class="order-status-select" data-id="${order.id}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        </td>
        <td>${date.toLocaleDateString()}</td>
        <td>
            <button class="action-btn view-btn view-order-btn" data-id="${order.id}">
                <i class="fas fa-eye"></i>
            </button>
        </td>
    `;
    
    // Add event listener for status change
    const statusSelect = row.querySelector('.order-status-select');
    statusSelect.addEventListener('change', (e) => {
        updateOrderStatus(order.id, e.target.value);
    });
    
    // Add event listener for view order
    const viewBtn = row.querySelector('.view-order-btn');
    viewBtn.addEventListener('click', () => viewOrderDetails(order));
    
    return row;
}

function createUserRow(user) {
    const row = document.createElement('tr');
    const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
    
    row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
            <span class="status-badge ${user.role === 'admin' ? 'status-processing' : 'status-delivered'}">
                ${user.role || 'user'}
            </span>
        </td>
        <td>${date.toLocaleDateString()}</td>
        <td>${user.ordersCount || 0}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit-btn" data-id="${user.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Form Handling Functions
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const discount = parseInt(document.getElementById('product-discount').value) || 0;
    const description = document.getElementById('product-description').value;
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    const status = document.getElementById('product-status').value;
    const imageFile = document.getElementById('product-image').files[0];
    
    // Validation
    if (!name || !category || !price) {
        showError('Please fill in all required fields');
        return;
    }
    
    showAdminLoading();
    
    try {
        let imageUrl = '';
        
        // Upload image if exists
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'products');
        } else if (currentEditingProduct) {
            imageUrl = currentEditingProduct.imageUrl;
        }
        
        const productData = {
            title: name,
            category: category,
            price: price,
            discount: discount,
            description: description,
            stock: stock,
            status: status,
            imageUrl: imageUrl,
            rating: 4.5,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentEditingProduct) {
            // Update existing product
            await db.collection('products').doc(currentEditingProduct.id).update(productData);
            showNotification('Product updated successfully!');
        } else {
            // Add new product
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            showNotification('Product added successfully!');
        }
        
        closeModal(addProductModal);
        resetProductForm();
        loadProductsTable();
        loadDashboardStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showError('Failed to save product');
    } finally {
        hideAdminLoading();
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value.trim();
    const icon = document.getElementById('category-icon').value.trim();
    const imageFile = document.getElementById('category-image').files[0];
    
    if (!name) {
        showError('Category name is required');
        return;
    }
    
    showAdminLoading();
    
    try {
        let imageUrl = '';
        
        // Upload image if exists
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'categories');
        }
        
        const categoryData = {
            name: name,
            iconUrl: icon || 'fas fa-box',
            imageUrl: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('categories').add(categoryData);
        
        closeModal(addCategoryModal);
        categoryForm.reset();
        showNotification('Category added successfully!');
        loadCategoriesManagement();
        
    } catch (error) {
        console.error('Error saving category:', error);
        showError('Failed to save category');
    } finally {
        hideAdminLoading();
    }
}

async function handleBannerSubmit(e) {
    e.preventDefault();
    
    const imageFile = document.getElementById('banner-image').files[0];
    const link = document.getElementById('banner-link').value.trim();
    
    if (!imageFile) {
        showError('Banner image is required');
        return;
    }
    
    showAdminLoading();
    
    try {
        // Upload image
        const imageUrl = await uploadImage(imageFile, 'banners');
        
        const bannerData = {
            imageUrl: imageUrl,
            link: link || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('banners').add(bannerData);
        
        closeModal(addBannerModal);
        bannerForm.reset();
        showNotification('Banner added successfully!');
        loadBannersManagement();
        
    } catch (error) {
        console.error('Error saving banner:', error);
        showError('Failed to save banner');
    } finally {
        hideAdminLoading();
    }
}

// Edit/Delete Functions
async function editProduct(productId) {
    const product = adminProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentEditingProduct = product;
    
    // Fill form with product data
    document.getElementById('product-name').value = product.title;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-discount').value = product.discount || 0;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-status').value = product.status || 'active';
    
    // Show image preview if exists
    if (product.imageUrl) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<img src="${product.imageUrl}" alt="Current product image">`;
    }
    
    openModal(addProductModal);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    showAdminLoading();
    
    try {
        await db.collection('products').doc(productId).delete();
        showNotification('Product deleted successfully!');
        loadProductsTable();
        loadDashboardStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    } finally {
        hideAdminLoading();
    }
}

async function editCategory(categoryId) {
    // Implement category edit functionality
    showNotification('Category edit feature coming soon!');
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    showAdminLoading();
    
    try {
        await db.collection('categories').doc(categoryId).delete();
        showNotification('Category deleted successfully!');
        loadCategoriesManagement();
    } catch (error) {
        console.error('Error deleting category:', error);
        showError('Failed to delete category');
    } finally {
        hideAdminLoading();
    }
}

async function deleteBanner(bannerId) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    showAdminLoading();
    
    try {
        await db.collection('banners').doc(bannerId).delete();
        showNotification('Banner deleted successfully!');
        loadBannersManagement();
    } catch (error) {
        console.error('Error deleting banner:', error);
        showError('Failed to delete banner');
    } finally {
        hideAdminLoading();
    }
}

async function updateOrderStatus(orderId, status) {
    showAdminLoading();
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification(`Order status updated to ${status}`);
        loadOrdersTable();
        loadRecentOrders();
        loadDashboardStats();
    } catch (error) {
        console.error('Error updating order status:', error);
        showError('Failed to update order status');
    } finally {
        hideAdminLoading();
    }
}

function viewOrderDetails(order) {
    // Create order details modal
    const modal = document.createElement('div');
    modal.className = 'admin-modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Order Details - ${order.orderId}</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="order-info">
                    <p><strong>Customer:</strong> ${order.userName} (${order.userEmail})</p>
                    <p><strong>Date:</strong> ${order.createdAt?.toDate().toLocaleString()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total:</strong> ৳ ${order.total?.toFixed(2)}</p>
                </div>
                
                <h4>Order Items</h4>
                <div class="order-items">
                    ${order.items?.map(item => `
                        <div class="order-item">
                            <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" 
                                 alt="${item.title}" 
                                 style="width: 50px; height: 50px;">
                            <div>
                                <p><strong>${item.title}</strong></p>
                                <p>Price: ৳ ${item.price?.toFixed(2)} x ${item.quantity} = ৳ ${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    `).join('') || '<p>No items found</p>'}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Filter Functions
function filterOrders() {
    const status = orderStatusFilter.value;
    const date = orderDateFilter.value;
    
    const filteredOrders = adminOrders.filter(order => {
        let match = true;
        
        if (status !== 'all' && order.status !== status) {
            match = false;
        }
        
        if (date) {
            const orderDate = order.createdAt?.toDate ? 
                order.createdAt.toDate().toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
            
            if (orderDate !== date) {
                match = false;
            }
        }
        
        return match;
    });
    
    const tbody = ordersTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    filteredOrders.forEach(order => {
        const row = createOrderRow(order);
        tbody.appendChild(row);
    });
}

// Image Upload Functions
async function uploadImage(file, folder) {
    return new Promise((resolve, reject) => {
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`${folder}/${Date.now()}_${file.name}`);
        
        const uploadTask = imageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress monitoring (optional)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
                console.error('Upload error:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; border-radius: 6px; margin-top: 10px;">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// UI Helper Functions
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function closeAllModals() {
    closeModal(addProductModal);
    closeModal(addCategoryModal);
    closeModal(addBannerModal);
}

function resetProductForm() {
    productForm.reset();
    document.getElementById('image-preview').innerHTML = '';
    currentEditingProduct = null;
}

function showAdminLoading() {
    adminLoading.classList.add('active');
}

function hideAdminLoading() {
    adminLoading.classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if not already added
    if (!document.querySelector('#admin-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .notification.success {
                background-color: #4caf50;
            }
            .notification.error {
                background-color: #f44336;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 15px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}


// app.js এর যেকোনো স্থানে এই ফাংশন যোগ করুন
async function registerAsAdmin() {
    const email = prompt("Enter admin email:");
    const password = prompt("Enter admin password (min 6 characters):");
    const name = prompt("Enter admin name:");
    
    if (!email || !password || !name) {
        alert("All fields are required!");
        return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        
        // Save user to Firestore with admin role
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: 'admin', // সরাসরি admin role সেট করা হচ্ছে
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Admin account created successfully!');
        showNotification('Admin account created!');
        
    } catch (error) {
        console.error('Admin registration error:', error);
        alert('Error creating admin account: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ইউজার ইন্টারফেসে একটি এডমিন রেজিস্ট্রেশন বাটন যোগ করতে চাইলে
// নিচের কোড যোগ করুন (app.js এর initEventListeners ফাংশনে):
function initEventListeners() {
    // ... existing code ...
    
    // Admin registration button (for development only)
    const adminRegisterBtn = document.createElement('button');
    adminRegisterBtn.textContent = 'Admin Register (Dev)';
    adminRegisterBtn.style.position = 'fixed';
    adminRegisterBtn.style.bottom = '10px';
    adminRegisterBtn.style.right = '10px';
    adminRegisterBtn.style.zIndex = '9999';
    adminRegisterBtn.style.padding = '10px';
    adminRegisterBtn.style.backgroundColor = '#ff6b00';
    adminRegisterBtn.style.color = 'white';
    adminRegisterBtn.style.border = 'none';
    adminRegisterBtn.style.borderRadius = '5px';
    adminRegisterBtn.style.cursor = 'pointer';
    adminRegisterBtn.addEventListener('click', registerAsAdmin);
    document.body.appendChild(adminRegisterBtn);
}
