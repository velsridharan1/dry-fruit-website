document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;

            tabLinks.forEach(innerLink => innerLink.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    fetchOrders();

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '/api/logout';
        });
    }

    // Bulk update logic
    const bulkUpdateBtn = document.getElementById('bulk-update-btn');
    if (bulkUpdateBtn) {
        bulkUpdateBtn.addEventListener('click', handleBulkUpdate);
    }

    // "Select All" checkbox logic
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('click', () => {
            document.querySelectorAll('#open-orders-table tbody .order-checkbox').forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
});

async function fetchOrders() {
    try {
        const response = await fetch('/api/admin/orders', { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) window.location.href = '/login.html';
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const orders = await response.json();
        
        // Filter orders for the two tabs
        const openOrders = orders.filter(order => order.status === 'Pending');
        const allOrders = orders;

        populateOrdersTable(openOrders, 'open-orders-table');
        populateOrdersTable(allOrders, 'all-orders-table');

    } catch (error) {
        console.error('Error fetching orders:', error);
        const openTableBody = document.querySelector('#open-orders-table tbody');
        const allTableBody = document.querySelector('#all-orders-table tbody');
        const errorMessage = '<tr><td colspan="7">Error loading orders. Please try logging in again.</td></tr>';
        if (openTableBody) openTableBody.innerHTML = errorMessage;
        if (allTableBody) allTableBody.innerHTML = '<tr><td colspan="6">Error loading orders. Please try logging in again.</td></tr>';
    }
}

function populateOrdersTable(orders, tableId) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear existing rows
    const isBulkTable = tableId === 'open-orders-table';

    if (orders.length === 0) {
        const colspan = isBulkTable ? 7 : 6;
        tableBody.innerHTML = `<tr><td colspan="${colspan}">No orders found.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = order.order_date && order.order_date.value ? new Date(order.order_date.value).toLocaleString() : 'N/A';
        const totalAmount = typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : 'N/A';

        let rowHtml = '';
        if (isBulkTable) {
            rowHtml += `<td><input type="checkbox" class="order-checkbox" data-order-id="${order.order_id}"></td>`;
        }
        
        rowHtml += `
            <td>${order.order_id}</td>
            <td>${orderDate}</td>
            <td>${order.customer_name}</td>
            <td>₹${totalAmount}</td>
            <td>
                <select class="status-select" data-order-id="${order.order_id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button class="update-status-btn" data-order-id="${order.order_id}">Update</button></td>
        `;
        row.innerHTML = rowHtml;
        tableBody.appendChild(row);
    });

    // Add event listeners for individual update buttons
    document.querySelectorAll('.update-status-btn').forEach(button => {
        button.addEventListener('click', handleSingleUpdate);
    });
}

async function handleSingleUpdate(event) {
    const orderId = event.target.dataset.orderId;
    const status = document.querySelector(`.status-select[data-order-id="${orderId}"]`).value;
    await updateOrderStatus([orderId], status);
}

async function handleBulkUpdate() {
    const selectedCheckboxes = document.querySelectorAll('#open-orders-table tbody .order-checkbox:checked');
    const orderIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.orderId);
    const status = document.getElementById('bulk-status-select').value;

    if (orderIds.length === 0) {
        alert('Please select at least one order to update.');
        return;
    }

    await updateOrderStatus(orderIds, status);
}

async function updateOrderStatus(orderIds, status) {
    try {
        const response = await fetch(`/api/admin/orders/bulk-update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderIds, status }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to update order status.');
        }

        alert(`Successfully updated ${orderIds.length} order(s) to "${status}".`);
        fetchOrders(); // Refresh the tables

    } catch (error) {
        console.error('Error updating order status:', error);
        alert('An error occurred while updating orders.');
    }
}