import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import { createAccessToken } from '../../libs/jwt.js';

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'client' } = req.body;

    // Check if user already exists
    const userfound = await User.findOne({ email });
    if (userfound) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({ name, email, password: hashedPassword, role });

    // Save user
    const savedUser = await user.save();

    // Create the access token
    const token = await createAccessToken({
      _id: savedUser._id,
      role: savedUser.role
    });

    // Set cookie with token
    res.cookie('token', token);

    // Send response with user details (excluding password)
    res.status(201).json({
      id: savedUser._id,
      username: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      redirectTo: '/reservations'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create the access token
    const token = await createAccessToken({
      _id: userFound._id,
      role: userFound.role,
      name: userFound.name
    });

    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Validar y asignar redirección según el rol del usuario
    let redirectTo;
    if (userFound.role === 'admin') {
      redirectTo = '/dashboard';
    } else if (userFound.role === 'client') {
      redirectTo = '/reservations';
    } else {
      redirectTo = '/'; // Ruta por defecto si el rol es desconocido
    }

    // Asegúrate de incluir `redirectTo` en la respuesta JSON
    return res.status(200).json({
      message: 'Login successful',
      role: userFound.role || 'unknown',
      redirectTo: redirectTo // Esta línea es la clave
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const userProfile = async (req, res) => {
  try {
    // Find user by ID (ID is in req.user, thanks to the auth middleware)
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send user data as response (excluding password)
    res.json({
      id: user._id,
      username: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logoutUser = async (req, res) => {
  try {
    // Clear the token cookie
    res.cookie('token', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
