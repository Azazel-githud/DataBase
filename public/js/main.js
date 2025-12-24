// Общие JavaScript функции для BRAND SHOP

document.addEventListener('DOMContentLoaded', function() {
    // Добавление обработчиков событий для динамических элементов
    
    // Обновление количества товаров в корзине
    const quantityInputs = document.querySelectorAll('input[name="quantity"]');
    quantityInputs.forEach(input => {
        input.addEventListener('change', function() {
            const form = this.closest('form');
            if (form) {
                form.submit();
            }
        });
    });
    
    // Подтверждение удаления товаров из корзины
    const deleteButtons = document.querySelectorAll('.btn-danger');
    deleteButtons.forEach(button => {
        if (button.href && button.href.includes('/cart/')) {
            button.addEventListener('click', function(e) {
                if (!confirm('Вы уверены, что хотите удалить товар из корзины?')) {
                    e.preventDefault();
                }
            });
        }
    });
    
    // Подтверждение отмены заказа
    const cancelOrderButtons = document.querySelectorAll('[action*="/cancel/"]');
    cancelOrderButtons.forEach(button => {
        button.addEventListener('submit', function(e) {
            if (!confirm('Вы уверены, что хотите отменить заказ?')) {
                e.preventDefault();
            }
        });
    });
});

// Функция для обновления количества товаров в корзине
function updateCartQuantity(productId, quantity) {
    fetch('/products/cart/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
    .then(response => {
        if (response.ok) {
            location.reload();
        }
    })
    .catch(error => {
        console.error('Ошибка при обновлении количества товара:', error);
    });
}

// Функция для добавления товара в корзину
function addToCart(productId, quantity = 1) {
    fetch('/products/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
    .then(response => {
        if (response.ok) {
            location.reload();
        }
    })
    .catch(error => {
        console.error('Ошибка при добавлении товара в корзину:', error);
    });
}