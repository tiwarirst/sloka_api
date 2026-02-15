/**
 * Database Seeding Script
 * Populates MongoDB with quotes from quotes.json
 * 
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Quote = require('../models/Quotes');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB');

        // Read quotes from JSON file
        const quotesPath = path.join(__dirname, '..', 'quotes.json');
        
        if (!fs.existsSync(quotesPath)) {
            throw new Error('quotes.json file not found');
        }

        const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf-8'));
        console.log(`📖 Found ${quotesData.length} quotes in quotes.json`);

        // Check existing quotes
        const existingCount = await Quote.countDocuments();
        console.log(`📊 Current quotes in database: ${existingCount}`);

        if (existingCount > 0) {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('⚠️  Database already has quotes. Clear and reseed? (y/N): ', resolve);
            });
            rl.close();

            if (answer.toLowerCase() !== 'y') {
                console.log('❌ Seeding cancelled');
                process.exit(0);
            }

            // Clear existing quotes
            await Quote.deleteMany({});
            console.log('🗑️  Cleared existing quotes');
        }

        // Insert quotes
        console.log('📝 Seeding quotes...');
        const result = await Quote.insertMany(quotesData, { ordered: false });
        console.log(`✅ Successfully seeded ${result.length} quotes`);

        // Create indexes
        console.log('📇 Creating indexes...');
        await Quote.createIndexes();
        console.log('✅ Indexes created');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

seedDatabase();
