// Глобальные переменные
let currentUser = null;
let cart = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Столовая Антона загружена!');
    
    // Загружаем данные
    loadMenu();
    loadBusinessLunches();
    loadPopularItems();
    loadReviews();
    
    // Проверяем, есть ли сохраненный пользователь
    checkSavedUser();
    
    // Обновляем счетчик корзины
    updateCartCount();
});

// Загрузка меню из JSON
async function loadMenu() {
    try {
        const response = await fetch('data/menu.json');
        const data = await response.json();
        console.log('Меню загружено:', data);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        return { categories: [], business_lunches: [] };
    }
}

// Загрузка бизнес-ланчей
async function loadBusinessLunches() {
    try {
        const data = await loadMenu();
        const lunchesContainer = document.getElementById('business-lunches');
        
        if (lunchesContainer && data.business_lunches) {
            lunchesContainer.innerHTML = data.business_lunches.map(lunch => `
                <div class="offer-card">
                    <div class="offer-image" style="background-image: url('images/lunch${lunch.id}.jpg')"></div>
                    <div class="offer-content">
                        <h3 class="offer-title">${lunch.name}</h3>
                        <p class="offer-description">Состав: ${lunch.items.join(', ')}</p>
                        <p class="offer-price">${lunch.price} ₽</p>
                        <button class="offer-button" onclick="addToCart(${lunch.id}, 'lunch')">
                            В корзину
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки бизнес-ланчей:', error);
    }
}

// Загрузка популярных блюд
async function loadPopularItems() {
    try {
        const data = await loadMenu();
        const popularContainer = document.getElementById('popular-items');
        
        if (popularContainer && data.categories) {
            // Берем первые 4 блюда из разных категорий
            const popular = [];
            data.categories.forEach(category => {
                if (category.items) {
                    popular.push(...category.items.slice(0, 2));
                }
            });
            
            popularContainer.innerHTML = popular.slice(0, 4).map(item => `
                <div class="offer-card">
                    <div class="offer-image" style="background-image: url('images/dish${item.id}.jpg')"></div>
                    <div class="offer-content">
                        <h3 class="offer-title">${item.name}</h3>
                        <p class="offer-price">${item.price} ₽</p>
                        <button class="offer-button" onclick="addToCart(${item.id}, 'dish')">
                            В корзину
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки популярных блюд:', error);
    }
}

// Загрузка отзывов
async function loadReviews() {
    try {
        const response = await fetch('data/reviews.json');
        const data = await response.json();
        const reviewsContainer = document.getElementById('reviews');
        
        if (reviewsContainer && data.reviews) {
            reviewsContainer.innerHTML = data.reviews.slice(0, 3).map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-avatar"></div>
                        <div>
                            <div class="review-author">Пользователь #${review.user_id}</div>
                            <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                        </div>
                    </div>
                    <p class="review-text">"${review.comment}"</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    }
}

// Работа с пользователем
function checkSavedUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    
    const userId = parseInt(document.getElementById('userId').value);
    console.log('Попытка входа с ID:', userId);
    console.log('Тип данных:', typeof userId);
    
    // ID Антона
    const ADMIN_ID = 111946301;
    console.log('ID админа:', ADMIN_ID);
    console.log('Совпадение:', userId === ADMIN_ID);
    
    // Проверяем, админ ли это
    const isAdmin = (userId === ADMIN_ID);
    
    if (isAdmin) {
        console.log('✅ Вход как администратор');
    } else {
        console.log('❌ Вход как обычный пользователь');
    }
    
    currentUser = {
        id: userId,
        name: `User_${userId}`,
        role: isAdmin ? 'admin' : 'user',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('Пользователь сохранен:', currentUser);
    
    updateUserInterface();
    closeLoginModal();
    
    if (isAdmin) {
        alert('✅ Добро пожаловать, администратор!');
        // Перенаправляем в админку
        window.location.href = 'admin.html';
    } else {
        alert(`👋 Добро пожаловать, ${currentUser.name}!`);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();
}

function updateUserInterface() {
    console.log('Обновление интерфейса. Текущий пользователь:', currentUser);
    
    const loginBtn = document.querySelector('.login-btn');
    const userInfo = document.querySelector('.user-info');
    const userName = document.querySelector('.user-name');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userName.textContent = currentUser.name;
        
        // Показываем ссылку на админку если админ
        if (adminLink) {
            const isAdmin = (currentUser.role === 'admin' || currentUser.id === 111946301);
            console.log('Показывать ссылку на админку?', isAdmin);
            
            if (isAdmin) {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        }
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        if (adminLink) {
            adminLink.classList.add('hidden');
        }
    }
}

// Работа с корзиной
function addToCart(itemId, type) {
    if (!currentUser) {
        alert('Пожалуйста, войдите чтобы добавить блюдо в корзину');
        showLoginModal();
        return;
    }
    
    // Загружаем текущую корзину
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Добавляем товар
    cart.push({
        id: itemId,
        type: type,
        quantity: 1,
        addedAt: new Date().toISOString()
    });
    
    // Сохраняем
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновляем счетчик
    updateCartCount();
    
    alert('Товар добавлен в корзину!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countElements = document.querySelectorAll('.cart-count');
    
    countElements.forEach(el => {
        el.textContent = cart.length;
        el.style.display = cart.length > 0 ? 'inline' : 'none';
    });
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Данные для бизнес-ланчей с локальными картинками
const businessLunches = [
    {
        id: 1,
        name: "Бизнес-ланч №1",
        description: "Суп дня, горячее с гарниром, салат, напиток",
        price: 350,
        image: "images/Бизнес.jpg"
    },
    {
        id: 2,
        name: "Бизнес-ланч №2",
        description: "Два горячих блюда на выбор, салат, напиток",
        price: 420,
        image: "images/бизнес1.jpg"
    },
    {
        id: 3,
        name: "Бизнес-ланч №3",
        description: "Фирменное блюдо, суп, закуска, десерт",
        price: 480,
        image: "images/бизнес3.jpg"
    }
];

// Популярные блюда
const popularItems = [
    {
        id: 1,
        name: "Борщ с пампушками",
        description: "Традиционный украинский борщ",
        price: 180,
        image: "images/гриб.jpg"
    },
    {
        id: 2,
        name: "Котлета по-киевски",
        description: "Сливочное масло внутри, хрустящая корочка",
        price: 250,
        image: "images/рыба.jpg"
    },
    {
        id: 3,
        name: "Салат Цезарь",
        description: "С курицей, пармезаном и соусом",
        price: 220,
        image: "images/тарелка1.jpg"
    },
    {
        id: 4,
        name: "Картофель фри",
        description: "Хрустящий, золотистый",
        price: 120,
        image: "images/тыква.jpg"
    }
];

// Отзывы с аватарками
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

// Загрузка данных при открытии страницы
document.addEventListener('DOMContentLoaded', function() {
    loadBusinessLunches();
    loadPopularItems();
    loadReviews();
    updateCartCount();
});

// Загрузка бизнес-ланчей
function loadBusinessLunches() {
    const container = document.getElementById('business-lunches');
    if (!container) return;

    container.innerHTML = businessLunches.map(lunch => `
        <div class="offer-card">
            <div class="offer-image" style="background-image: url('${lunch.image}')"></div>
            <div class="offer-content">
                <h3 class="offer-title">${lunch.name}</h3>
                <p class="offer-description">${lunch.description}</p>
                <div class="offer-price">${lunch.price} ₽</div>
                <button class="offer-button" onclick="addToCart(${lunch.id}, '${lunch.name}', ${lunch.price}, '${lunch.image}')">
                    В корзину
                </button>
            </div>
        </div>
    `).join('');
}

// Загрузка популярных блюд
function loadPopularItems() {
    const container = document.getElementById('popular-items');
    if (!container) return;

    container.innerHTML = popularItems.map(item => `
        <div class="offer-card">
            <div class="offer-image" style="background-image: url('${item.image}')"></div>
            <div class="offer-content">
                <h3 class="offer-title">${item.name}</h3>
                <p class="offer-description">${item.description}</p>
                <div class="offer-price">${item.price} ₽</div>
                <button class="offer-button" onclick="addToCart(${item.id}, '${item.name}', ${item.price}, '${item.image}')">
                    В корзину
                </button>
            </div>
        </div>
    `).join('');
}

// Загрузка отзывов
function loadReviews() {
    const container = document.getElementById('reviews');
    if (!container) return;

    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.avatar}" alt="${review.author}" class="review-avatar">
                <div>
                    <div class="review-author">${review.author}</div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                </div>
            </div>
            <div class="review-text">${review.text}</div>
        </div>
    `).join('');
}

// Добавление в корзину
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Товар добавлен в корзину!');
}

// Обновление счетчика корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(el => {
        if (el) el.textContent = count;
    });
}

// Функции для модального окна
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value;
    localStorage.setItem('userId', userId);
    document.querySelector('.login-btn').classList.add('hidden');
    document.querySelector('.user-info').classList.remove('hidden');
    document.querySelector('.user-name').textContent = `User ${userId}`;
    closeLoginModal();
}

function logout() {
    localStorage.removeItem('userId');
    document.querySelector('.login-btn').classList.remove('hidden');
    document.querySelector('.user-info').classList.add('hidden');
}