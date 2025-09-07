// c:/Users/Dell/webproject/js/checkout.js
document.addEventListener('DOMContentLoaded', () => {
    const sameAsBillingCheckbox = document.getElementById('same-as-billing');
    const shippingInfo = document.getElementById('shipping-info');
    const checkoutForm = document.getElementById('checkout-form');

    if (sameAsBillingCheckbox) {
        sameAsBillingCheckbox.addEventListener('change', () => {
            shippingInfo.style.display = sameAsBillingCheckbox.checked ? 'none' : 'grid';
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = checkoutForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }

            // 1. Generate Order Number
            const generateOrderNumber = () => {
                const timestamp = Date.now();
                const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                return `DF-${timestamp}-${randomNumber}`;
            };
            const orderNumber = generateOrderNumber();

            // 2. Collect Form Data
            const billingName = document.getElementById('billing-name').value;
            const billingEmail = document.getElementById('billing-email').value;
            const billingAddress = `${document.getElementById('billing-address').value}, ${document.getElementById('billing-city').value}, ${document.getElementById('billing-state').value} ${document.getElementById('billing-zip').value}`;
            
            let shippingAddress;
            if (document.getElementById('same-as-billing').checked) {
                shippingAddress = billingAddress;
            } else {
                shippingAddress = `${document.getElementById('shipping-address').value}, ${document.getElementById('shipping-city').value}, ${document.getElementById('shipping-state').value} ${document.getElementById('shipping-zip').value}`;
            }

            // 3. Get Cart Details from localStorage
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const orderItems = cart.map(item => ({
                product_name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: parseFloat(item.price)
            }));
            const totalAmount = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);

            // 4. Construct the Order Payload
            const orderPayload = {
                order_id: orderNumber,
                order_date: new Date().toISOString(),
                customer_name: billingName,
                customer_email: billingEmail,
                shipping_address: shippingAddress,
                billing_address: billingAddress,
                order_items: orderItems,
                total_amount: totalAmount
            };

            // 5. Send Data to the Backend
            try {
                const response = await     fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderPayload),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log('Order submission result:', result);

                // 6. Redirect to Confirmation Page
                window.location.href = `order-confirmation.html?orderNumber=${orderNumber}`;

            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
                alert('Failed to submit order. Please try again.');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Place Order';
                }
            }
        });
    }
});
