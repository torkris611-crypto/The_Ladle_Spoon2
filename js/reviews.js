// Система отзывов
const ReviewsSystem = {
    // Данные
    allReviews: [],
    filteredReviews: [],
    currentPage: 1,
    reviewsPerPage: 6,
    statistics: {
        averageRating: 0,
        totalReviews: 0,
        recommendPercent: 0
    },

    selectedDish: '',
    uploadedPhotos: [],

    // Инициализация
    init: async function() {
        await this.loadReviewsFromJSON();
        this.filteredReviews = [...this.allReviews];
        this.renderRecentReviews();
        this.renderAllReviews();
        this.initEventListeners();
        this.updateStatistics();
        this.initFilters();
        this.initPhotoViewer();
    },

    // Загрузка отзывов из JSON файла
    loadReviewsFromJSON: async function() {
        try {
            const response = await fetch('data/reviews.json');
            const data = await response.json();
            this.allReviews = data.reviews || [];
            
            // Используем stats из JSON или рассчитываем сами
            if (data.stats) {
                this.statistics = {
                    averageRating: data.stats.avgRating || 4.7,
                    totalReviews: data.stats.totalReviews || this.allReviews.length,
                    recommendPercent: data.stats.recommendPercent || 86
                };
            } else {
                this.calculateStatistics();
            }
            
            console.log('Отзывы загружены:', this.allReviews);
            console.log('Статистика:', this.statistics);
        } catch (error) {
            console.error('Ошибка загрузки отзывов:', error);
            // Запасные данные на случай ошибки
            this.allReviews = [];
            this.statistics = {
                averageRating: 4.7,
                totalReviews: 0,
                recommendPercent: 86
            };
        }
    },

    // Расчет статистики на основе отзывов
    calculateStatistics: function() {
        if (this.allReviews.length === 0) {
            return;
        }

        const totalRating = this.allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = totalRating / this.allReviews.length;
        
        // Считаем процент рекомендующих (оценки 4 и 5)
        const recommendCount = this.allReviews.filter(review => (review.rating || 0) >= 4).length;
        const recommendPercent = Math.round((recommendCount / this.allReviews.length) * 100);

        this.statistics = {
            averageRating: parseFloat(avgRating.toFixed(1)),
            totalReviews: this.allReviews.length,
            recommendPercent: recommendPercent
        };
    },

    // Форматирование даты
    formatDate: function(dateString) {
        if (!dateString) return 'Дата не указана';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Сегодня';
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дня назад`;
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },

    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Выбор блюда
        const dishOptions = document.querySelectorAll('.dish-option');
        if (dishOptions.length > 0) {
            dishOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    document.querySelectorAll('.dish-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    e.currentTarget.classList.add('selected');
                    this.selectedDish = e.currentTarget.dataset.dish;
                    const selectedDishInput = document.getElementById('selectedDish');
                    if (selectedDishInput) {
                        selectedDishInput.value = this.selectedDish;
                    }
                });
            });
        }

        // Загрузка фото
        const photoArea = document.getElementById('photoUploadArea');
        const photoInput = document.getElementById('photoInput');

        if (photoArea) {
            photoArea.addEventListener('click', () => {
                if (photoInput) photoInput.click();
            });

            photoArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                photoArea.style.borderColor = 'var(--primary-color)';
            });

            photoArea.addEventListener('dragleave', () => {
                photoArea.style.borderColor = 'var(--light-color)';
            });

            photoArea.addEventListener('drop', (e) => {
                e.preventDefault();
                photoArea.style.borderColor = 'var(--light-color)';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handlePhotoUpload(files[0]);
                }
            });
        }

        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handlePhotoUpload(e.target.files[0]);
                }
            });
        }

        // Счетчик символов
        const commentArea = document.getElementById('reviewComment');
        if (commentArea) {
            commentArea.addEventListener('input', function() {
                const counter = document.querySelector('.char-counter');
                if (counter) {
                    counter.textContent = `${this.value.length}/500`;
                }
            });
        }

        // Отправка формы
        const form = document.getElementById('reviewForm');
        if (form) {
            form.addEventListener('submit', (e) => this.submitReview(e));
        }

        // Номер заказа - только цифры
        const orderInput = document.getElementById('orderNumber');
        if (orderInput) {
            orderInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    },

    // Инициализация фильтров для страницы всех отзывов
    initFilters: function() {
        const ratingFilter = document.getElementById('ratingFilter');
        const dishFilter = document.getElementById('dishFilter');
        const sortFilter = document.getElementById('sortFilter');
        const searchInput = document.getElementById('searchInput');

        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => this.applyFilters());
        }
        if (dishFilter) {
            dishFilter.addEventListener('change', () => this.applyFilters());
        }
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    },

    // Применение фильтров
    applyFilters: function() {
        const ratingFilter = document.getElementById('ratingFilter')?.value || 'all';
        const dishFilter = document.getElementById('dishFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'newest';
        const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';

        // Фильтрация
        this.filteredReviews = this.allReviews.filter(review => {
            // Фильтр по рейтингу
            if (ratingFilter !== 'all' && (review.rating || 0) !== parseInt(ratingFilter)) {
                return false;
            }
            
            // Фильтр по блюду
            if (dishFilter !== 'all' && review.dish !== dishFilter) {
                return false;
            }
            
            // Поиск по тексту
            if (searchInput && review.comment && !review.comment.toLowerCase().includes(searchInput)) {
                return false;
            }
            
            return true;
        });

        // Сортировка
        this.filteredReviews.sort((a, b) => {
            switch(sortFilter) {
                case 'newest':
                    return new Date(b.date || 0) - new Date(a.date || 0);
                case 'oldest':
                    return new Date(a.date || 0) - new Date(b.date || 0);
                case 'highest':
                    return (b.rating || 0) - (a.rating || 0);
                case 'lowest':
                    return (a.rating || 0) - (b.rating || 0);
                default:
                    return 0;
            }
        });

        // Сброс на первую страницу
        this.currentPage = 1;
        
        // Обновление отображения
        this.renderAllReviews();
        this.updatePagination();
    },

    // Загрузка фото
    handlePhotoUpload: function(file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Файл слишком большой! Максимальный размер - 5 МБ');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, загрузите изображение');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            if (preview) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.innerHTML = '';
                preview.appendChild(img);
            }
            this.uploadedPhotos.push(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    // Отправка отзыва
    submitReview: function(e) {
        e.preventDefault();

        // Проверяем авторизацию
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Валидация
        const orderNumber = document.getElementById('orderNumber')?.value;
        if (!orderNumber) {
            alert('Пожалуйста, укажите номер заказа');
            return false;
        }

        if (!this.selectedDish) {
            alert('Пожалуйста, выберите блюдо');
            return false;
        }

        const rating = document.querySelector('input[name="rating"]:checked');
        if (!rating) {
            alert('Пожалуйста, поставьте оценку');
            return false;
        }

        const comment = document.getElementById('reviewComment')?.value;
        if (!comment || comment.length < 5) {
            alert('Комментарий должен содержать минимум 5 символов');
            return false;
        }

        const agreement = document.getElementById('agreementCheck')?.checked;
        if (!agreement) {
            alert('Необходимо согласие на обработку данных');
            return false;
        }

        // Получаем имя пользователя
        let userName = 'Гость';
        let userId = null;
        
        if (currentUser) {
            userId = currentUser.id;
            userName = currentUser.name || `Пользователь #${currentUser.id}`;
        }

        // Собираем данные
        const reviewData = {
            id: Date.now(),
            user_id: userId || Math.floor(Math.random() * 10000),
            user_name: userName,
            dish: this.selectedDish,
            rating: parseInt(rating.value),
            comment: comment,
            userAvatar: `https://i.pravatar.cc/100?u=${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            likes: 0
        };

        console.log('Отправка отзыва:', reviewData);
        
        // Добавляем в массив отзывов
        this.allReviews.unshift(reviewData);
        this.filteredReviews = [...this.allReviews];
        
        // Пересчитываем статистику
        this.calculateStatistics();
        
        // Показываем успех
        this.showSuccessModal();
        
        // Очищаем форму
        this.clearForm();

        // Обновляем статистику
        this.updateStatistics();
        
        // Обновляем отображение
        this.renderRecentReviews();
        this.renderAllReviews();

        return false;
    },

    // Очистка формы
    clearForm: function() {
        const form = document.getElementById('reviewForm');
        if (form) form.reset();
        
        document.querySelectorAll('.dish-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) photoPreview.innerHTML = '';
        
        const charCounter = document.querySelector('.char-counter');
        if (charCounter) charCounter.textContent = '0/500';
        
        this.selectedDish = '';
        this.uploadedPhotos = [];
    },

    // Отображение последних отзывов
    renderRecentReviews: function() {
        const container = document.getElementById('recentReviewsList');
        if (!container) return;

        const recent = this.allReviews.slice(0, 3);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            return;
        }

        let html = '';
        recent.forEach(review => {
            // Получаем имя пользователя
            let userName = review.user_name || `Пользователь #${review.user_id}`;

            html += `
                <div class="recent-review-card">
                    <div class="recent-review-header">
                        <div class="recent-review-user">
                            <img src="${review.userAvatar || 'https://i.pravatar.cc/30'}" 
                                 alt="${userName}"
                                 style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                            <span class="recent-review-name">${userName}</span>
                        </div>
                        <div class="recent-review-rating">
                            ${this.getStarRating(review.rating)}
                        </div>
                    </div>
                    <div class="recent-review-text">"${review.comment ? review.comment.substring(0, 60) : ''}${review.comment && review.comment.length > 60 ? '...' : ''}"</div>
                    <div class="recent-review-footer">
                        <span class="recent-review-dish">
                            <i class="fas fa-utensils"></i> ${review.dish || 'Блюдо'}
                        </span>
                        <span class="recent-review-date">
                            <i class="far fa-clock"></i> ${this.formatDate(review.date)}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Инициализация просмотра фото
    initPhotoViewer: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('review-photo')) {
                const modal = document.createElement('div');
                modal.className = 'photo-modal';
                modal.innerHTML = `
                    <div class="photo-modal-content">
                        <span class="close-photo-modal">&times;</span>
                        <img src="${e.target.src}" alt="Фото к отзыву">
                    </div>
                `;
                document.body.appendChild(modal);
                
                const closeBtn = modal.querySelector('.close-photo-modal');
                if (closeBtn) {
                    closeBtn.onclick = function() {
                        modal.remove();
                    };
                }
                
                modal.onclick = function(e) {
                    if (e.target === modal) {
                        modal.remove();
                    }
                };
            }
        });
    },

    // Отображение всех отзывов с пагинацией
    renderAllReviews: function() {
        const container = document.getElementById('allReviewsGrid');
        if (!container) return;

        // Показываем загрузку
        if (this.allReviews.length === 0) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Загрузка отзывов...
                </div>
            `;
            return;
        }

        if (this.filteredReviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews-found">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                    <button class="btn btn-primary" onclick="ReviewsSystem.resetFilters()">
                        Сбросить фильтры
                    </button>
                </div>
            `;
            return;
        }

        // Пагинация
        const startIndex = (this.currentPage - 1) * this.reviewsPerPage;
        const endIndex = startIndex + this.reviewsPerPage;
        const paginatedReviews = this.filteredReviews.slice(startIndex, endIndex);

        let html = '';
        paginatedReviews.forEach(review => {
            // Получаем имя пользователя
            let userName = review.user_name || `Пользователь #${review.user_id}`;
            
            // Получаем аватар
            let userAvatar = review.userAvatar || `https://i.pravatar.cc/100?u=${review.user_id || review.id}`;

            // Получаем изображение блюда
            let dishImage = this.getDishImage(review.dish);

            html += `
                <div class="review-card all-review-card">
                    <div class="review-header">
                        <img src="${userAvatar}" 
                             alt="${userName}" 
                             class="reviewer-avatar"
                             onerror="this.src='https://i.pravatar.cc/100?u=${review.user_id || review.id}'">
                        <div class="reviewer-info">
                            <h4>${userName}</h4>
                            <span class="review-date">
                                <i class="far fa-calendar-alt"></i> ${this.formatDate(review.date)}
                            </span>
                            <div class="review-rating">
                                ${this.getStarRating(review.rating)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-dish">
                        <img src="${dishImage}" 
                             alt="${review.dish || 'Блюдо'}" 
                             class="dish-image"
                             onerror="this.src='images/default-dish.jpg'">
                        <span class="dish-name">
                            <i class="fas fa-utensils"></i> ${review.dish || 'Блюдо'}
                        </span>
                    </div>
                    
                    <div class="review-comment">
                        "${review.comment || ''}"
                    </div>
                    
                    <div class="review-footer">
                        <div class="like-button" onclick="ReviewsSystem.handleLike(${review.id})">
                            <i class="fas fa-heart"></i>
                            <span>${review.likes || 0}</span>
                        </div>
                        <div class="share-button" onclick="ReviewsSystem.shareReview(${review.id})">
                            <i class="fas fa-share-alt"></i>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        
        // Обновляем пагинацию
        this.updatePagination();
        
        // Обновляем статистику в фильтрах
        this.updateFiltersStats();
    },

    // Вспомогательная функция для получения звездного рейтинга
    getStarRating: function(rating) {
        const numRating = parseInt(rating) || 0;
        const fullStar = '★';
        const emptyStar = '☆';
        return fullStar.repeat(numRating) + emptyStar.repeat(5 - numRating);
    },

    // Вспомогательная функция для получения изображения блюда
    getDishImage: function(dishName) {
        const dishImages = {
            'Борщ': 'images/borsh.jpg',
            'Солянка': 'images/solyanka.jpg',
            'Грибной суп': 'images/mushroom.jpg',
            'Тыквенный суп': 'images/pumpkin.jpg',
            'Томатный суп': 'images/tomato.jpg',
            'Лапша': 'images/chicken.jpg',
            'Котлета по-киевски': 'images/kiev.jpg',
            'Плов': 'images/plov.jpg',
            'Салат Цезарь': 'images/caesar.jpg'
        };
        return dishImages[dishName] || 'images/default-dish.jpg';
    },

    // Сброс фильтров
    resetFilters: function() {
        // Сбрасываем значения полей
        const ratingFilter = document.getElementById('ratingFilter');
        const dishFilter = document.getElementById('dishFilter');
        const sortFilter = document.getElementById('sortFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (ratingFilter) ratingFilter.value = 'all';
        if (dishFilter) dishFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'newest';
        if (searchInput) searchInput.value = '';
        
        // Сбрасываем фильтрацию
        this.filteredReviews = [...this.allReviews];
        this.currentPage = 1;
        
        // Обновляем отображение
        this.renderAllReviews();
    },

    // Обновление статистики в фильтрах
    updateFiltersStats: function() {
        // Обновляем статистику на странице
        const avgElement = document.getElementById('avgRatingAll');
        const totalElement = document.getElementById('totalReviewsAll');
        const recommendElement = document.getElementById('recommendPercentAll');
        
        if (avgElement) {
            avgElement.textContent = this.statistics.averageRating.toFixed(1);
        }
        if (totalElement) {
            totalElement.textContent = this.statistics.totalReviews;
        }
        if (recommendElement) {
            recommendElement.textContent = this.statistics.recommendPercent + '%';
        }
    },

    // Обновление пагинации
    updatePagination: function() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredReviews.length / this.reviewsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        // Кнопка "Предыдущая"
        html += `<button class="page-btn" onclick="ReviewsSystem.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || 
                i === totalPages || 
                (i >= this.currentPage - 2 && i <= this.currentPage + 2)
            ) {
                html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                    onclick="ReviewsSystem.changePage(${i})">${i}</button>`;
            } else if (
                i === this.currentPage - 3 || 
                i === this.currentPage + 3
            ) {
                html += '<span class="page-dots">...</span>';
            }
        }

        // Кнопка "Следующая"
        html += `<button class="page-btn" onclick="ReviewsSystem.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>`;

        html += '</div>';
        container.innerHTML = html;
    },

    // Смена страницы
    changePage: function(page) {
        const totalPages = Math.ceil(this.filteredReviews.length / this.reviewsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderAllReviews();
        this.updatePagination();
        
        // Плавный скролл к началу отзывов
        const reviewsGrid = document.getElementById('allReviewsGrid');
        if (reviewsGrid) {
            reviewsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Обновление статистики
    updateStatistics: function() {
        // Обновление на главной странице отзывов
        const avgElement = document.getElementById('avgRating');
        const totalElement = document.getElementById('totalReviews');
        const starsElement = document.getElementById('avgStars');
        const recommendElement = document.getElementById('recommendPercent');
        
        if (avgElement) avgElement.textContent = this.statistics.averageRating.toFixed(1);
        if (totalElement) totalElement.textContent = this.statistics.totalReviews;
        if (starsElement) {
            const fullStars = Math.floor(this.statistics.averageRating);
            starsElement.innerHTML = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
        }
        if (recommendElement) recommendElement.textContent = this.statistics.recommendPercent + '%';

        // Обновление на странице всех отзывов
        const avgAllElement = document.getElementById('avgRatingAll');
        const totalAllElement = document.getElementById('totalReviewsAll');
        const recommendAllElement = document.getElementById('recommendPercentAll');
        
        if (avgAllElement) avgAllElement.textContent = this.statistics.averageRating.toFixed(1);
        if (totalAllElement) totalAllElement.textContent = this.statistics.totalReviews;
        if (recommendAllElement) recommendAllElement.textContent = this.statistics.recommendPercent + '%';
    },

    // Показать модальное окно
    showSuccessModal: function() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                this.closeSuccessModal();
            }, 5000);
        }
    },

    // Закрыть модальное окно
    closeSuccessModal: function() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Копировать бонусный код
    copyBonusCode: function() {
        const code = document.querySelector('.bonus-code span')?.textContent;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                alert('Бонусный код скопирован!');
            });
        }
    },

    // Лайк
    handleLike: function(reviewId) {
        const review = this.allReviews.find(r => r.id === reviewId);
        if (review) {
            review.likes = (review.likes || 0) + 1;
            this.renderAllReviews();
        }
    },

    // Поделиться
    shareReview: function(reviewId) {
        const review = this.allReviews.find(r => r.id === reviewId);
        if (review) {
            const userName = review.user_name || `Пользователь #${review.user_id}`;
            const shareText = `"${review.comment || ''}" — ${userName} (${review.rating}★)`;
            if (navigator.share) {
                navigator.share({
                    title: 'Отзыв о Столовой',
                    text: shareText,
                    url: window.location.href
                }).catch(() => {
                    navigator.clipboard.writeText(shareText);
                    alert('Отзыв скопирован в буфер обмена');
                });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Отзыв скопирован в буфер обмена');
            }
        }
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    ReviewsSystem.init();
});

// Глобальные функции для HTML
function closeSuccessModal() {
    ReviewsSystem.closeSuccessModal();
}

function copyBonusCode() {
    ReviewsSystem.copyBonusCode();
}