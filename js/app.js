// Глобальные переменные
let currentUser = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍽 Столовая Антона загружена!');
    
    // Загружаем данные
    loadBusinessLunches();
    loadPopularItems();
    loadReviews();
    
    // Проверяем авторизацию
    checkAuthStatus();
    
    // Обновляем счетчик корзины
    updateCartCount();
});

// Проверка авторизации
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Пользователь авторизован
        const loginBtn = document.querySelector('.login-btn');
        const userInfo = document.querySelector('.user-info');
        const userName = document.querySelector('.user-name');
        
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userName) userName.textContent = currentUser.name || 'Пользователь';
        
        // Показываем ссылку на админку для администратора
        const adminLink = document.querySelector('.nav a[href="admin.html"]');
        if (adminLink) {
            if (currentUser.id === 111946301) { // ID Антона
                adminLink.style.display = 'inline-block';
            } else {
                adminLink.style.display = 'none';
            }
        }
    }
}

// Загрузка бизнес-ланчей
function loadBusinessLunches() {
    const container = document.getElementById('business-lunches');
    if (!container) return;

    const businessLunches = [
        {
            id: 101,
            name: "Бизнес-ланч №1",
            description: "Суп дня, горячее с гарниром, салат, напиток",
            price: 350,
            image: "images/Бизнес.jpg"
        },
        {
            id: 102,
            name: "Бизнес-ланч №2",
            description: "Два горячих блюда на выбор, салат, напиток",
            price: 420,
            image: "images/бизнес1.jpg"
        },
        {
            id: 103,
            name: "Бизнес-ланч №3",
            description: "Фирменное блюдо, суп, закуска, десерт",
            price: 480,
            image: "images/бизнес3.jpg"
        }
    ];

    container.innerHTML = businessLunches.map(lunch => `
        <div class="offer-card">
            <div class="offer-image" style="background-image: url('${lunch.image}')"></div>
            <div class="offer-content">
                <h3 class="offer-title">${lunch.name}</h3>
                <p class="offer-description">${lunch.description}</p>
                <div class="offer-footer">
                    <span class="offer-price">${lunch.price} ₽</span>
                    <button class="btn btn-primary btn-small" onclick="addToCart({
                        id: ${lunch.id},
                        name: '${lunch.name}',
                        price: ${lunch.price},
                        image: '${lunch.image}',
                        category: 'Бизнес-ланч'
                    })">
                        <i class="fas fa-cart-plus"></i> В корзину
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Загрузка популярных блюд
function loadPopularItems() {
    const container = document.getElementById('popular-items');
    if (!container) return;

    const popularItems = [
        {
            id: 201,
            name: "Борщ с пампушками",
            description: "Традиционный украинский борщ",
            price: 180,
            image: "images/гриб.jpg"
        },
        {
            id: 202,
            name: "Котлета по-киевски",
            description: "Сливочное масло внутри, хрустящая корочка",
            price: 250,
            image: "images/рыба.jpg"
        },
        {
            id: 203,
            name: "Салат Цезарь",
            description: "С курицей, пармезаном и соусом",
            price: 220,
            image: "images/тарелка1.jpg"
        },
        {
            id: 204,
            name: "Картофель фри",
            description: "Хрустящий, золотистый",
            price: 120,
            image: "images/тыква.jpg"
        }
    ];

    container.innerHTML = popularItems.map(item => `
        <div class="offer-card">
            <div class="offer-image" style="background-image: url('${item.image}')"></div>
            <div class="offer-content">
                <h3 class="offer-title">${item.name}</h3>
                <p class="offer-description">${item.description}</p>
                <div class="offer-footer">
                    <span class="offer-price">${item.price} ₽</span>
                    <button class="btn btn-primary btn-small" onclick="addToCart({
                        id: ${item.id},
                        name: '${item.name}',
                        price: ${item.price},
                        image: '${item.image}',
                        category: 'Популярное'
                    })">
                        <i class="fas fa-cart-plus"></i> В корзину
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Загрузка отзывов
function loadReviews() {
    const container = document.getElementById('reviews');
    if (!container) return;

    const reviews = [
        {
            id: 1,
            author: "Анна",
            avatar: "images/томат.jpg",
            rating: 5,
            text: "Очень вкусно готовят! Особенно понравился борщ. Всегда свежее и горячее."
        },
        {
            id: 2,
            author: "Михаил",
            avatar: "images/тарелка6.jpg",
            rating: 4,
            text: "Хорошее место для обеда. Быстрое обслуживание, демократичные цены."
        },
        {
            id: 3,
            author: "Елена",
            avatar: "images/тарелка4.jpg",
            rating: 5,
            text: "Удобно заказывать онлайн. Всегда готовы к назначенному времени."
        }
    ];

    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.avatar}" alt="${review.author}" class="review-avatar">
                <div>
                    <div class="review-author">${review.author}</div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                </div>
            </div>
            <div class="review-text">"${review.text}"</div>
        </div>
    `).join('');
}

// ========== РАБОТА С КОРЗИНОЙ ==========

// Добавление в корзину
function addToCart(item) {
    // Проверяем авторизацию
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert('⚠️ Пожалуйста, войдите в систему');
        showLoginModal();
        return;
    }
    
    // Загружаем текущую корзину
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Проверяем, есть ли уже такой товар
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        // Увеличиваем количество
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        // Добавляем новый товар
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category || 'Блюдо',
            quantity: 1
        });
    }
    
    // Сохраняем корзину
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновляем счетчик
    updateCartCount();
    
    // Показываем уведомление
    showNotification('✅ Товар добавлен в корзину');
}

// Обновление счетчика корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(el => {
        if (el) {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    });
}

// Показать уведомление
function showNotification(message) {
    // Проверяем, есть ли уже уведомление
    let notification = document.querySelector('.cart-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'cart-notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЕМ ==========

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value.trim();
    
    if (!userId) {
        alert('Введите Telegram ID');
        return;
    }
    
    const ADMIN_ID = 111946301;
    const isAdmin = (parseInt(userId) === ADMIN_ID);
    
    const user = {
        id: parseInt(userId),
        name: isAdmin ? 'Антон' : `User_${userId}`,
        role: isAdmin ? 'admin' : 'user',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Обновляем интерфейс
    const loginBtn = document.querySelector('.login-btn');
    const userInfo = document.querySelector('.user-info');
    const userName = document.querySelector('.user-name');
    
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userInfo) userInfo.classList.remove('hidden');
    if (userName) userName.textContent = user.name;
    
    // Показываем ссылку на админку
    const adminLink = document.querySelector('.nav a[href="admin.html"]');
    if (adminLink) {
        adminLink.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    closeLoginModal();
    
    if (isAdmin) {
        alert('👋 Добро пожаловать, администратор!');
    } else {
        alert(`👋 Добро пожаловать, ${user.name}!`);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    
    // Обновляем интерфейс
    const loginBtn = document.querySelector('.login-btn');
    const userInfo = document.querySelector('.user-info');
    const adminLink = document.querySelector('.nav a[href="admin.html"]');
    
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userInfo) userInfo.classList.add('hidden');
    if (adminLink) adminLink.style.display = 'none';
    
    // Не очищаем корзину при выходе
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Обновление при изменении localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
        updateCartCount();
    }
});