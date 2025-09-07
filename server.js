const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const session = require('express-session');
const os = require('os');

// --- Environment Variable Check ---
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || !process.env.GOOGLE_CREDENTIALS_JSON)) {
    console.error("FATAL ERROR: In production, required environment variables (SESSION_SECRET, GOOGLE_CREDENTIALS_JSON) must be set.");
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());
app.use(cors());

// Trust the first proxy, which is required for sessions to work on App Engine
app.set('trust proxy', 1); 

// --- Session Configuration ---
const sessionSecret = process.env.SESSION_SECRET || 'a-default-secret-for-local-dev';
app.use(session({
    secret: sessionSecret,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
        httpOnly: true, // Prevent client-side JS from accessing the cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-domain cookies
        path: '/', // Make the cookie available across the entire site
    }
}));

// --- BigQuery Configuration ---
let bigquery;
// When in production on GCP, the library will use Application Default Credentials.
if (process.env.NODE_ENV === 'production') {
    bigquery = new BigQuery();
} else {
    // For local development, use the key file.
    bigquery = new BigQuery({
        projectId: 'calcium-hope-460307-p3',
        keyFilename: 'calcium-hope-460307-p3-2260b71c02f0.json',
    });
}

const datasetId = 'ORDERS';
const ordersTableId = 'orders';
const adminUsersTableId = 'admin_users';

// --- Authentication Middleware ---
function checkAuth(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    res.redirect('/login.html');
}

// --- Routes ---

// ** FIX: Define specific routes BEFORE the general static file server **

// Homepage Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dryfruits.html'));
});

// Protected Admin Page Route
app.get('/admin.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ** FIX: The static file server is now last, to catch all other files **
app.use(express.static(__dirname));

// --- API Endpoints ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = `SELECT * FROM \`${datasetId}.${adminUsersTableId}\` WHERE username = @username AND password = @password`;
        const options = {
            query: query,
            params: { username: username, password: password },
        };
        const [rows] = await bigquery.query(options);

        if (rows.length > 0) {
            req.session.isAuthenticated = true;
            req.session.username = username;
            // Explicitly save the session before sending the response
            req.session.save(err => {
                if (err) {
                    console.error('--- [ERROR] Session save failed:', err);
                    return res.status(500).json({ success: false, message: 'Session save failed.' });
                }
                res.json({ success: true, message: 'Login successful' });
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('--- [ERROR] Login failed:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to log out.' });
        }
        res.redirect('/login.html');
    });
});

app.post('/api/orders', async (req, res) => {
  try {
    const receivedData = req.body;
    // Use the OS's temporary directory, which is writable in App Engine
    const tempFileName = `order-debug-${Date.now()}.json`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    const cleanPayload = {
        order_id: String(receivedData.order_id || ''),
        order_date: receivedData.order_date,
        customer_name: String(receivedData.customer_name || ''),
        customer_email: String(receivedData.customer_email || ''),
        shipping_address: String(receivedData.shipping_address || ''),
        billing_address: String(receivedData.billing_address || ''),
        order_items: Array.isArray(receivedData.order_items) ? receivedData.order_items : [],
        total_amount: Number(receivedData.total_amount || 0),
        status: 'Pending'
    };

    let fileContent = JSON.stringify(cleanPayload);
    // This regex ensures that numbers without decimal points are formatted as floats for BigQuery.
    fileContent = fileContent.replace(/"(price|total_amount)":(\d+)(?![\.\d])/g, '"$1":$2.0');
    await fs.writeFile(tempFilePath, fileContent);

    const metadata = {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        schema: {
            fields: [
                { name: 'order_id', type: 'STRING', mode: 'REQUIRED' },
                { name: 'order_date', type: 'TIMESTAMP', mode: 'REQUIRED' },
                { name: 'customer_name', type: 'STRING' },
                { name: 'customer_email', type: 'STRING' },
                { name: 'shipping_address', type: 'STRING' },
                { name: 'billing_address', type: 'STRING' },
                { name: 'order_items', type: 'RECORD', mode: 'REPEATED', fields: [
                    { name: 'product_name', type: 'STRING' }, { name: 'size', type: 'STRING' },
                    { name: 'quantity', type: 'INTEGER' }, { name: 'price', type: 'FLOAT' },
                ]},
                { name: 'total_amount', type: 'FLOAT' },
                { name: 'status', type: 'STRING' },
            ],
        },
    };

    await bigquery.dataset(datasetId).table(ordersTableId).load(tempFilePath, metadata);
    await fs.unlink(tempFilePath);

    console.log(`--- [SUCCESS] Order ${cleanPayload.order_id} loaded. ---`);
    res.status(200).json({ success: true, message: 'Order placed successfully!' });

  } catch (error) {
    console.error('--- [ERROR] Placing order:', error);
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    res.status(500).json({ success: false, message: 'Failed to place order.', error: errorMessage });
  }
});

app.put('/api/admin/orders/:orderId', checkAuth, async (req, res) => {
    try {
        const query = `SELECT * FROM \`${datasetId}.${ordersTableId}\` ORDER BY order_date DESC`;
        const [rows] = await bigquery.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching orders for admin:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
});

// New endpoint for bulk status updates
app.put('/api/admin/orders/bulk-update', checkAuth, async (req, res) => {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
        return res.status(400).json({ success: false, message: 'Order IDs and status are required.' });
    }

    try {
        // BigQuery's UPDATE statement is the most efficient way to do this.
        // We use UNNEST to handle the array of order IDs.
        const query = `
            UPDATE \`${datasetId}.${ordersTableId}\`
            SET status = @status
            WHERE order_id IN UNNEST(@orderIds)
        `;
        const options = {
            query: query,
            params: { 
                status: status,
                orderIds: orderIds 
            },
        };
        await bigquery.query(options);
        console.log(`--- [SUCCESS] Bulk updated ${orderIds.length} orders to ${status}. ---`);
        res.status(200).json({ success: true, message: `Successfully updated ${orderIds.length} orders.` });

    } catch (error) {
        console.error('--- [ERROR] Bulk updating orders:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred during bulk update.' });
    }
});


app.put('/api/admin/orders/:orderId', checkAuth, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    try {
        const [allRows] = await bigquery.dataset(datasetId).table(ordersTableId).getRows();
        let orderFound = false;
        const updatedRows = allRows.map(row => {
            if (row.order_id === orderId) {
                orderFound = true;
                row.status = status;
            }
            row.order_date = new Date(row.order_date.value).toISOString();
            return row;
        });

        if (!orderFound) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const tempFileName = `update-job-${Date.now()}.json`;
        const tempFilePath = path.join(__dirname, tempFileName);
        const fileContent = updatedRows.map(row => JSON.stringify(row)).join('\n');
        await fs.writeFile(tempFilePath, fileContent);

        const metadata = {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            writeDisposition: 'WRITE_TRUNCATE',
            schema: {
                fields: [
                    { name: 'order_id', type: 'STRING', mode: 'REQUIRED' },
                    { name: 'order_date', type: 'TIMESTAMP', mode: 'REQUIRED' },
                    { name: 'customer_name', type: 'STRING' },
                    { name: 'customer_email', type: 'STRING' },
                    { name: 'shipping_address', type: 'STRING' },
                    { name: 'billing_address', type: 'STRING' },
                    { name: 'order_items', type: 'RECORD', mode: 'REPEATED', fields: [
                        { name: 'product_name', type: 'STRING' }, { name: 'size', type: 'STRING' },
                        { name: 'quantity', type: 'INTEGER' }, { name: 'price', type: 'FLOAT' },
                    ]},
                    { name: 'total_amount', type: 'FLOAT' },
                    { name: 'status', type: 'STRING' },
                ],
            },
        };

        await bigquery.dataset(datasetId).table(ordersTableId).load(tempFilePath, metadata);
        await fs.unlink(tempFilePath);

        console.log(`--- [SUCCESS] Order ${orderId} status updated to ${status}.`);
        res.status(200).json({ success: true, message: `Order ${orderId} status updated to ${status}.` });

    } catch (error) {
        console.error(`--- [ERROR] Updating order ${orderId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to update order status.', error: error.message });
    }
});

// New endpoint for bulk status updates
app.put('/api/admin/orders/bulk-update', checkAuth, async (req, res) => {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
        return res.status(400).json({ success: false, message: 'Order IDs and status are required.' });
    }

    try {
        // BigQuery's UPDATE statement is the most efficient way to do this.
        // We use UNNEST to handle the array of order IDs.
        const query = `
            UPDATE \`${datasetId}.${ordersTableId}\`
            SET status = @status
            WHERE order_id IN UNNEST(@orderIds)
        `;
        const options = {
            query: query,
            params: { 
                status: status,
                orderIds: orderIds 
            },
        };
        await bigquery.query(options);
        console.log(`--- [SUCCESS] Bulk updated ${orderIds.length} orders to ${status}. ---`);
        res.status(200).json({ success: true, message: `Successfully updated ${orderIds.length} orders.` });

    } catch (error) {
        console.error('--- [ERROR] Bulk updating orders:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred during bulk update.' });
    }
});

// --- Server Startup ---
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on('error', (err) => {
    console.error(`--- [FATAL ERROR] An unexpected error occurred during server startup: ---`);
    console.error(err);
    process.exit(1);
});