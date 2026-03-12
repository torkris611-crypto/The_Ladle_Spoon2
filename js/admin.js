// Глобальные переменные
let currentSection = 'dashboard';
let currentCategory = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboard();
    loadMenuCategories();
    loadRecentOrders();
    setupCharts();
});

// Проверка авторизации
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.id !== 111946301) { // ID Антона
        window.location.href = 'index.html';
    }
}

// Переключение разделов
function showSection(sectionId) {
    // Обновляем навигацию
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Показываем раздел
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    currentSection = sectionId;
    
    // Загружаем данные для раздела
    switch(sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'menu': loadMenuCategories(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;
        case 'reviews': loadReviews(); break;
        case 'blacklist': loadBlacklist(); break;
        case 'settings': loadSettings(); break;
        case 'backups': loadBackups(); break;
    }
}

// Загрузка дашборда
function loadDashboard() {
    fetch('data/orders.json')
        .then(res => res.json())
        .then(data => {
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = data.orders.filter(o => 
                o.created_at.startsWith(today) && 
                o.status !== 'cancelled'
            );
            
            // Обновляем статистику
            document.querySelector('.stat-number').textContent = todayOrders.length;
            
            // Загружаем последние заказы
            const recentOrders = data.orders.slice(-5).reverse();
            displayRecentOrders(recentOrders);
        });
}

// Отображение последних заказов
function displayRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.order_number}</td>
            <td>${order.user_name}</td>
            <td>${order.total_amount} ₽</td>
            <td>${new Date(order.created_at).toLocaleTimeString()}</td>
            <td><span class="status-badge status-${order.status}">${getStatusName(order.status)}</span></td>
            <td>
                <button onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

// Настройка графиков
function setupCharts() {
    // График заказов
    const ordersCtx = document.getElementById('ordersChart').getContext('2d');
    new Chart(ordersCtx, {
        type: 'line',
        data: {
            labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
            datasets: [{
                label: 'Заказы',
                data: [5, 8, 12, 25, 30, 18, 10],
                borderColor: '#ff6b35',
                tension: 0.4
            }]
        }
    });
    
    // График популярных блюд
    const popularCtx = document.getElementById('popularChart').getContext('2d');
    new Chart(popularCtx, {
        type: 'doughnut',
        data: {
            labels: ['Цезарь', 'Борщ', 'Котлета', 'Компот'],
            datasets: [{
                data: [45, 38, 42, 30],
                backgroundColor: ['#ff6b35', '#2ecc71', '#3498db', '#f1c40f']
            }]
        }
    });
}

// Загрузка категорий меню
function loadMenuCategories() {
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            const categoriesDiv = document.getElementById('menuCategories');
            categoriesDiv.innerHTML = `
                <div class="categories-list">
                    ${data.categories.map(cat => `
                        <div class="category-item ${currentCategory === cat.id ? 'active' : ''}" 
                             onclick="selectCategory(${cat.id})">
                            <img src="${cat.image}" alt="${cat.name}">
                            <span>${cat.name}</span>
                            <span class="items-count">${cat.items.length}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            if (data.categories.length > 0) {
                selectCategory(data.categories[0].id);
            }
        });
}

// Выбор категории
function selectCategory(categoryId) {
    currentCategory = categoryId;
    loadMenuItems(categoryId);
    
    // Подсветка активной категории
    document.querySelectorAll('.category-item').forEach(el => {
        el.classList.remove('active');
    });
    event?.currentTarget.classList.add('active');
}

// Загрузка блюд категории
function loadMenuItems(categoryId) {
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            const category = data.categories.find(c => c.id === categoryId);
            if (!category) return;
            
            const tbody = document.getElementById('menuItemsTable');
            tbody.innerHTML = category.items.map(item => `
                <tr>
                    <td><img src="${item.image}" alt="${item.name}" width="50"></td>
                    <td>${item.name}</td>
                    <td>${item.price} ₽</td>
                    <td>${item.weight} г</td>
                    <td>
                        <input type="checkbox" ${item.available ? 'checked' : ''} 
                               onchange="toggleAvailable(${item.id})">
                    </td>
                    <td>
                        <input type="checkbox" ${item.is_popular ? 'checked' : ''} 
                               onchange="togglePopular(${item.id})">
                    </td>
                    <td>
                        <button onclick="editDish(${item.id})"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteDish(${item.id})" class="btn-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        });
}

// Добавление категории
function showAddCategoryModal() {
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Добавить категорию</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="addCategory(event)">
                <div class="form-group">
                    <label>Название (RU)</label>
                    <input type="text" id="catNameRu" required>
                </div>
                <div class="form-group">
                    <label>Название (EN)</label>
                    <input type="text" id="catNameEn">
                </div>
                <div class="form-group">
                    <label>Порядок сортировки</label>
                    <input type="number" id="catSort" value="1">
                </div>
                <div class="form-group">
                    <label>Изображение</label>
                    <input type="file" id="catImage" accept="image/*">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Добавить</button>
                </div>
            </form>
        </div>
    `;
    modal.style.display = 'block';
}

// Добавление блюда
function showAddDishModal() {
    if (!currentCategory) {
        alert('Сначала выберите категорию');
        return;
    }
    
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Добавить блюдо</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="addDish(event)">
                <div class="form-group">
                    <label>Название (RU)</label>
                    <input type="text" id="dishNameRu" required>
                </div>
                <div class="form-group">
                    <label>Название (EN)</label>
                    <input type="text" id="dishNameEn">
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea id="dishDescription" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Цена (₽)</label>
                        <input type="number" id="dishPrice" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Старая цена (₽)</label>
                        <input type="number" id="dishOldPrice" min="0" value="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Вес (г)</label>
                        <input type="number" id="dishWeight" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Калории</label>
                        <input type="number" id="dishCalories" min="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Аллергены</label>
                    <div id="allergensCheckboxes"></div>
                </div>
                <div class="form-group">
                    <label>Изображение</label>
                    <input type="file" id="dishImage" accept="image/*">
                </div>
                <div class="form-check">
                    <label>
                        <input type="checkbox" id="dishPopular"> Популярное
                    </label>
                    <label>
                        <input type="checkbox" id="dishNew"> Новинка
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Добавить</button>
                </div>
            </form>
        </div>
    `;
    
    // Загружаем аллергены
    loadAllergensCheckboxes();
    modal.style.display = 'block';
}

// Загрузка аллергенов для чекбоксов
function loadAllergensCheckboxes() {
    fetch('data/settings.json')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('allergensCheckboxes');
            container.innerHTML = data.allergens.map(a => `
                <label>
                    <input type="checkbox" value="${a.id}"> ${a.icon} ${a.name}
                </label>
            `).join('');
        });
}

// Добавление блюда
function addDish(event) {
    event.preventDefault();
    
    // Собираем данные
    const newDish = {
        id: Date.now(),
        name: document.getElementById('dishNameRu').value,
        name_en: document.getElementById('dishNameEn').value,
        description: document.getElementById('dishDescription').value,
        price: parseInt(document.getElementById('dishPrice').value),
        old_price: parseInt(document.getElementById('dishOldPrice').value),
        weight: parseInt(document.getElementById('dishWeight').value),
        calories: parseInt(document.getElementById('dishCalories').value),
        allergens: Array.from(document.querySelectorAll('#allergensCheckboxes input:checked'))
            .map(cb => cb.value),
        available: true,
        is_popular: document.getElementById('dishPopular').checked,
        is_new: document.getElementById('dishNew').checked,
        image: '/images/dishes/default.jpg',
        sort_order: 1,
        created_at: new Date().toISOString()
    };
    
    // Сохраняем в JSON
    saveDishToJson(currentCategory, newDish);
    
    closeModal();
    loadMenuItems(currentCategory);
    alert('Блюдо добавлено!');
}

// Сохранение блюда в JSON
function saveDishToJson(categoryId, dish) {
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            const category = data.categories.find(c => c.id === categoryId);
            if (category) {
                category.items.push(dish);
                
                // Сохраняем обратно
                fetch('data/menu.json', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data, null, 2)
                });
            }
        });
}

// Загрузка заказов
function loadOrders() {
    fetch('data/orders.json')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('ordersTable');
            tbody.innerHTML = data.orders.map(order => `
                <tr>
                    <td>#${order.order_number}</td>
                    <td>${order.user_name}</td>
                    <td>
                        ${order.items.map(item => `${item.name} x${item.quantity}`).join('<br>')}
                    </td>
                    <td>${order.total_amount} ₽</td>
                    <td>${order.pickup_time}</td>
                    <td>
                        <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                            ${generateStatusOptions(order.status)}
                        </select>
                    </td>
                    <td>
                        <button onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                        <button onclick="printOrder(${order.id})"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `).join('');
        });
}

// Обновление статуса заказа
function updateOrderStatus(orderId, newStatus) {
    fetch('data/orders.json')
        .then(res => res.json())
        .then(data => {
            const order = data.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                if (newStatus === 'completed') {
                    order.issued_at = new Date().toISOString();
                }
                
                // Сохраняем
                fetch('data/orders.json', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data, null, 2)
                }).then(() => {
                    loadOrders();
                });
            }
        });
}

// Загрузка пользователей
function loadUsers() {
    fetch('data/users.json')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('usersTable');
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>@${user.username}</td>
                    <td>${user.first_name} ${user.last_name || ''}</td>
                    <td>${user.phone || '-'}</td>
                    <td>
                        <select onchange="updateUserRole(${user.id}, this.value)">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                            <option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Кассир</option>
                            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Менеджер</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Админ</option>
                        </select>
                    </td>
                    <td>${user.total_orders || 0}</td>
                    <td>${user.missed_pickups || 0}</td>
                    <td>
                        <span class="status-badge ${user.status === 'active' ? 'status-confirmed' : 'status-cancelled'}">
                            ${user.status === 'active' ? 'Активен' : 'Заблокирован'}
                        </span>
                    </td>
                    <td>
                        <button onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                        ${user.missed_pickups >= 3 ? 
                            `<button onclick="addToBlacklist(${user.id})" class="btn-danger">
                                <i class="fas fa-ban"></i>
                            </button>` : ''
                        }
                    </td>
                </tr>
            `).join('');
        });
}

// Загрузка отзывов
function loadReviews() {
    fetch('data/reviews.json')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('reviewsGrid');
            grid.innerHTML = data.reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <img src="${getUserAvatar(review.user_id)}" alt="User">
                        <div>
                            <div class="review-author">${review.user_name}</div>
                            <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                        </div>
                    </div>
                    <p class="review-text">"${review.comment}"</p>
                    ${review.advantages ? `<p><strong>Плюсы:</strong> ${review.advantages}</p>` : ''}
                    ${review.disadvantages ? `<p><strong>Минусы:</strong> ${review.disadvantages}</p>` : ''}
                    <div class="review-actions">
                        <button onclick="publishReview(${review.id})" class="btn-success">
                            <i class="fas fa-check"></i> Опубликовать
                        </button>
                        <button onclick="replyToReview(${review.id})">
                            <i class="fas fa-reply"></i> Ответить
                        </button>
                        <button onclick="deleteReview(${review.id})" class="btn-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        });
}

// Загрузка черного списка
function loadBlacklist() {
    fetch('data/blacklist.json')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('blacklistTable');
            tbody.innerHTML = data.blacklisted_users.map(user => `
                <tr>
                    <td>${user.name} (@${user.username})</td>
                    <td>${user.reason}</td>
                    <td>${user.missed_pickups}</td>
                    <td>${new Date(user.banned_at).toLocaleDateString()}</td>
                    <td>${new Date(user.banned_until).toLocaleDateString()}</td>
                    <td>Админ</td>
                    <td>
                        <button onclick="unbanUser(${user.user_id})" class="btn-success">
                            <i class="fas fa-check"></i> Разблокировать
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Загружаем историю неявок
            const missedTbody = document.getElementById('missedPickupsTable');
            missedTbody.innerHTML = data.missed_pickups.map(missed => `
                <tr>
                    <td>Пользователь #${missed.user_id}</td>
                    <td>#${missed.order_id}</td>
                    <td>${new Date(missed.order_date).toLocaleDateString()}</td>
                    <td>${missed.amount} ₽</td>
                </tr>
            `).join('');
        });
}

// Добавление в черный список
function showAddToBlacklistModal() {
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Добавить в черный список</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="addToBlacklist(event)">
                <div class="form-group">
                    <label>ID пользователя</label>
                    <input type="number" id="blacklistUserId" required>
                </div>
                <div class="form-group">
                    <label>Причина блокировки</label>
                    <select id="blacklistReason" required>
                        <option value="missed_pickups">Многократные неявки</option>
                        <option value="offensive">Оскорбления</option>
                        <option value="spam">Спам</option>
                        <option value="other">Другое</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Комментарий</label>
                    <textarea id="blacklistComment" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Срок блокировки (дней)</label>
                    <input type="number" id="blacklistDuration" value="30" min="1" max="365">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                    <button type="submit" class="btn-danger">Заблокировать</button>
                </div>
            </form>
        </div>
    `;
    modal.style.display = 'block';
}

// Добавление в черный список
function addToBlacklist(event) {
    event.preventDefault();
    
    const userData = {
        user_id: parseInt(document.getElementById('blacklistUserId').value),
        reason: document.getElementById('blacklistReason').value,
        notes: document.getElementById('blacklistComment').value,
        banned_at: new Date().toISOString(),
        banned_until: new Date(Date.now() + parseInt(document.getElementById('blacklistDuration').value) * 86400000).toISOString(),
        banned_by: 111946301
    };
    
    fetch('data/blacklist.json')
        .then(res => res.json())
        .then(data => {
            data.blacklisted_users.push(userData);
            
            // Сохраняем
            fetch('data/blacklist.json', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data, null, 2)
            }).then(() => {
                closeModal();
                loadBlacklist();
                alert('Пользователь добавлен в черный список');
            });
        });
}

// Создание бэкапа
function createBackup() {
    const date = new Date();
    const backupName = `backup_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}-${date.getMinutes().toString().padStart(2,'0')}`;
    
    // Собираем все JSON файлы
    const files = ['menu.json', 'orders.json', 'users.json', 'blacklist.json', 'reviews.json', 'settings.json'];
    const backup = {};
    
    Promise.all(files.map(file => 
        fetch(`data/${file}`).then(res => res.json())
    )).then(results => {
        files.forEach((file, index) => {
            backup[file] = results[index];
        });
        
        // Сохраняем бэкап
        localStorage.setItem(backupName, JSON.stringify(backup));
        
        // Добавляем в список бэкапов
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        backups.push({
            name: backupName,
            date: date.toISOString(),
            size: JSON.stringify(backup).length,
            files: files
        });
        localStorage.setItem('backups', JSON.stringify(backups));
        
        loadBackups();
        alert('Бэкап создан!');
    });
}

// Загрузка списка бэкапов
function loadBackups() {
    const backups = JSON.parse(localStorage.getItem('backups') || '[]');
    const tbody = document.getElementById('backupsTable');
    
    tbody.innerHTML = backups.map(backup => `
        <tr>
            <td>${new Date(backup.date).toLocaleString()}</td>
            <td>${(backup.size / 1024).toFixed(2)} KB</td>
            <td>${backup.files.join(', ')}</td>
            <td>Админ</td>
            <td>
                <button onclick="downloadBackup('${backup.name}')"><i class="fas fa-download"></i></button>
                <button onclick="restoreBackup('${backup.name}')"><i class="fas fa-undo"></i></button>
                <button onclick="deleteBackup('${backup.name}')" class="btn-danger"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Вспомогательные функции
function getStatusName(status) {
    const statuses = {
        'new': 'Новый',
        'confirmed': 'Подтвержден',
        'preparing': 'Готовится',
        'ready': 'Готов',
        'completed': 'Выдан',
        'cancelled': 'Отменен'
    };
    return statuses[status] || status;
}

function generateStatusOptions(currentStatus) {
    const statuses = [
        {value: 'new', name: 'Новый'},
        {value: 'confirmed', name: 'Подтвержден'},
        {value: 'preparing', name: 'Готовится'},
        {value: 'ready', name: 'Готов'},
        {value: 'completed', name: 'Выдан'},
        {value: 'cancelled', name: 'Отменен'}
    ];
    
    return statuses.map(s => 
        `<option value="${s.value}" ${s.value === currentStatus ? 'selected' : ''}>${s.name}</option>`
    ).join('');
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Экспорт функций в глобальную область
window.showSection = showSection;
window.selectCategory = selectCategory;
window.showAddCategoryModal = showAddCategoryModal;
window.showAddDishModal = showAddDishModal;
window.showAddLunchModal = showAddLunchModal;
window.addDish = addDish;
window.updateOrderStatus = updateOrderStatus;
window.showAddToBlacklistModal = showAddToBlacklistModal;
window.createBackup = createBackup;
window.closeModal = closeModal;
window.logout = logout;