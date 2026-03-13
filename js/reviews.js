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
    },

    // Загрузка отзывов из JSON файла
    loadReviewsFromJSON: async function() {
        try {
            const response = await fetch('data/reviews.json');
            const data = await response.json();
            this.allReviews = data.reviews || [];
            this.statistics = data.statistics || {
                averageRating: 4.8,
                totalReviews: this.allReviews.length,
                recommendPercent: 92
            };
            console.log('Отзывы загружены:', this.allReviews);
        } catch (error) {
            console.error('Ошибка загрузки отзывов:', error);
            // Запасные данные на случай ошибки
            this.allReviews = [];
        }
    },

    // Форматирование даты
    formatDate: function(dateString) {
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
        document.querySelectorAll('.dish-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.dish-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                this.selectedDish = e.currentTarget.dataset.dish;
                document.getElementById('selectedDish').value = this.selectedDish;
            });
        });

        // Загрузка фото
        const photoArea = document.getElementById('photoUploadArea');
        const photoInput = document.getElementById('photoInput');

        if (photoArea) {
            photoArea.addEventListener('click', () => {
                photoInput.click();
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
            if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) {
                return false;
            }
            
            // Фильтр по блюду
            if (dishFilter !== 'all' && review.dish !== dishFilter) {
                return false;
            }
            
            // Поиск по тексту
            if (searchInput && !review.comment.toLowerCase().includes(searchInput)) {
                return false;
            }
            
            return true;
        });

        // Сортировка
        this.filteredReviews.sort((a, b) => {
            switch(sortFilter) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'highest':
                    return b.rating - a.rating;
                case 'lowest':
                    return a.rating - b.rating;
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
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.innerHTML = '';
            preview.appendChild(img);
            this.uploadedPhotos.push(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    // Отправка отзыва
    submitReview: function(e) {
        e.preventDefault();

        // Валидация
        const orderNumber = document.getElementById('orderNumber').value;
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

        const comment = document.getElementById('reviewComment').value;
        if (comment.length < 5) {
            alert('Комментарий должен содержать минимум 5 символов');
            return false;
        }

        const agreement = document.getElementById('agreementCheck').checked;
        if (!agreement) {
            alert('Необходимо согласие на обработку данных');
            return false;
        }

        // Собираем данные
        const reviewData = {
            id: Date.now(),
            orderNumber: orderNumber,
            dish: this.selectedDish,
            rating: parseInt(rating.value),
            comment: comment,
            userName: "Гость",
            userAvatar: "https://i.pravatar.cc/50?img=" + Math.floor(Math.random() * 70),
            date: new Date().toISOString(),
            likes: 0,
            photos: this.uploadedPhotos
        };

        console.log('Отправка отзыва:', reviewData);
        
        // Добавляем в массив отзывов
        this.allReviews.unshift(reviewData);
        this.filteredReviews = [...this.allReviews];
        
        // Показываем успех
        this.showSuccessModal();
        
        // Очищаем форму
        this.clearForm();

        // Обновляем статистику
        this.updateStatistics();
        
        // Обновляем отображение если нужно
        this.renderRecentReviews();

        return false;
    },

    // Очистка формы
    clearForm: function() {
        document.getElementById('reviewForm').reset();
        document.querySelectorAll('.dish-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.getElementById('photoPreview').innerHTML = '';
        document.querySelector('.char-counter').textContent = '0/500';
        this.selectedDish = '';
        this.uploadedPhotos = [];
    },

    // Отображение последних отзывов
    renderRecentReviews: function() {
        const container = document.getElementById('recentReviewsList');
        if (!container) return;

        const recent = this.allReviews.slice(0, 3);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="no-reviews">Пока нет отзывов</p>';
            return;
        }

        let html = '';
        recent.forEach(review => {
            html += `
                <div class="recent-review-item">
                    <div class="recent-review-header">
                        <span class="reviewer-name">${review.userName}</span>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                    </div>
                    <div class="recent-review-text">"${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}"</div>
                    <div class="recent-review-meta">
                        <span>${review.dish}</span>
                        <span>${this.formatDate(review.date)}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Отображение всех отзывов с пагинацией
    renderAllReviews: function() {
        const container = document.getElementById('allReviewsGrid');
        if (!container) return;

        if (this.filteredReviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews-found">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры поиска</p>
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
            html += `
                <div class="review-card all-review-card">
                    <div class="review-header">
                        <img src="${review.userAvatar}" alt="${review.userName}" class="reviewer-avatar">
                        <div class="reviewer-info">
                            <h4>${review.userName}</h4>
                            <span class="review-date">${this.formatDate(review.date)}</span>
                            <div class="review-rating">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="review-dish">
                        <img src="${review.dishImage}" alt="${review.dish}" class="dish-image">
                        <span class="dish-name">${review.dish}</span>
                    </div>
                    <div class="review-comment">
                        "${review.comment}"
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
            modal.classList.add('show');
            setTimeout(() => {
                this.closeSuccessModal();
            }, 5000);
        }
    },

    // Закрыть модальное окно
    closeSuccessModal: function() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('show');
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
            const shareText = `"${review.comment}" — ${review.userName} (${review.rating}★)`;
            if (navigator.share) {
                navigator.share({
                    title: 'Отзыв о Столовой',
                    text: shareText,
                    url: window.location.href
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

