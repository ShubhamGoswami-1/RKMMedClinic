import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../src/models/user.js';
import AppError from './appError.js';
import { asyncErrorHandler } from './asyncErrorHandler.js';

/**
 * Middleware to validate request data
 * @param {Object} schema - Validation schema for different parts of the request
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const validate = (schema, options = {}) => {
  return (req, res, next) => {
    let error = null;
    
    // Validate request body if schema provided
    if (schema.body) {
      // You can implement your own validation logic here
      // This is a simplified example without using JOI
      const requiredFields = schema.body.required || [];
      const allowedFields = schema.body.allowed || [];
      
      // Special validation for login endpoint
      if (options.endpoint === 'login') {
        // Ensure either email or userName is provided
        if (!req.body.email && !req.body.userName) {
          error = new AppError('Either email or userName is required for login', 400);
        }
      } else {
        // Standard required field validation
        for (const field of requiredFields) {
          if (req.body[field] === undefined) {
            error = new AppError(`Field '${field}' is required in request body`, 400);
            break;
          }
        }
      }
      
      // Optional: Check for unknown fields if allowedFields is provided
      if (!error && allowedFields.length > 0) {
        const unknownFields = Object.keys(req.body).filter(
          field => !allowedFields.includes(field)
        );
        
        if (unknownFields.length > 0) {
          error = new AppError(
            `Unknown field(s) in request body: ${unknownFields.join(', ')}`,
            400
          );
        }
      }
    }
    
    // Similar validation can be added for query params, path params, etc.
    if (!error && schema.query) {
      // Implement query validation
    }
    
    if (!error && schema.params) {
      // Implement params validation
    }
    
    if (error) {
      return next(error);
    }
    
    next();
  };
};

/**
 * Middleware to authorize requests using JWT token
 * @returns {Function} Express middleware
 */
export const authorize = () => {
  return asyncErrorHandler(async (req, res, next) => {
    // 1) Get token from headers
    const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];
    
    if (!accessToken) {
      return next(new AppError('Authentication token is missing', 401));
    }
    
    try {
      // 2) Verify token
      const decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_SECRET);
      
      // 3) Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new AppError('The user belonging to this token no longer exists', 401));
      }
      
      // 4) Check if user changed password after token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again', 401));
      }
      
      // 5) Add user info to request
      req.loggedInUser = user;
      next();
    } catch (err) {
      return next(new AppError('Invalid or expired token', 401));
    }
  });
};

/**
 * Middleware to protect routes - only authenticated users can access
 */
export const protect = asyncErrorHandler(async (req, res, next) => {
  // 1) Get token from headers
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

/**
 * Middleware to restrict routes to specific user roles
 * @param  {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'staff', etc]
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

/**
 * Handle cast error from Mongoose
 */
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Handle duplicate field error from MongoDB
 */
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle validation errors from Mongoose
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Send detailed error response in development environment
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Send simplified error response in production environment
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Always send detailed error in development
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Send simplified error in production
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
