import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MONGODB_URI } from '../config.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Reservation from '../models/Reservation.js';

dotenv.config();

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial schema setup',
    up: async () => {
      // Ensure indexes exist
      await User.createIndexes();
      await Table.createIndexes();
      await Reservation.createIndexes();
      console.log('✅ Created database indexes');
    }
  },
  {
    version: '1.1.0',
    description: 'Add compound indexes for performance',
    up: async () => {
      // Add compound index for reservation queries
      await Reservation.collection.createIndex(
        { user_id: 1, date: 1 },
        { name: 'user_date_idx' }
      );
      
      // Add compound index for table availability queries
      await Table.collection.createIndex(
        { available: 1, capacity: 1 },
        { name: 'available_capacity_idx' }
      );
      
      // Add index for reservation date queries
      await Reservation.collection.createIndex(
        { date: 1, table_id: 1 },
        { name: 'date_table_idx' }
      );
      
      console.log('✅ Created performance indexes');
    }
  }
];

const MigrationSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model('Migration', MigrationSchema);

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get applied migrations
    const appliedMigrations = await Migration.find().sort({ appliedAt: 1 });
    const appliedVersions = appliedMigrations.map(m => m.version);
    
    console.log(`📋 Found ${appliedMigrations.length} applied migrations`);

    // Run pending migrations
    let pendingCount = 0;
    for (const migration of migrations) {
      if (!appliedVersions.includes(migration.version)) {
        console.log(`⏳ Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          
          // Record migration as applied
          await Migration.create({
            version: migration.version,
            description: migration.description
          });
          
          console.log(`✅ Migration ${migration.version} completed`);
          pendingCount++;
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already applied`);
      }
    }

    if (pendingCount === 0) {
      console.log('✨ Database is up to date, no migrations needed');
    } else {
      console.log(`✅ Applied ${pendingCount} migrations successfully`);
    }
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

const listMigrations = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const appliedMigrations = await Migration.find().sort({ appliedAt: 1 });
    const appliedVersions = appliedMigrations.map(m => m.version);
    
    console.log('\n📋 Migration Status:');
    console.log('===================');
    
    for (const migration of migrations) {
      const status = appliedVersions.includes(migration.version) ? '✅ Applied' : '⏳ Pending';
      const appliedDate = appliedMigrations.find(m => m.version === migration.version)?.appliedAt;
      
      console.log(`${status} ${migration.version} - ${migration.description}`);
      if (appliedDate) {
        console.log(`    Applied: ${appliedDate.toISOString()}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error listing migrations:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Command line interface
const command = process.argv[2];

if (command === '--run') {
  runMigrations();
} else if (command === '--list') {
  listMigrations();
} else if (command === '--help') {
  console.log(`
Database Migration Tool

Usage:
  npm run migrate         - Run pending migrations
  node scripts/migrate.js --run   - Run pending migrations
  node scripts/migrate.js --list  - List migration status
  node scripts/migrate.js --help  - Show this help
  `);
} else {
  runMigrations();
}

export { runMigrations, listMigrations };