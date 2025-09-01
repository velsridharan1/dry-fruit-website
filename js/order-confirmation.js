// js/order-confirmation.js
document.addEventListener('DOMContentLoaded', () => {
    const orderNumberElement = document.getElementById('order-number');

    // Retrieve order number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');

    if (orderNumberElement && orderNumber) {
        orderNumberElement.textContent = orderNumber;
    } else if (orderNumberElement) {
        orderNumberElement.textContent = 'N/A';
    }

    // Clear the cart after displaying the order confirmation
    localStorage.removeItem('cart');
    
    // Since the cart is now empty, we can try to update the cart icon if it exists.
    updateCartIcon();
});

function updateCartIcon() {
    // This function assumes a cart icon structure exists in the HTML.
    // It's designed to be safe even if the icon is not on the page.
    const cartItemCountElement = document.getElementById('cart-item-count');
    if (cartItemCountElement) {
        cartItemCountElement.textContent = '0';
    }
}
