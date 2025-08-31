import { AuthService } from '../services/auth.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export class AuthController {
    /**
     * Get users who are available to be assigned as doctors
     * @route GET /api/v1/auth/available-doctor-users
     */
    static getAvailableDoctorUsers = asyncErrorHandler(async (req, res, next) => {
        // Get users who don't have a doctor profile yet
        const users = await AuthService.getAvailableDoctorUsers();
        
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    });
    
    static signup = asyncErrorHandler(async (req, res, next) => {
        const { firstName, lastName, userName, password, confirmPassword, role, email } = req.body;

        // Check if all details are provided
        if (!userName || !password || !confirmPassword || !role || !email) {
            return next(new AppError('All credentials are necessary!', 400));
        }

        // Use AuthService for business logic
        const user = await AuthService.signup({
            firstName,
            lastName,
            userName,
            password,
            confirmPassword,
            role,
            email
        });

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully. Awaiting admin approval.',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            }
        });
    });

    static login = asyncErrorHandler(async (req, res, next) => {
        const { email, userName, password } = req.body;
        
        // Determine which identifier to use (email or userName)
        const identifier = email || userName;
        
        // Validate we have an identifier
        if (!identifier) {
            return next(new AppError('Please provide email or userName', 400));
        }
    
        // Call AuthService for login business logic
        const result = await AuthService.login(identifier, password);

        console.log("result: ", result);
        
        if (!result || !result.user) {
            return next(new AppError('Authentication failed', 401));
        }
        
        res.status(200).json({
            status: 'success',
            token: result.token,
            data: {
                user: {
                    id: result.user._id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role,
                    status: result.user.status
                }
            }
        });
    });
    
    static approveUser = asyncErrorHandler(async (req, res, next) => {
        // Handle both approval methods: via URL params (admin approval) or via token (email link)
        let user;
        
        // Get admin ID from authenticated user if available
        const adminId = req.user ? req.user._id : null;
        
        if (req.params.userId) {
            // Method 1: Admin approval via user ID
            // This will be moved to the service layer in the refactored code
            const { userId } = req.params;
            user = await AuthService.approveUserById(userId, adminId);
        } else if (req.body.token) {
            // Method 2: Approval via email token
            const { token } = req.body;
            user = await AuthService.approveUser(token, adminId);
        } else {
            return next(new AppError('User ID or approval token is required', 400));
        }
        
        res.status(200).json({
            status: 'success',
            message: 'User approved successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            }
        });
    });
    
    static rejectUser = asyncErrorHandler(async (req, res, next) => {
        // Handle both rejection methods: via URL params (admin rejection) or via token (email link)
        let user;
        // Check if the user should be deleted instead of just marked as rejected
        const deleteUser = req.body.deleteUser === true;
        
        // Get admin ID from authenticated user if available
        const adminId = req.user ? req.user._id : null;
        
        if (req.params.userId) {
            // Method 1: Admin rejection via user ID
            const { userId } = req.params;
            user = await AuthService.rejectUserById(userId, deleteUser, adminId);
        } else if (req.body.token) {
            // Method 2: Rejection via email token
            const { token } = req.body;
            user = await AuthService.rejectUser(token, deleteUser, adminId);
        } else {
            return next(new AppError('User ID or rejection token is required', 400));
        }
        
        // Check if the user was deleted or just rejected
        const action = deleteUser ? 'deleted' : 'rejected';
        
        res.status(200).json({
            status: 'success',
            message: `User ${action} successfully`,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: deleteUser ? 'deleted' : user.status
                }
            }
        });
    });

    static validateToken = asyncErrorHandler(async (req, res, next) => {
        // If we get here, it means the token is valid and the user is authenticated
        // The protect middleware already validated the token and attached the user to req.user
        
        // Return comprehensive user data to avoid needing a separate profile call
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    status: req.user.status,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    // Include any other needed user fields here
                }
            }
        });
    });

    static getProfile = asyncErrorHandler(async (req, res, next) => {
        // User information is already available in req.user from the protect middleware
        // Just return it
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    status: req.user.status,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                }
            }
        });
    });

}

// **********************************
/*
const crypto = require("crypto");
const { promisify } = require('util');

const User = require('./../models/userModel');

const AppError = require('./../utils/appError');
const asyncErrorHandler = require('./../utils/asyncErrorHandler');



exports.login = asyncErrorHandler(async(req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password){
        return next(new AppError('Enter the email and password for logging in !!! :(', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if(!user){
        return next(new AppError('User Not found!!! :('));
    }

    if(!(await user.correctPassword(password, user.password))){
        return next(new AppError('Invalid Credentials!!! :('))
    }

    createSendToken(user, 200, res);
})

exports.protect = asyncErrorHandler(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if(req.cookies && req.cookies.jwt){
        token = req.cookies.jwt;
        console.log("Checking cookie: ");
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        console.log("Checking headers: ");
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
        return next(new AppError('You are not logged in, please logged in to get access !!! (⩺_⩹)'))
    }
    
    // 2) Token Verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    let currentUser = await User.findOne({email: decoded.email});

    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist ( RIP 八 ) or this user doesn\'t belong to access this route', 401))
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please login again', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
})

exports.restrictTo = (role) => {
    return (req, res, next) => {
        if(role !== req.user.role){
            return next(new AppError(`You are not allowed to do ${req.originalUrl}. Let me remind u, U r a ${req.user.role} ¯\\_(ツ)_/¯`, 403))
        }

        next();
    };
}

exports.logout = (req, res, next) => {
    // const cookieOptions = {
    //     expires: new Date(Date.now() - 10 * 1000), // Set to expire 10 seconds ago
    //     httpOnly: true
    // };

    // // Set the cookie 'jwt' with an expired date, effectively deleting it
    // res.cookie('jwt', '', cookieOptions);
    res.status(200).json({ 
        status: 'success',
        message: 'Logged Out !!! :)'
    });
};


exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {

    // 1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if(!user){
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3. Send it to users's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/check-auth/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}. \nIf you didn't forget the password, please ignore tis email!`;

    try{
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later!'))
    }

})

exports.resetPassword = asyncErrorHandler(async(req, res, next) => {
    // 1. Get user based on the email
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    // 2. If a token has not expired, and there is user, set the new passwod
    if(!user){
        return next(new AppError('Token is invalid or has expired!', 400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3. Update changedPasswordAt property for the user

    // 4. Log the user in, send JWT
    createSendToken(user, 200, res);
});

// ****************************************
*/