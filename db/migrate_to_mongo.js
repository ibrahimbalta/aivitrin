'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load .env file manually
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dns = require('dns');

// Force Google DNS to resolve MongoDB SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI is not set in .env file.');
  process.exit(1);
}

const localDbPath = path.join(__dirname, 'data.json');
if (!fs.existsSync(localDbPath)) {
  console.error('Error: Local data.json not found at:', localDbPath);
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // Read local database file
    console.log('Reading local data.json...');
    const rawData = fs.readFileSync(localDbPath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    // Select database and collection
    const database = client.db('aivitrin');
    const collection = database.collection('system_data');

    // Create the document structure
    const dbDoc = {
      _id: 'main',
      version: 1,
      last_updated: new Date().toISOString(),
      data: jsonData
    };

    console.log('Uploading database document to MongoDB Atlas...');
    const result = await collection.replaceOne(
      { _id: 'main' },
      dbDoc,
      { upsert: true }
    );

    console.log('Migration completed successfully!');
    console.log('Matched documents:', result.matchedCount);
    console.log('Modified/Upserted documents:', result.modifiedCount || result.upsertedCount);

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.close();
  }
}

runMigration();
