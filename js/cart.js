// Global cart variable, initialized from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Global function to save cart to localStorage and update the count in the header
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Global function to update the cart count display in the header
function updateCartCount() {
    const cartIconLink = document.querySelector('.cart-icon-link');
    // This might run on pages without a cart icon, so we need to check for its existence
    if (cartIconLink) {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = cartIconLink.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            // Show or hide the icon based on whether the cart is empty
            cartIconLink.style.display = cartCount > 0 ? 'inline-flex' : 'none';
        }
    }
}

// Global function to add a product to the cart
function addToCart(product) {
    const existingItem = cart.find(item => item.name === product.name && item.size === product.size);
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    saveCart();
    alert(`${product.name} (${product.size}) has been added to your cart.`);
}

// Global function to calculate the price based on the selected size
function calculatePrice(basePrice, sizeLabel) {
    const price = parseFloat(basePrice);
    if (sizeLabel.includes('1kg')) {
        return price;
    }
    if (sizeLabel.includes('500g')) {
        return price / 2;
    }
    if (sizeLabel.includes('250g')) {
        return price / 4;
    }
    return price; // Default to the base price (for 1kg) if no specific size is matched
}

// Expose the necessary functions to the global window object so other scripts can call them
window.addToCart = addToCart;
window.calculatePrice = calculatePrice;

// The rest of the code, which manipulates the DOM for the cart page, runs after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');

    // This function renders the items on the cart page itself
    function renderCartItems() {
        // If we are not on the cart page, this container won't exist, so we exit
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

    // Updates the total price display on the cart page
    function updateCartTotal() {
        if (!cartTotalElement) return;
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        cartTotalElement.textContent = `₹${total.toFixed(2)}`;
    }

    // Adds event listeners for the buttons on the cart page (increase, decrease, remove)
    function addCartActionListeners() {
        if (!cartItemsContainer) return;
        // Using event delegation for efficiency
        cartItemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            const index = target.dataset.index;

            if (target.classList.contains('increase-quantity')) {
                cart[index].quantity++;
                saveCart();
                renderCartItems();
            } else if (target.classList.contains('decrease-quantity')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
                saveCart();
                renderCartItems();
            } else if (target.classList.contains('remove-item')) {
                cart.splice(index, 1);
                saveCart();
                renderCartItems();
            }
        });
    }

    // Initial setup when any page loads
    updateCartCount(); // Update the header count on every page load
    renderCartItems(); // If on the cart page, render the items
});
