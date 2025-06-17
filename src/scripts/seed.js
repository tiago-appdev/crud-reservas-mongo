import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { MONGODB_URI } from '../config.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Reservation from '../models/Reservation.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);

    // Clear existing data
    await User.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create sample client users
    const clientPassword = await bcrypt.hash('client123', 10);
    const clients = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: clientPassword,
        role: 'client'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: clientPassword,
        role: 'client'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: clientPassword,
        role: 'client'
      }
    ]);
    console.log('👥 Created sample client users');

    // Create tables
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      const capacity = i <= 10 ? 2 + (i % 4) : 4 + (i % 6); // Vary capacity between 2-8
      tables.push({
        table_number: i,
        capacity: capacity,
        available: true,
        reservations: []
      });
    }
    
    const createdTables = await Table.create(tables);
    console.log(`🪑 Created ${createdTables.length} tables`);

    // Create sample reservations
    const reservations = [];
    const today = new Date();
    
    // Create reservations for the next 7 days
    for (let day = 0; day < 7; day++) {
      const reservationDate = new Date(today);
      reservationDate.setDate(today.getDate() + day);
      
      // Random number of reservations per day (2-8)
      const reservationsPerDay = Math.floor(Math.random() * 7) + 2;
      
      for (let i = 0; i < reservationsPerDay; i++) {
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        const randomTable = createdTables[Math.floor(Math.random() * createdTables.length)];
        const randomHour = 18 + Math.floor(Math.random() * 4); // Between 6 PM and 9 PM
        
        reservationDate.setHours(randomHour, 0, 0, 0);
        
        // Check if table is already reserved at this time
        const existingReservation = reservations.find(r => 
          r.table_id.equals(randomTable._id) && 
          r.date.getTime() === reservationDate.getTime()
        );
        
        if (!existingReservation) {
          const guests = Math.floor(Math.random() * (randomTable.capacity - 1)) + 1;
          
          reservations.push({
            user_id: randomClient._id,
            table_id: randomTable._id,
            date: new Date(reservationDate),
            guests: guests,
            status: 'confirmed'
          });
        }
      }
    }

    const createdReservations = await Reservation.create(reservations);
    console.log(`📅 Created ${createdReservations.length} sample reservations`);

    // Update tables with reservation references
    for (const reservation of createdReservations) {
      await Table.findByIdAndUpdate(
        reservation.table_id,
        { $push: { reservations: reservation._id } }
      );
    }
    console.log('🔗 Updated table-reservation references');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Seed Data Summary:');
    console.log(`   👤 Admin: admin@restaurant.com / admin123`);
    console.log(`   👥 Clients: john@example.com, jane@example.com, mike@example.com / client123`);
    console.log(`   🪑 Tables: ${createdTables.length} tables created`);
    console.log(`   📅 Reservations: ${createdReservations.length} reservations created`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function if this file is executed directly
if (process.argv[2] === '--run') {
  seedData();
}

export default seedData;