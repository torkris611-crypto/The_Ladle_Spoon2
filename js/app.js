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
    
    const userId = document.getElementById('userId').value;
    
    // Создаем пользователя
    currentUser = {
        id: parseInt(userId),
        name: `User_${userId}`,
        loginTime: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Обновляем интерфейс
    updateUserInterface();
    closeLoginModal();
    
    alert(`Добро пожаловать, ${currentUser.name}!`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();
}

function updateUserInterface() {
    const loginBtn = document.querySelector('.login-btn');
    const userInfo = document.querySelector('.user-info');
    const userName = document.querySelector('.user-name');
    
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userName.textContent = currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
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