// Admin Panel Application
document.addEventListener('DOMContentLoaded', function() {
    // Admin State
    const state = {
        adminUser: null,
        currentSection: 'dashboard',
        products: [],
        orders: [],
        users: [],
        categories: [],
        notifications: [],
        dashboardStats: {
            totalOrders: 0,
            totalRevenue: 0,
            totalUsers: 0,
            totalProducts: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0
        }
    };

    // DOM Elements
    const elements = {
        // Login
        adminLoginModal: document.getElementById('adminLoginModal'),
        adminLoginForm: document.getElementById('adminLoginForm'),
        adminLoginMessage: document.getElementById('adminLoginMessage'),
        
        // Main Container
        adminContainer: document.getElementById('adminContainer'),
        
        // Admin Info
        adminName: document.getElementById('adminName'),
        adminEmailDisplay: document.getElementById('adminEmailDisplay'),
        
        // Navigation
        navItems: document.querySelectorAll('.nav-item'),
        currentSection: document.getElementById('currentSection'),
        
        // Sections
        sections: document.querySelectorAll('.content-section'),
        
        // Dashboard
        totalOrders: document.getElementById('totalOrders'),
        totalRevenue: document.getElementById('totalRevenue'),
        totalUsers: document.getElementById('totalUsers'),
        totalProducts: document.getElementById('totalProducts'),
        ordersChange: document.getElementById('ordersChange'),
        revenueChange: document.getElementById('revenueChange'),
        usersChange: document.getElementById('usersChange'),
        productsChange: document.getElementById('productsChange'),
        recentOrdersTable: document.getElementById('recentOrdersTable'),
        topProductsList: document.getElementById('topProductsList'),
        activityLog: document.getElementById('activityLog'),
        
        // Products
        productsTable: document.getElementById('productsTable'),
        productsCount: document.getElementById('productsCount'),
        addProductBtn: document.getElementById('addProductBtn'),
        productModal: document.getElementById('productModal'),
        productForm: document.getElementById('productForm'),
        
        // Orders
        ordersTable: document.getElementById('ordersTable'),
        ordersCount: document.getElementById('ordersCount'),
        pendingOrders: document.getElementById('pendingOrders'),
        processingOrders: document.getElementById('processingOrders'),
        shippedOrders: document.getElementById('shippedOrders'),
        deliveredOrders: document.getElementById('deliveredOrders'),
        cancelledOrders: document.getElementById('cancelledOrders'),
        
        // Categories
        categoriesList: document.getElementById('categoriesList'),
        addCategoryBtn: document.getElementById('addCategoryBtn'),
        categoryForm: document.getElementById('categoryForm'),
        
        // Users
        usersTable: document.getElementById('usersTable'),
        usersCount: document.getElementById('usersCount'),
        
        // Analytics
        salesChart: document.getElementById('salesChart'),
        trafficChart: document.getElementById('trafficChart'),
        productPerformance: document.getElementById('productPerformance'),
        newCustomers: document.getElementById('newCustomers'),
        avgOrderValue: document.getElementById('avgOrderValue'),
        repeatCustomers: document.getElementById('repeatCustomers'),
        topLocation: document.getElementById('topLocation'),
        
        // Settings
        settingsItems: document.querySelectorAll('.settings-item'),
        settingsTabs: document.querySelectorAll('.settings-tab'),
        
        // Common
        logoutBtn: document.getElementById('logoutBtn'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        currentDate: document.getElementById('currentDate'),
        notificationCount: document.getElementById('notificationCount'),
        quickAddBtn: document.getElementById('quickAddBtn'),
        quickAddModal: document.getElementById('quickAddModal'),
        
        // Close buttons
        closeModalBtns: document.querySelectorAll('.close-modal')
    };

    // Initialize the admin panel
    function init() {
        // Check if admin is logged in
        checkAdminAuth();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize date
        updateCurrentDate();
        
        // Load initial data
        if (state.adminUser) {
            loadInitialData();
        }
    }

    // Authentication functions
    function checkAdminAuth() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // Check if user is admin
                checkAdminRole(user.uid).then(isAdmin => {
                    if (isAdmin) {
                        state.adminUser = user;
                        showAdminPanel();
                    } else {
                        showLoginModal();
                        showAuthMessage('Access denied. Admin privileges required.', 'error');
                    }
                });
            } else {
                showLoginModal();
            }
        });
    }

    function checkAdminRole(userId) {
        return database.ref(`admins/${userId}`).once('value')
            .then(snapshot => {
                return snapshot.exists() && snapshot.val().role === 'admin';
            })
            .catch(error => {
                console.error('Error checking admin role:', error);
                return false;
            });
    }

    function loginAdmin(email, password) {
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                return checkAdminRole(userCredential.user.uid);
            })
            .then(isAdmin => {
                if (isAdmin) {
                    showAuthMessage('Login successful!', 'success');
                    setTimeout(() => {
                        elements.adminLoginModal.classList.remove('active');
                        location.reload();
                    }, 1500);
                } else {
                    auth.signOut();
                    showAuthMessage('Access denied. Admin privileges required.', 'error');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showAuthMessage(getAuthErrorMessage(error.code), 'error');
            });
    }

    function logoutAdmin() {
        auth.signOut()
            .then(() => {
                showLoginModal();
                showAuthMessage('Logged out successfully', 'success');
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
    }

    function showAdminPanel() {
        elements.adminContainer.style.display = 'flex';
        elements.adminLoginModal.classList.remove('active');
        
        // Update admin info
        elements.adminName.textContent = state.adminUser.displayName || 'Administrator';
        elements.adminEmailDisplay.textContent = state.adminUser.email;
        
        // Load dashboard data
        loadDashboardData();
    }

    function showLoginModal() {
        elements.adminLoginModal.classList.add('active');
        elements.adminContainer.style.display = 'none';
    }

    // Data loading functions
    function loadInitialData() {
        loadProducts();
        loadOrders();
        loadUsers();
        loadCategories();
        loadNotifications();
    }

    function loadDashboardData() {
        // Load orders for stats
        database.ref('orders').once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const orders = [];
                    snapshot.forEach(childSnapshot => {
                        orders.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    // Calculate stats
                    calculateOrderStats(orders);
                    loadRecentOrders(orders);
                }
            })
            .catch(error => {
                console.error('Error loading orders:', error);
            });
        
        // Load products for stats
        database.ref('products').once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const products = [];
                    snapshot.forEach(childSnapshot => {
                        products.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    state.products = products;
                    elements.totalProducts.textContent = products.length;
                    elements.productsCount.textContent = products.length;
                    
                    loadTopProducts(products);
                }
            })
            .catch(error => {
                console.error('Error loading products:', error);
            });
        
        // Load users for stats
        database.ref('users').once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const users = [];
                    snapshot.forEach(childSnapshot => {
                        users.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    state.users = users;
                    elements.totalUsers.textContent = users.length;
                    elements.usersCount.textContent = users.length;
                }
            })
            .catch(error => {
                console.error('Error loading users:', error);
            });
        
        // Load activity log
        loadActivityLog();
        
        // Initialize charts
        initializeCharts();
    }

    function calculateOrderStats(orders) {
        let totalOrders = 0;
        let totalRevenue = 0;
        let pending = 0;
        let processing = 0;
        let shipped = 0;
        let delivered = 0;
        let cancelled = 0;
        
        orders.forEach(order => {
            totalOrders++;
            totalRevenue += parseFloat(order.total) || 0;
            
            switch (order.status) {
                case 'pending':
                    pending++;
                    break;
                case 'processing':
                    processing++;
                    break;
                case 'shipped':
                    shipped++;
                    break;
                case 'delivered':
                    delivered++;
                    break;
                case 'cancelled':
                    cancelled++;
                    break;
            }
        });
        
        // Update state
        state.dashboardStats = {
            totalOrders,
            totalRevenue,
            totalUsers: state.users.length,
            totalProducts: state.products.length,
            pendingOrders: pending,
            processingOrders: processing,
            shippedOrders: shipped,
            deliveredOrders: delivered,
            cancelledOrders: cancelled
        };
        
        // Update UI
        updateDashboardStats();
    }

    function updateDashboardStats() {
        const stats = state.dashboardStats;
        
        elements.totalOrders.textContent = stats.totalOrders;
        elements.totalRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;
        elements.totalUsers.textContent = stats.totalUsers;
        elements.totalProducts.textContent = stats.totalProducts;
        
        elements.pendingOrders.textContent = stats.pendingOrders;
        elements.processingOrders.textContent = stats.processingOrders;
        elements.shippedOrders.textContent = stats.shippedOrders;
        elements.deliveredOrders.textContent = stats.deliveredOrders;
        elements.cancelledOrders.textContent = stats.cancelledOrders;
        
        elements.ordersCount.textContent = stats.totalOrders;
    }

    function loadRecentOrders(orders) {
        // Sort by date (newest first) and take first 5
        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        elements.recentOrdersTable.innerHTML = '';
        
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.userName || 'Guest'}</td>
                <td>$${parseFloat(order.total).toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            `;
            elements.recentOrdersTable.appendChild(row);
        });
    }

    function loadTopProducts(products) {
        // Sort by sales (for demo, we'll use random numbers)
        const topProducts = [...products]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
            .map(product => ({
                ...product,
                sales: Math.floor(Math.random() * 100) + 20
            }));
        
        elements.topProductsList.innerHTML = '';
        
        topProducts.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'top-product-item';
            item.innerHTML = `
                <div class="product-thumb">
                    <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.category}</p>
                </div>
                <div class="product-sales">${product.sales} sold</div>
            `;
            elements.topProductsList.appendChild(item);
        });
    }

    function loadActivityLog() {
        // For demo, create some sample activities
        const activities = [
            {
                icon: 'fas fa-shopping-cart',
                title: 'New order placed',
                description: 'Order #ORD12345 by John Doe',
                time: '5 minutes ago'
            },
            {
                icon: 'fas fa-user-plus',
                title: 'New user registered',
                description: 'Jane Smith joined the platform',
                time: '1 hour ago'
            },
            {
                icon: 'fas fa-box',
                title: 'Product added',
                description: 'New product "Wireless Headphones" added',
                time: '2 hours ago'
            },
            {
                icon: 'fas fa-chart-line',
                title: 'Sales target achieved',
                description: 'Monthly sales target exceeded by 15%',
                time: '1 day ago'
            },
            {
                icon: 'fas fa-cog',
                title: 'System update',
                description: 'Admin panel updated to v2.0',
                time: '2 days ago'
            }
        ];
        
        elements.activityLog.innerHTML = '';
        
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `;
            elements.activityLog.appendChild(item);
        });
    }

    // Product Management
    function loadProducts() {
        database.ref('products').on('value', snapshot => {
            if (snapshot.exists()) {
                state.products = [];
                snapshot.forEach(childSnapshot => {
                    state.products.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                renderProductsTable();
            } else {
                state.products = [];
                renderProductsTable();
            }
        });
    }

    function renderProductsTable() {
        elements.productsTable.innerHTML = '';
        
        if (state.products.length === 0) {
            elements.productsTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-box" style="font-size: 48px; color: #ddd; margin-bottom: 20px;"></i>
                        <p>No products found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        state.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id.substring(0, 8)}...</td>
                <td>
                    <div style="width: 50px; height: 50px; border-radius: 4px; overflow: hidden;">
                        <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                </td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge status-${product.status === 'active' ? 'delivered' : product.status === 'out_of_stock' ? 'cancelled' : 'pending'}">
                        ${product.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" data-id="${product.id}" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" data-id="${product.id}" data-action="edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${product.id}" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            elements.productsTable.appendChild(row);
        });
        
        // Add event listeners for action buttons
        document.querySelectorAll('.btn-action[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-action[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    function addProduct(productData) {
        const productRef = database.ref('products').push();
        return productRef.set({
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    function updateProduct(productId, productData) {
        return database.ref(`products/${productId}`).update({
            ...productData,
            updatedAt: new Date().toISOString()
        });
    }

    function deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            database.ref(`products/${productId}`).remove()
                .then(() => {
                    showNotification('Product deleted successfully');
                })
                .catch(error => {
                    console.error('Error deleting product:', error);
                    showNotification('Error deleting product', 'error');
                });
        }
    }

    function editProduct(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        
        // Populate form
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productOriginalPrice').value = product.originalPrice || '';
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productImages').value = product.images ? product.images.join('\n') : '';
        document.getElementById('productAffiliateLink').value = product.affiliateLink || '';
        document.getElementById('productStatus').value = product.status || 'active';
        
        // Update modal title
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        
        // Show modal
        elements.productModal.classList.add('active');
    }

    // Order Management
    function loadOrders() {
        database.ref('orders').on('value', snapshot => {
            if (snapshot.exists()) {
                state.orders = [];
                snapshot.forEach(childSnapshot => {
                    state.orders.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                renderOrdersTable();
                calculateOrderStats(state.orders);
            } else {
                state.orders = [];
                renderOrdersTable();
            }
        });
    }

    function renderOrdersTable() {
        elements.ordersTable.innerHTML = '';
        
        if (state.orders.length === 0) {
            elements.ordersTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ddd; margin-bottom: 20px;"></i>
                        <p>No orders found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        state.orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.userName || 'Guest'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>$${parseFloat(order.total).toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" data-id="${order.id}" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action status" data-id="${order.id}" data-action="status">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            elements.ordersTable.appendChild(row);
        });
        
        // Add event listeners for action buttons
        document.querySelectorAll('.btn-action[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', () => viewOrderDetails(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-action[data-action="status"]').forEach(btn => {
            btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id));
        });
    }

    function viewOrderDetails(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const modalContent = document.getElementById('orderDetailsContent');
        modalContent.innerHTML = `
            <div class="order-info-grid">
                <div class="info-group">
                    <h4>Order ID</h4>
                    <p>${order.id}</p>
                </div>
                <div class="info-group">
                    <h4>Customer Name</h4>
                    <p>${order.userName || 'Guest'}</p>
                </div>
                <div class="info-group">
                    <h4>Email</h4>
                    <p>${order.userEmail || 'N/A'}</p>
                </div>
                <div class="info-group">
                    <h4>Phone</h4>
                    <p>${order.userPhone || 'N/A'}</p>
                </div>
                <div class="info-group">
                    <h4>Order Date</h4>
                    <p>${new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div class="info-group">
                    <h4>Status</h4>
                    <p><span class="status-badge status-${order.status}">${order.status}</span></p>
                </div>
            </div>
            
            <div class="order-items">
                <div class="order-items-header">Order Items</div>
                ${order.products.map(product => `
                    <div class="order-item">
                        <div class="item-image">
                            <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}">
                        </div>
                        <div class="item-name">${product.name}</div>
                        <div class="item-quantity">Qty: ${product.quantity}</div>
                        <div class="item-price">$${parseFloat(product.price).toFixed(2)}</div>
                        <div class="item-total">$${(parseFloat(product.price) * product.quantity).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${parseFloat(order.total).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>$5.99</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${(parseFloat(order.total) + 5.99).toFixed(2)}</span>
                </div>
            </div>
            
            <div class="shipping-address">
                <h4>Shipping Address</h4>
                <p>${order.shippingAddress || 'N/A'}</p>
            </div>
            
            ${order.orderNotes ? `
                <div class="order-notes">
                    <h4>Order Notes</h4>
                    <p>${order.orderNotes}</p>
                </div>
            ` : ''}
        `;
        
        // Update modal title
        document.getElementById('orderDetailsTitle').textContent = `Order #${order.id.substring(0, 8)}...`;
        
        // Show modal
        document.getElementById('orderDetailsModal').classList.add('active');
    }

    function updateOrderStatus(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const currentIndex = statuses.indexOf(order.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];
        
        database.ref(`orders/${orderId}/status`).set(newStatus)
            .then(() => {
                showNotification(`Order status updated to ${newStatus}`);
            })
            .catch(error => {
                console.error('Error updating order status:', error);
                showNotification('Error updating order status', 'error');
            });
    }

    // User Management
    function loadUsers() {
        database.ref('users').on('value', snapshot => {
            if (snapshot.exists()) {
                state.users = [];
                snapshot.forEach(childSnapshot => {
                    state.users.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                renderUsersTable();
            } else {
                state.users = [];
                renderUsersTable();
            }
        });
    }

    function renderUsersTable() {
        elements.usersTable.innerHTML = '';
        
        if (state.users.length === 0) {
            elements.usersTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 48px; color: #ddd; margin-bottom: 20px;"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        state.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.displayName || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.role || 'customer'}</td>
                <td>
                    <span class="status-badge ${user.status === 'active' ? 'status-delivered' : 'status-cancelled'}">
                        ${user.status || 'active'}
                    </span>
                </td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" data-id="${user.id}" data-action="edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${user.id}" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            elements.usersTable.appendChild(row);
        });
    }

    // Category Management
    function loadCategories() {
        // For demo, create some default categories
        const defaultCategories = [
            {
                id: 'electronics',
                name: 'Electronics',
                slug: 'electronics',
                description: 'Electronic devices and gadgets',
                image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                status: 'active',
                productCount: 12
            },
            {
                id: 'health-beauty',
                name: 'Health & Beauty',
                slug: 'health-beauty',
                description: 'Health and beauty products',
                image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                status: 'active',
                productCount: 8
            },
            {
                id: 'fashion',
                name: 'Fashion',
                slug: 'fashion',
                description: 'Clothing and fashion accessories',
                image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                status: 'active',
                productCount: 15
            },
            {
                id: 'sex-toy',
                name: 'Sex Toy',
                slug: 'sex-toy',
                description: 'Adult toys and products',
                image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                status: 'active',
                productCount: 6
            },
            {
                id: 'others',
                name: 'Others',
                slug: 'others',
                description: 'Other miscellaneous products',
                image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                status: 'active',
                productCount: 5
            }
        ];
        
        state.categories = defaultCategories;
        renderCategoriesList();
    }

    function renderCategoriesList() {
        elements.categoriesList.innerHTML = '';
        
        state.categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <div class="category-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="category-info">
                    <h4>${category.name}</h4>
                    <p>${category.description}</p>
                    <span class="category-status ${category.status}">${category.status}</span>
                    <span style="font-size: 11px; color: #666; margin-left: 10px;">${category.productCount} products</span>
                </div>
                <div class="category-actions">
                    <button class="btn-action edit" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
            elements.categoriesList.appendChild(item);
        });
    }

    // Notification functions
    function loadNotifications() {
        // For demo, create some sample notifications
        state.notifications = [
            { id: 1, title: 'New order received', message: 'Order #ORD12345 needs attention', read: false },
            { id: 2, title: 'Low stock alert', message: 'Product "Wireless Headphones" is low in stock', read: false },
            { id: 3, title: 'System update', message: 'New admin panel features available', read: true }
        ];
        
        updateNotificationCount();
    }

    function updateNotificationCount() {
        const unreadCount = state.notifications.filter(n => !n.read).length;
        elements.notificationCount.textContent = unreadCount;
    }

    // Chart functions
    function initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#4a6cf7',
                    backgroundColor: 'rgba(74, 108, 247, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Sales Chart (for analytics)
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Sales',
                    data: [4500, 5200, 4800, 6100],
                    backgroundColor: '#4a6cf7',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Traffic Chart
        const trafficCtx = document.getElementById('trafficChart').getContext('2d');
        new Chart(trafficCtx, {
            type: 'doughnut',
            data: {
                labels: ['Direct', 'Social', 'Search', 'Email'],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: [
                        '#4a6cf7',
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Utility functions
    function updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        elements.currentDate.textContent = now.toLocaleDateString('en-US', options);
    }

    function switchSection(sectionId) {
        // Update navigation
        elements.navItems.forEach(item => {
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update current section indicator
        const sectionName = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        elements.currentSection.textContent = sectionName;
        
        // Show/hide sections
        elements.sections.forEach(section => {
            if (section.id === `${sectionId}Section`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // Update state
        state.currentSection = sectionId;
    }

    function switchSettingsTab(tabId) {
        // Update navigation
        elements.settingsItems.forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Show/hide tabs
        elements.settingsTabs.forEach(tab => {
            if (tab.id === `${tabId}Tab`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;
        
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function showAuthMessage(message, type) {
        elements.adminLoginMessage.textContent = message;
        elements.adminLoginMessage.className = `auth-message ${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            elements.adminLoginMessage.textContent = '';
            elements.adminLoginMessage.className = 'auth-message';
        }, 5000);
    }

    function getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'User not found. Please check your email.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Login form
        elements.adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            loginAdmin(email, password);
        });
        
        // Logout
        elements.logoutBtn.addEventListener('click', logoutAdmin);
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                switchSection(item.dataset.section);
            });
        });
        
        // View all links
        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    switchSection(section);
                }
            });
        });
        
        // Sidebar toggle
        elements.sidebarToggle.addEventListener('click', () => {
            document.querySelector('.admin-sidebar').classList.toggle('active');
        });
        
        // Quick add button
        elements.quickAddBtn.addEventListener('click', () => {
            elements.quickAddModal.classList.add('active');
        });
        
        // Quick add options
        document.querySelectorAll('.quick-add-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                elements.quickAddModal.classList.remove('active');
                
                switch(type) {
                    case 'product':
                        document.getElementById('productModalTitle').textContent = 'Add New Product';
                        elements.productModal.classList.add('active');
                        break;
                    case 'category':
                        switchSection('categories');
                        break;
                    case 'user':
                        switchSection('users');
                        break;
                    case 'order':
                        switchSection('orders');
                        break;
                }
            });
        });
        
        // Add product button
        elements.addProductBtn.addEventListener('click', () => {
            document.getElementById('productModalTitle').textContent = 'Add New Product';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            elements.productModal.classList.add('active');
        });
        
        // Product form submission
        elements.productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productId = document.getElementById('productId').value;
            const productData = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                originalPrice: document.getElementById('productOriginalPrice').value ? 
                    parseFloat(document.getElementById('productOriginalPrice').value) : null,
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDescription').value,
                images: document.getElementById('productImages').value.split('\n').filter(url => url.trim()),
                affiliateLink: document.getElementById('productAffiliateLink').value,
                status: document.getElementById('productStatus').value
            };
            
            // For demo, add a default image if none provided
            if (!productData.images.length) {
                productData.image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
            } else {
                productData.image = productData.images[0];
            }
            
            let promise;
            if (productId) {
                promise = updateProduct(productId, productData);
            } else {
                promise = addProduct(productData);
            }
            
            promise.then(() => {
                showNotification(`Product ${productId ? 'updated' : 'added'} successfully`);
                elements.productModal.classList.remove('active');
                elements.productForm.reset();
            }).catch(error => {
                console.error('Error saving product:', error);
                showNotification('Error saving product', 'error');
            });
        });
        
        // Add category button
        elements.addCategoryBtn.addEventListener('click', () => {
            document.getElementById('categoryFormTitle').textContent = 'Add New Category';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryId').value = '';
        });
        
        // Category form submission
        elements.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const categoryData = {
                name: document.getElementById('categoryName').value,
                slug: document.getElementById('categorySlug').value,
                description: document.getElementById('categoryDescription').value,
                image: document.getElementById('categoryImage').value,
                status: document.getElementById('categoryStatus').value
            };
            
            showNotification('Category saved successfully');
            elements.categoryForm.reset();
        });
        
        // Settings tabs
        elements.settingsItems.forEach(item => {
            item.addEventListener('click', () => {
                switchSettingsTab(item.dataset.tab);
            });
        });
        
        // Close modals
        elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
        
        // Refresh revenue chart
        document.getElementById('refreshRevenue').addEventListener('click', () => {
            showNotification('Chart refreshed');
        });
    }

    // Initialize the application
    init();
});
