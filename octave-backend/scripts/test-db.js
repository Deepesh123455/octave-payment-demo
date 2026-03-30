const { Client } = require('pg');
require('dotenv').config();

async function testConnection(name, url) {
    console.log(`🔍 Testing ${name}...`);
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log(`✅ ${name} is reachable!`);
        await client.end();
    } catch (err) {
        console.error(`❌ ${name} failed:`, err.message);
    }
}

async function run() {
    await testConnection('DATABASE_URL (Pooler: 6543)', process.env.DATABASE_URL);
    await testConnection('DIRECT_URL (Direct: 5432)', process.env.DIRECT_URL);
}

run();
