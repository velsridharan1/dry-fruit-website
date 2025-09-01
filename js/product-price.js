document.addEventListener('DOMContentLoaded', () => {
    const sizeOptions = document.querySelectorAll('input[name="size"]');
    const quantityInput = document.querySelector('#quantity');
    const priceElement = document.querySelector('#product-price');

    if (!priceElement || !quantityInput || sizeOptions.length === 0) {
        return;
    }

    const basePrice = parseFloat(priceElement.dataset.basePrice);

    const sizeMultipliers = {
        small: 0.25, // 250g
        medium: 0.5,  // 500g
        large: 1.0    // 1kg
    };

    function updatePrice() {
        const selectedSize = document.querySelector('input[name="size"]:checked').value;
        const quantity = parseInt(quantityInput.value, 10);
        const sizeMultiplier = sizeMultipliers[selectedSize];

        if (basePrice && quantity > 0 && sizeMultiplier) {
            const totalPrice = basePrice * sizeMultiplier * quantity;
            priceElement.textContent = `₹${totalPrice.toFixed(2)}`;
        } else {
             priceElement.textContent = `₹${(basePrice * sizeMultipliers['small']).toFixed(2)}`;
        }
    }

    sizeOptions.forEach(option => option.addEventListener('change', updatePrice));
    quantityInput.addEventListener('input', updatePrice);

    // Initial price calculation on page load
    updatePrice();
});
