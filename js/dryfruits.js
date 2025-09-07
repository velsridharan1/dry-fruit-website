document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('product-modal');
    const modalBody = modal.querySelector('.modal-body');
    const closeButton = modal.querySelector('.close-button');

    const productDetails = {
        almonds: {
            name: 'Golden State Almonds',
            tagline: "Nature's Perfect Snack, Packed with Goodness",
            description: "Sourced from the sun-kissed orchards of California, our almonds are the epitome of quality and taste. Each almond is a powerhouse of nutrients, offering a satisfying crunch with every bite. Perfect for a healthy snack, a topping for your favorite dishes, or as a key ingredient in your culinary creations.",
            price: 2760,
            image: 'assets/almonds.jpg'
        },
        cashews: {
            name: 'Creamy Cashews',
            tagline: "Velvety Smooth, Rich in Flavor",
            description: "Our cashews are prized for their creamy texture and rich, buttery flavor. They are a versatile ingredient in both sweet and savory dishes, and make for a luxurious snack on their own.",
            price: 3315,
            image: 'assets/cashews.jpg'
        },
        walnuts: {
            name: 'Crunchy Walnuts',
            tagline: "Brain-Boosting, Earthy Goodness",
            description: "These walnuts are known for their distinctive shape and robust, earthy flavor. They are an excellent source of omega-3 fatty acids and are perfect for baking, salads, or as a wholesome snack.",
            price: 2210,
            image: 'assets/walnuts.jpeg'
        },
        pistachios: {
            name: 'Savory Pistachios',
            tagline: "A Delightfully Nutty Treat",
            description: "Lightly salted and roasted to perfection, our pistachios are a joy to eat. Their vibrant green color and unique flavor make them a favorite for snacking and garnishing.",
            price: 3680,
            image: 'assets/pistachios.jpg'
        },
        raisins: {
            name: 'Sweet Raisins',
            tagline: "Naturally Sweet, Sun-Dried Gems",
            description: "Our raisins are sun-dried to concentrate their natural sweetness. They are a great addition to cereals, baked goods, or can be enjoyed straight out of the bag for a quick energy boost.",
            price: 1840,
            image: 'assets/raisins.jpeg'
        },
        figs: {
            name: 'Dried Figs',
            tagline: "A Taste of the Mediterranean",
            description: "These dried figs are sweet, chewy, and full of flavor. They are a great source of fiber and make a delicious and healthy addition to any diet.",
            price: 2945,
            image: 'assets/figs.jpeg'
        }
    };

    document.querySelectorAll('.open-modal-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('.product-card');
            const productId = productCard.dataset.product; // Corrected from data-product-id
            const details = productDetails[productId];

            if (details) {
                modalBody.innerHTML = `
                    <div class="product-image">
                        <img src="${details.image}" alt="${details.name}">
                    </div>
                    <div class="product-info">
                        <h2>${details.name}</h2>
                        <p class="tagline">${details.tagline}</p>
                        <p class="description">${details.description}</p>
                        <p id="product-price" class="price" data-base-price="${details.price}">₹${details.price} / kg</p>
                        <div class="product-options">
                            <div class="size-options">
                                <label>Size:</label>
                                <input type="radio" id="small" name="size" value="small" checked>
                                <label for="small">Small (250g)</label>
                                <input type="radio" id="medium" name="size" value="medium">
                                <label for="medium">Medium (500g)</label>
                                <input type="radio" id="large" name="size" value="large">
                                <label for="large">Large (1kg)</label>
                            </div>
                            <div class="quantity-selector">
                                <label for="quantity">Quantity:</label>
                                <input type="number" id="quantity" name="quantity" value="1" min="1" max="10">
                            </div>
                        </div>
                        <button class="add-to-cart-btn">Add to Cart</button>
                    </div>
                `;
                modal.style.display = 'block';

                const addToCartBtn = modalBody.querySelector('.add-to-cart-btn');
                addToCartBtn.addEventListener('click', () => {
                    const selectedSizeRadio = modalBody.querySelector('input[name="size"]:checked');
                    const selectedSizeLabel = modalBody.querySelector(`label[for="${selectedSizeRadio.id}"]`).textContent;
                    const quantity = parseInt(modalBody.querySelector('#quantity').value);
                    const basePrice = parseFloat(modalBody.querySelector('#product-price').dataset.basePrice);
                    
                    const pricePerItem = window.calculatePrice(basePrice, selectedSizeLabel);

                    const product = {
                        name: details.name,
                        size: selectedSizeLabel,
                        quantity: quantity,
                        price: pricePerItem,
                        image: details.image
                    };

                    window.addToCart(product);
                    modal.style.display = 'none';
                });
            }
        });
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});
