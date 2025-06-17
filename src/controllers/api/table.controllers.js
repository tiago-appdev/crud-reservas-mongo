// Import necessary models
import Table from '../../models/Table.js';
import Reservation from '../../models/Reservation.js';

/**
 * Create a new table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createTable = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create tables' });
    }

    const { table_number, capacity } = req.body;

    // Check if table already exists
    const existingTable = await Table.findOne({ table_number });
    if (existingTable) {
      return res.status(400).json({
        message: 'Table with the same number already exists'
      });
    }

    // Create and save the new table
    const table = new Table({ table_number, capacity });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all tables
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific table by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateTable = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update tables' });
    }

    const { table_number, capacity, available } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { table_number, capacity, available },
      { new: true, runValidators: true }
    );
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteTable = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tables' });
    }

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if the table has existing reservations
    if (table.reservations.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete table with existing reservations'
      });
    }

    await table.deleteOne();
    res.status(204).json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get available tables based on date, time, and party size
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAvailableTables = async (req, res) => {
  try {
    const { date, time, party_size } = req.query;

    // Check for required query parameters
    if (!date || !time || !party_size) {
      return res
        .status(400)
        .json({ message: 'Missing required query parameters' });
    }

    console.log(
      `Searching for tables: date=${date}, time=${time}, party_size=${party_size}`
    );

    // Combine date and time into a Date object
    const requestDateTime = new Date(`${date}T${time}`);
    const oneDayLater = new Date(new Date(requestDateTime).setDate(requestDateTime.getDate() + 1));

    console.log(`Request DateTime: ${requestDateTime}`);

    // Find tables that match the capacity requirements
    const availableTables = await Table.find({
      available: true,
      capacity: { $gte: parseInt(party_size), $lte: parseInt(party_size) + 3 }
    });

    console.log(`Found ${availableTables.length} tables matching capacity`);

    // Find reservations for the given date
    const reservations = await Reservation.find({
      date: {
        $gte: new Date(date),
        $lt: oneDayLater
      }
    }).populate('table_id');

    console.log(`Found ${reservations.length} reservations for the date`);

    // Filter out tables that have conflicting reservations on the requested date and time
    const filteredTables = availableTables.filter((table) => {
      return !reservations.some((reservation) => {
        // Compare if the table_id in the reservation matches the table being checked
        if (reservation.table_id._id.toString() === table._id.toString()) {
          // Check if the reservation time matches the requested time
          const reservationDateTime = new Date(reservation.date); 
          
          console.log(
            `Checking reservation: Table ${reservation.table_id.table_number}, Time: ${reservationDateTime}`
          );
          return reservationDateTime.getTime() === requestDateTime.getTime(); // Exact match on date and time
        }
        return false;
      });
    });

    console.log(`Filtered to ${filteredTables.length} available tables`);
    filteredTables.forEach((table) =>
      console.log(`Available: Table ${table.table_number}`)
    );

    res.json(filteredTables);
  } catch (error) {
    console.error('Error in getAvailableTables:', error);
    res.status(500).json({
      message: 'An error occurred while fetching available tables',
      error: error.message
    });
  }
};
