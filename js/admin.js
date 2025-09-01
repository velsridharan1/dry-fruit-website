document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();

    // Add event listener for the new logout button
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Redirect to the server's logout endpoint
            window.location.href = '/api/logout';
        });
    }
});

async function fetchOrders() {
    try {
        // Use absolute URL to be safe
        const response = await fetch('http://localhost:3001/api/admin/orders');
        if (!response.ok) {
            // If unauthorized, the server should redirect, but we can also handle it here
            if (response.status === 401) {
                window.location.href = '/login.html';
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const orders = await response.json();
        populateOrdersTable(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        const tableBody = document.querySelector('#orders-table tbody');
        tableBody.innerHTML = '<tr><td colspan="6">Error loading orders. Please try logging in again.</td></tr>';
    }
}

function populateOrdersTable(orders) {
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        // Ensure order_date and total_amount exist before processing
        const orderDate = order.order_date && order.order_date.value ? new Date(order.order_date.value).toLocaleString() : 'N/A';
        const totalAmount = typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : 'N/A';

        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${orderDate}</td>
            <td>${order.customer_name}</td>
            <td>₹${totalAmount}</td>
            <td>
                <select class="status-select" data-order-id="${order.order_id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button class="update-btn" data-order-id="${order.order_id}">Update</button></td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for update buttons
    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', handleStatusUpdate);
    });
}

async function handleStatusUpdate(event) {
    const orderId = event.target.dataset.orderId;
    const statusSelect = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
    const newStatus = statusSelect.value;

    try {
        const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Failed to update status.');
        }

        const result = await response.json();
        alert(result.message);
        fetchOrders(); // Refresh the list

    } catch (error) {
        console.error('Error updating status:', error);
        alert(`Error: ${error.message}`);
    }
}