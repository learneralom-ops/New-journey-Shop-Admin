// Import Firebase services
import { auth, db, storage } from './firebase.js';

// DOM Elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Admin Sections
const adminSections = {
    dashboard: document.getElementById('dashboardSection'),
    products: document.getElementById('productsSection'),
    categories: document.getElementById('categoriesSection'),
    orders: document.getElementById('ordersSection'),
    banners: document.getElementById('bannersSection'),
    users: document.getElementById('usersSection')
};

// Admin Modals
const adminProductModal = document.getElementById('adminProductModal');
const adminCategoryModal = document.getElementById('adminCategoryModal');
const adminBannerModal = document.getElementById('adminBannerModal');

// Admin Toast
const adminToast = document.getElementById('adminToast');
const adminToastMessage = document.getElementById('adminToastMessage');

// State Variables
let currentAdmin = null;
let isEditingProduct = false;
let isEditingCategory = false;
let isEditingBanner = false;
let currentEditId = null;

// Initialize Admin App
document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});

// Initialize Admin Application
function initAdminApp() {
    // Check if user is already logged in
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin
            const isAdmin = await checkIfAdmin(user.uid);
            if (isAdmin) {
                currentAdmin = user;
                showAdminDashboard();
                loadDashboardData();
                initAdminEventListeners();
            } else {
                // Not an admin, show login
                showAdminLogin();
                showToast('Access denied. Admin privileges required.', 'error');
                await auth.signOut();
            }
        } else {
            // Not logged in, show login
            showAdminLogin();
        }
    });
}

// Check if User is Admin
async function checkIfAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.role === 'admin';
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Show/Hide Admin Sections
function showAdminLogin() {
    adminLogin.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'flex';
    
    // Update admin name
    const adminUserName = document.getElementById('adminUserName');
    if (adminUserName && currentAdmin) {
        adminUserName.textContent = currentAdmin.displayName || currentAdmin.email;
    }
}

// Switch Admin Section
function switchAdminSection(sectionId) {
    // Hide all sections
    Object.values(adminSections).forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    if (adminSections[sectionId]) {
        adminSections[sectionId].classList.add('active');
        
        // Add active class to corresponding nav button
        const navBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }
        
        // Load section data
        switch (sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'products':
                loadProducts();
                break;
            case 'categories':
                loadCategories();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'banners':
                loadBanners();
                break;
            case 'users':
                loadUsers();
                break;
        }
    }
}

// Initialize Admin Event Listeners
function initAdminEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            switchAdminSection(sectionId);
        });
    });
    
    // Logout button
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Login form
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Add buttons
    const addProductBtn = document.getElementById('addProductBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addBannerBtn = document.getElementById('addBannerBtn');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            showProductModal();
        });
    }
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            showCategoryModal();
        });
    }
    
    if (addBannerBtn) {
        addBannerBtn.addEventListener('click', () => {
            showBannerModal();
        });
    }
    
    // Order filter
    const orderFilter = document.getElementById('orderFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', () => {
            loadOrders(orderFilter.value);
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(adminProductModal);
            hideModal(adminCategoryModal);
            hideModal(adminBannerModal);
        });
    });
    
    // Cancel buttons
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const cancelBannerBtn = document.getElementById('cancelBannerBtn');
    
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
            hideModal(adminProductModal);
        });
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            hideModal(adminCategoryModal);
        });
    }
    
    if (cancelBannerBtn) {
        cancelBannerBtn.addEventListener('click', () => {
            hideModal(adminBannerModal);
        });
    }
    
    // Form submissions
    const productForm = document.getElementById('productForm');
    const categoryForm = document.getElementById('categoryForm');
    const bannerForm = document.getElementById('bannerForm');
    
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    if (bannerForm) {
        bannerForm.addEventListener('submit', handleBannerSubmit);
    }
    
    // Image previews
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', (e) => {
            previewImage(e.target, 'imagePreview');
        });
    }
    
    const bannerImageInput = document.getElementById('bannerImage');
    if (bannerImageInput) {
        bannerImageInput.addEventListener('change', (e) => {
            previewImage(e.target, 'bannerPreview');
        });
    }
}

// Updated Admin Login Handler
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const loginMessage = document.getElementById('adminLoginMessage');
    
    // Clear previous messages
    if (loginMessage) {
        loginMessage.textContent = '';
        loginMessage.className = 'login-message';
    }
    
    try {
        console.log('Attempting login with:', email);
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Firebase Auth successful, user ID:', user.uid);
        
        // Check if user exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.log('User not found in Firestore');
            await auth.signOut();
            
            if (loginMessage) {
                loginMessage.textContent = 'User account not found. Please contact administrator.';
                loginMessage.className = 'login-message error';
            }
            return;
        }
        
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        
        // Check if user has admin role
        if (userData.role !== 'admin') {
            console.log('User is not admin, role:', userData.role);
            await auth.signOut();
            
            if (loginMessage) {
                loginMessage.textContent = 'Access denied. Admin privileges required.';
                loginMessage.className = 'login-message error';
            }
            return;
        }
        
        console.log('Admin login successful!');
        currentAdmin = user;
        
        // Show success message
        if (loginMessage) {
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.className = 'login-message success';
        }
        
        // Show admin dashboard after short delay
        setTimeout(() => {
            showAdminDashboard();
            loadDashboardData();
            initAdminEventListeners();
            showToast('Admin login successful!', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('Admin login error:', error);
        
        // Show specific error messages
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many login attempts. Please try again later.';
                break;
        }
        
        if (loginMessage) {
            loginMessage.textContent = errorMessage;
            loginMessage.className = 'login-message error';
        }
    }
}

// Admin Logout Handler
async function handleAdminLogout() {
    try {
        await auth.signOut();
        showAdminLogin();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Admin logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load products count
        const productsSnapshot = await db.collection('products').get();
        const totalProducts = productsSnapshot.size;
        document.getElementById('totalProducts').textContent = totalProducts;
        
        // Load orders count
        const ordersSnapshot = await db.collection('orders').get();
        const totalOrders = ordersSnapshot.size;
        document.getElementById('totalOrders').textContent = totalOrders;
        
        // Load users count
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        document.getElementById('totalUsers').textContent = totalUsers;
        
        // Calculate total revenue
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            totalRevenue += order.total || 0;
        });
        document.getElementById('totalRevenue').textContent = `৳${totalRevenue.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load Products
async function loadProducts() {
    const productsTableBody = document.getElementById('productsTableBody');
    if (!productsTableBody) return;
    
    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        productsTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-row">No products found</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const row = createProductRow(product);
            productsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">Error loading products</td>
            </tr>
        `;
        showToast('Error loading products', 'error');
    }
}

// Create Product Table Row
function createProductRow(product) {
    const row = document.createElement('tr');
    
    // Format date
    const createdAt = product.createdAt?.toDate ? product.createdAt.toDate() : new Date();
    const formattedDate = createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    row.innerHTML = `
        <td>
            <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" 
                 alt="${product.title}" 
                 class="product-table-image">
        </td>
        <td>${product.title || 'Untitled'}</td>
        <td>${product.category || 'Uncategorized'}</td>
        <td>৳${(product.price || 0).toFixed(2)}</td>
        <td>${product.discount || 0}%</td>
        <td>
            <span class="status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}">
                ${product.status || 'inactive'}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit-btn" data-id="${product.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${product.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners to action buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editProduct(product.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteProduct(product.id, product.title);
        });
    }
    
    return row;
}

// Load Categories
async function loadCategories() {
    const categoriesGrid = document.querySelector('.categories-grid-admin');
    if (!categoriesGrid) return;
    
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        categoriesGrid.innerHTML = '';
        
        if (snapshot.empty) {
            categoriesGrid.innerHTML = `
                <div class="loading-card">No categories found</div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const category = { id: doc.id, ...doc.data() };
            const card = createCategoryCard(category);
            categoriesGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesGrid.innerHTML = `
            <div class="loading-card">Error loading categories</div>
        `;
        showToast('Error loading categories', 'error');
    }
}

// Create Category Card
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card-admin';
    
    card.innerHTML = `
        <div class="category-icon-admin" style="background-color: ${category.color || '#f85606'}">
            <i class="${category.icon || 'fas fa-tag'}"></i>
        </div>
        <h3>${category.name}</h3>
        <p>${category.status || 'active'}</p>
        <div class="category-actions">
            <button class="action-btn edit-btn" data-id="${category.id}" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${category.id}" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to action buttons
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editCategory(category.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteCategory(category.id, category.name);
        });
    }
    
    return card;
}

// Load Orders
async function loadOrders(filter = 'all') {
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) return;
    
    try {
        let query = db.collection('orders').orderBy('createdAt', 'desc');
        
        // Apply filter if not 'all'
        if (filter !== 'all') {
            query = query.where('status', '==', filter);
        }
        
        const snapshot = await query.get();
        ordersTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-row">No orders found</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            const row = createOrderRow(order);
            ordersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row">Error loading orders</td>
            </tr>
        `;
        showToast('Error loading orders', 'error');
    }
}

// Create Order Table Row
function createOrderRow(order) {
    const row = document.createElement('tr');
    
    // Format date
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    row.innerHTML = `
        <td>${order.orderId || order.id}</td>
        <td>${order.userName || 'Customer'}</td>
        <td>${formattedDate}</td>
        <td>৳${(order.total || 0).toFixed(2)}</td>
        <td>
            <span class="status-badge status-${order.status || 'pending'}">
                ${order.status || 'pending'}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="action-btn view-btn" data-id="${order.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <select class="status-select" data-id="${order.id}" data-current="${order.status}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </div>
        </td>
    `;
    
    // Add event listeners
    const viewBtn = row.querySelector('.view-btn');
    const statusSelect = row.querySelector('.status-select');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            viewOrderDetails(order.id);
        });
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            updateOrderStatus(order.id, e.target.value);
        });
    }
    
    return row;
}

// Load Banners
async function loadBanners() {
    const bannersGrid = document.querySelector('.banners-grid');
    if (!bannersGrid) return;
    
    try {
        const snapshot = await db.collection('banners').orderBy('createdAt', 'desc').get();
        bannersGrid.innerHTML = '';
        
        if (snapshot.empty) {
            bannersGrid.innerHTML = `
                <div class="loading-card">No banners found</div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const banner = { id: doc.id, ...doc.data() };
            const card = createBannerCard(banner);
            bannersGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading banners:', error);
        bannersGrid.innerHTML = `
            <div class="loading-card">Error loading banners</div>
        `;
        showToast('Error loading banners', 'error');
    }
}

// Create Banner Card
function createBannerCard(banner) {
    const card = document.createElement('div');
    card.className = 'banner-card';
    
    card.innerHTML = `
        <img src="${banner.imageUrl}" alt="${banner.title || 'Banner'}" class="banner-image">
        <div class="banner-info">
            <div class="banner-title">${banner.title || 'Untitled Banner'}</div>
            <p>Status: ${banner.status || 'active'}</p>
            <div class="banner-actions">
                <button class="action-btn edit-btn" data-id="${banner.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${banner.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners to action buttons
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editBanner(banner.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteBanner(banner.id, banner.title);
        });
    }
    
    return card;
}

// Load Users
async function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;
    
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        usersTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-row">No users found</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            const row = createUserRow(user);
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-row">Error loading users</td>
            </tr>
        `;
        showToast('Error loading users', 'error');
    }
}

// Create User Table Row
function createUserRow(user) {
    const row = document.createElement('tr');
    
    // Format date
    const joinedDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
    const formattedDate = joinedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    row.innerHTML = `
        <td>${user.name || 'No Name'}</td>
        <td>${user.email}</td>
        <td>
            <span class="status-badge ${user.role === 'admin' ? 'status-approved' : 'status-pending'}">
                ${user.role || 'user'}
            </span>
        </td>
        <td>${formattedDate}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn delete-btn" data-id="${user.id}" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listener to delete button
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteUser(user.id, user.name);
        });
    }
    
    return row;
}

// Product Modal Functions
function showProductModal(product = null) {
    const modalTitle = document.getElementById('productModalTitle');
    const productForm = document.getElementById('productForm');
    const imagePreview = document.getElementById('imagePreview');
    
    // Reset form
    productForm.reset();
    imagePreview.innerHTML = '<p>Image preview will appear here</p>';
    
    // Load categories for dropdown
    loadCategoryDropdown();
    
    if (product) {
        // Edit mode
        isEditingProduct = true;
        currentEditId = product.id;
        modalTitle.textContent = 'Edit Product';
        
        // Fill form with product data
        document.getElementById('productName').value = product.title || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDiscount').value = product.discount || 0;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productStatus').value = product.status || 'active';
        
        // Set category if exists
        setTimeout(() => {
            const categorySelect = document.getElementById('productCategory');
            if (categorySelect && product.category) {
                categorySelect.value = product.category;
            }
        }, 100);
        
        // Show image preview
        if (product.imageUrl) {
            imagePreview.innerHTML = `<img src="${product.imageUrl}" alt="Preview">`;
        }
    } else {
        // Add mode
        isEditingProduct = false;
        currentEditId = null;
        modalTitle.textContent = 'Add New Product';
    }
    
    showModal(adminProductModal);
}

async function loadCategoryDropdown() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    try {
        const snapshot = await db.collection('categories').where('status', '==', 'active').get();
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        snapshot.forEach(doc => {
            const category = doc.data();
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories dropdown:', error);
    }
}

// Category Modal Functions
function showCategoryModal(category = null) {
    const modalTitle = document.getElementById('categoryModalTitle');
    const categoryForm = document.getElementById('categoryForm');
    
    // Reset form
    categoryForm.reset();
    
    if (category) {
        // Edit mode
        isEditingCategory = true;
        currentEditId = category.id;
        modalTitle.textContent = 'Edit Category';
        
        // Fill form with category data
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryIcon').value = category.icon || 'fas fa-tag';
        document.getElementById('categoryColor').value = category.color || '#f85606';
        document.getElementById('categoryStatus').value = category.status || 'active';
    } else {
        // Add mode
        isEditingCategory = false;
        currentEditId = null;
        modalTitle.textContent = 'Add New Category';
        document.getElementById('categoryColor').value = '#f85606';
    }
    
    showModal(adminCategoryModal);
}

// Banner Modal Functions
function showBannerModal(banner = null) {
    const modalTitle = document.getElementById('bannerModalTitle');
    const bannerForm = document.getElementById('bannerForm');
    const bannerPreview = document.getElementById('bannerPreview');
    
    // Reset form
    bannerForm.reset();
    bannerPreview.innerHTML = '<p>Banner preview will appear here</p>';
    
    if (banner) {
        // Edit mode
        isEditingBanner = true;
        currentEditId = banner.id;
        modalTitle.textContent = 'Edit Banner';
        
        // Fill form with banner data
        document.getElementById('bannerTitle').value = banner.title || '';
        document.getElementById('bannerStatus').value = banner.status || 'active';
        
        // Show image preview
        if (banner.imageUrl) {
            bannerPreview.innerHTML = `<img src="${banner.imageUrl}" alt="Preview">`;
        }
    } else {
        // Add mode
        isEditingBanner = false;
        currentEditId = null;
        modalTitle.textContent = 'Add New Banner';
    }
    
    showModal(adminBannerModal);
}

// Form Submission Handlers
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveProductBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const productData = {
            title: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            discount: parseInt(document.getElementById('productDiscount').value) || 0,
            description: document.getElementById('productDescription').value,
            status: document.getElementById('productStatus').value,
            updatedAt: new Date()
        };
        
        // Calculate discounted price
        productData.discountedPrice = productData.price - (productData.price * productData.discount / 100);
        
        // Add default values
        productData.rating = 4.5;
        productData.reviewCount = 0;
        
        // Handle image upload
        const imageFile = document.getElementById('productImage').files[0];
        
        if (imageFile) {
            // Upload image to Firebase Storage
            const imageUrl = await uploadImage(imageFile, 'products');
            productData.imageUrl = imageUrl;
        } else if (isEditingProduct && !imageFile) {
            // Keep existing image if editing and no new image
            // We'll handle this in the update logic
        } else {
            throw new Error('Product image is required');
        }
        
        if (isEditingProduct && currentEditId) {
            // Update existing product
            await db.collection('products').doc(currentEditId).update(productData);
            showToast('Product updated successfully!', 'success');
        } else {
            // Add new product
            productData.createdAt = new Date();
            await db.collection('products').add(productData);
            showToast('Product added successfully!', 'success');
        }
        
        // Close modal and refresh products
        hideModal(adminProductModal);
        loadProducts();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveCategoryBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const categoryData = {
            name: document.getElementById('categoryName').value,
            icon: document.getElementById('categoryIcon').value,
            color: document.getElementById('categoryColor').value,
            status: document.getElementById('categoryStatus').value,
            updatedAt: new Date()
        };
        
        if (isEditingCategory && currentEditId) {
            // Update existing category
            await db.collection('categories').doc(currentEditId).update(categoryData);
            showToast('Category updated successfully!', 'success');
        } else {
            // Add new category
            categoryData.createdAt = new Date();
            await db.collection('categories').add(categoryData);
            showToast('Category added successfully!', 'success');
        }
        
        // Close modal and refresh categories
        hideModal(adminCategoryModal);
        loadCategories();
        loadCategoryDropdown(); // Refresh dropdown in product modal
        
    } catch (error) {
        console.error('Error saving category:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Category';
    }
}

async function handleBannerSubmit(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveBannerBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const bannerData = {
            title: document.getElementById('bannerTitle').value || 'Banner',
            status: document.getElementById('bannerStatus').value,
            updatedAt: new Date()
        };
        
        // Handle image upload
        const imageFile = document.getElementById('bannerImage').files[0];
        
        if (imageFile) {
            // Upload image to Firebase Storage
            const imageUrl = await uploadImage(imageFile, 'banners');
            bannerData.imageUrl = imageUrl;
        } else if (isEditingBanner && !imageFile) {
            // Keep existing image if editing and no new image
            // We'll handle this in the update logic
        } else {
            throw new Error('Banner image is required');
        }
        
        if (isEditingBanner && currentEditId) {
            // Update existing banner
            await db.collection('banners').doc(currentEditId).update(bannerData);
            showToast('Banner updated successfully!', 'success');
        } else {
            // Add new banner
            bannerData.createdAt = new Date();
            await db.collection('banners').add(bannerData);
            showToast('Banner added successfully!', 'success');
        }
        
        // Close modal and refresh banners
        hideModal(adminBannerModal);
        loadBanners();
        
    } catch (error) {
        console.error('Error saving banner:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Banner';
    }
}

// Edit Functions
async function editProduct(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (doc.exists) {
            const product = { id: doc.id, ...doc.data() };
            showProductModal(product);
        } else {
            showToast('Product not found', 'error');
        }
    } catch (error) {
        console.error('Error loading product for edit:', error);
        showToast('Error loading product', 'error');
    }
}

async function editCategory(categoryId) {
    try {
        const doc = await db.collection('categories').doc(categoryId).get();
        if (doc.exists) {
            const category = { id: doc.id, ...doc.data() };
            showCategoryModal(category);
        } else {
            showToast('Category not found', 'error');
        }
    } catch (error) {
        console.error('Error loading category for edit:', error);
        showToast('Error loading category', 'error');
    }
}

async function editBanner(bannerId) {
    try {
        const doc = await db.collection('banners').doc(bannerId).get();
        if (doc.exists) {
            const banner = { id: doc.id, ...doc.data() };
            showBannerModal(banner);
        } else {
            showToast('Banner not found', 'error');
        }
    } catch (error) {
        console.error('Error loading banner for edit:', error);
        showToast('Error loading banner', 'error');
    }
}

// Delete Functions
async function deleteProduct(productId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
        try {
            await db.collection('products').doc(productId).delete();
            showToast('Product deleted successfully', 'success');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Error deleting product', 'error');
        }
    }
}

async function deleteCategory(categoryId, categoryName) {
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        try {
            await db.collection('categories').doc(categoryId).delete();
            showToast('Category deleted successfully', 'success');
            loadCategories();
            loadCategoryDropdown();
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Error deleting category', 'error');
        }
    }
}

async function deleteBanner(bannerId, bannerTitle) {
    if (confirm(`Are you sure you want to delete "${bannerTitle}"?`)) {
        try {
            await db.collection('banners').doc(bannerId).delete();
            showToast('Banner deleted successfully', 'success');
            loadBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            showToast('Error deleting banner', 'error');
        }
    }
}

async function deleteUser(userId, userName) {
    if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
        try {
            await db.collection('users').doc(userId).delete();
            showToast('User deleted successfully', 'success');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Error deleting user', 'error');
        }
    }
}

// Order Functions
async function viewOrderDetails(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (doc.exists) {
            const order = doc.data();
            
            let orderDetails = `Order ID: ${order.orderId}\n`;
            orderDetails += `Customer: ${order.userName}\n`;
            orderDetails += `Phone: ${order.userPhone}\n`;
            orderDetails += `Address: ${order.userAddress}\n`;
            orderDetails += `Payment: ${order.paymentMethod}\n`;
            orderDetails += `Status: ${order.status}\n`;
            orderDetails += `Total: ৳${order.total.toFixed(2)}\n\n`;
            orderDetails += 'Items:\n';
            
            order.items.forEach(item => {
                orderDetails += `- ${item.title} x ${item.quantity}: ৳${(item.price * item.quantity).toFixed(2)}\n`;
            });
            
            alert(orderDetails);
        } else {
            showToast('Order not found', 'error');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Error loading order details', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: new Date()
        });
        showToast('Order status updated successfully', 'success');
        loadOrders(document.getElementById('orderFilter').value);
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'error');
    }
}

// Image Upload Function
async function uploadImage(file, folder) {
    return new Promise((resolve, reject) => {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`${folder}/${Date.now()}_${file.name}`);
        
        const uploadTask = fileRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress monitoring can be added here
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
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

// Image Preview Function
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '<p>Image preview will appear here</p>';
    }
}

// Modal Functions
function showModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form states
        isEditingProduct = false;
        isEditingCategory = false;
        isEditingBanner = false;
        currentEditId = null;
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    adminToastMessage.textContent = message;
    adminToast.className = 'admin-toast';
    adminToast.classList.add('show');
    
    // Add type-based styling
    if (type === 'success') {
        adminToast.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        adminToast.style.backgroundColor = '#e74c3c';
    } else if (type === 'warning') {
        adminToast.style.backgroundColor = '#f39c12';
    } else {
        adminToast.style.backgroundColor = '#3498db';
    }
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        adminToast.classList.remove('show');
    }, 3000);
}

// Auth Error Messages (reused from main app)
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/user-disabled':
            return 'User account is disabled';
        case 'auth/user-not-found':
            return 'User not found';
        case 'auth/wrong-password':
            return 'Incorrect password';
        default:
            return error.message;
    }
}
