import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/**
 * Authentication middleware
 * Verifies the JWT token in the request cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const auth = (req, res, next) => {
  try {
    const { token } = req.cookies;

    // Check if token exists
    if (!token) {
      // Handle AJAX or JSON requests
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res
          .status(401)
          .json({ message: 'No token, authorization denied' });
      } else {
        // Redirect to login page for regular requests
        return res.redirect('/login');
      }
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (error, user) => {
      if (error) {
        // Handle invalid token
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(401).json({ message: 'Token is not valid' });
        } else {
          return res.redirect('/login');
        }
      }
      // Attach user information to request and response locals
      req.user = user;
      res.locals.user = user;
      next();
    });
  } catch (error) {
    // Handle any other errors
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).render('error', { message: 'An error occurred' });
    }
  }
};