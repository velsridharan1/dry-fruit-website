const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs/promises');
const path = require('path');

// --- This is a one-time script to add the initial admin user ---

// --- BigQuery Configuration ---
const bigquery = new BigQuery({
  projectId: 'calcium-hope-460307-p3',
  keyFilename: 'calcium-hope-460307-p3-2260b71c02f0.json',
});

const datasetId = 'ORDERS';
const tableId = 'admin_users';

// --- Admin User Data ---
const adminUser = {
    username: 'admin',
    password: 'password' // In a real application, this should be hashed!
};

async function setupAdminUser() {
    const tempFileName = `admin-user-setup-${Date.now()}.json`;
    const tempFilePath = path.join(__dirname, tempFileName);

    try {
        console.log('--- [START] Admin User Setup ---');
        
        // 1. Write user data to a temporary file
        await fs.writeFile(tempFilePath, JSON.stringify(adminUser));
        console.log(`Temporary file created at: ${tempFilePath}`);

        // 2. Define the schema for the admin_users table
        const metadata = {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            schema: {
                fields: [
                    { name: 'username', type: 'STRING' },
                    { name: 'password', type: 'STRING' },
                ],
            },
        };

        // 3. Load the data into BigQuery
        console.log(`Loading data into ${datasetId}.${tableId}...`);
        await bigquery.dataset(datasetId).table(tableId).load(tempFilePath, metadata);
        
        console.log('--- [SUCCESS] Admin user has been added to the BigQuery table. ---');

    } catch (error) {
        console.error('--- [ERROR] Failed to set up admin user: ---');
        const errorMessage = error.errors ? error.errors[0].message : error.message;
        console.error(`Error message: ${errorMessage}`);
        console.error("Full error object:", error);
    } finally {
        // 4. Clean up the temporary file
        try {
            await fs.unlink(tempFilePath);
            console.log('Temporary file deleted.');
        } catch (cleanupError) {
            // Ignore errors if the file was never created
        }
        console.log('--- [END] Admin User Setup ---');
    }
}

setupAdminUser();
