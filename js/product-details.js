document.addEventListener('DOMContentLoaded', () => {
    const addToCartButton = document.querySelector('.product-info button');
    if (!addToCartButton) return;

    addToCartButton.addEventListener('click', () => {
        const productName = document.querySelector('.product-info h2').textContent;
        const productImage = document.querySelector('.product-image img').src;
        const selectedSizeRadio = document.querySelector('input[name="size"]:checked');
        const selectedSizeLabel = document.querySelector(`label[for="${selectedSizeRadio.id}"]`).textContent;
        const quantity = parseInt(document.getElementById('quantity').value);
        const basePrice = parseFloat(document.getElementById('product-price').dataset.basePrice);

        const pricePerItem = window.calculatePrice(basePrice, selectedSizeLabel);

        const product = {
            name: productName,
            size: selectedSizeLabel,
            quantity: quantity,
            price: pricePerItem,
            image: productImage 
        };

        window.addToCart(product);
    });
});
