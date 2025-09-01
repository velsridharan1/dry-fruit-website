// Filepath: c:/Users/Dell/webproject/js/cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const cartIconLink = document.querySelector('.cart-icon-link');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function updateCartCount() {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartIconLink) {
            const cartCountElement = cartIconLink.querySelector('.cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
                cartIconLink.style.display = cartCount > 0 ? 'inline-flex' : 'none';
            }
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            updateCartTotal();
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p>Size: ${item.size}</p>
                    <p>Price: ₹${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="decrease-quantity" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-quantity" data-index="${index}">+</button>
                    <button class="remove-item" data-index="${index}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        updateCartTotal();
        addCartActionListeners();
    }

    function updateCartTotal() {
        if (!cartTotalElement) return;
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        cartTotalElement.textContent = `₹${total.toFixed(2)}`;
    }

    function addCartActionListeners() {
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                cart[index].quantity++;
                saveCart();
                renderCartItems();
            });
        });

        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
                saveCart();
                renderCartItems();
            });
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                cart.splice(index, 1);
                saveCart();
                renderCartItems();
            });
        });
    }

    // Add to Cart functionality
    const addToCartButton = document.querySelector('button:not(.checkout-button)');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const productName = document.querySelector('.product-info h2').textContent;
            const productImage = document.querySelector('.product-image img').src;
            const selectedSize = document.querySelector('input[name="size"]:checked').value;
            const quantity = parseInt(document.querySelector('#quantity').value, 10);
            const priceText = document.querySelector('#product-price').textContent;
            const price = parseFloat(priceText.replace('₹', ''));

            const existingItemIndex = cart.findIndex(item => item.name === productName && item.size === selectedSize);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += quantity;
            } else {
                const cartItem = {
                    name: productName,
                    image: productImage,
                    size: selectedSize,
                    quantity: quantity,
                    price: price / quantity, // Store price per unit
                };
                cart.push(cartItem);
            }

            saveCart();
            alert(`${productName} has been added to your cart.`);
        });
    }

    renderCartItems();
    updateCartCount();
});
