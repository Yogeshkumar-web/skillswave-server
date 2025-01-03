import { asyncHandler } from '../utils/async-handler';
import apiResponse from '../utils/api-response';
import { UserModel } from '../models/user.model';
import { CookieOptions, Request, Response } from 'express';
import { VerificationTokenModel } from '../models/verificationtoken.model';
import crypto from 'crypto';
import envVariables from '../config';
import { sendEmail } from '../utils/send-email';
import { RefreshTokenModel } from '../models/refreshtoken.model';
import { DecodedToken } from '../types';
import jwt from 'jsonwebtoken';
import { ErrorCodes, HttpStatusCodes } from '../config/status-codes';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, confirmPassword } = req.body;

  // Validate required fields
  if (!fullName || !email || !password) {
    return apiResponse(res, {
      success: false,
      message: 'All fields are required',
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: ErrorCodes.DATA_TOO_SHORT,
    });
  }

  // match password
  if (password !== confirmPassword) {
    // return apiResponse(res, false, 'Enter the same password!', null, 400);
    return apiResponse(res, {
      success: false,
      message: 'Enter the same password',
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: ErrorCodes.PASSWORD_MISMATCH,
    });
  }

  // Check for existing user
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return apiResponse(res, {
      success: false,
      message: 'User with this email already exist',
      statusCode: HttpStatusCodes.CONFLICT,
    });
  }

  // Create unverified user
  const user = await UserModel.create({
    fullName,
    email,
    password,
  });

  // Generate a verification token and expiration
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Token expires in 15 mins

  // Save verification token in the database
  await VerificationTokenModel.create({
    user: user._id,
    token,
    expiresAt,
  });

  // Construct the verification URL
  const verificationUrl = `${envVariables.app.clientUrl}/auth/verify-email?token=${token}`;

  // Send the email
  const emailFrom = envVariables.app.emailFrom;
  const emailResponse = await sendEmail({
    email: emailFrom,
    fullName,
    verificationUrl,
  });
  if (!emailResponse.success) {
    // Roll back user creation if email fails to send
    await user.deleteOne();
    await VerificationTokenModel.deleteOne({ user: user._id });
    return apiResponse(res, {
      success: false,
      message: 'Failed to sent verification email',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  // Send success response
  return apiResponse(res, {
    success: true,
    message: 'Verification email sent successfully',
    statusCode: HttpStatusCodes.OK,
  });
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  // Check for the presence of token
  if (!token) {
    return apiResponse(res, {
      success: false,
      message: 'Verification token is required',
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: ErrorCodes.MISSING_FIELDS,
    });
  }

  // Find token in the database
  const verificationToken = await VerificationTokenModel.findOne({ token });
  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return apiResponse(res, {
      success: false,
      message: 'Token is invalid or has expired',
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: ErrorCodes.INVALID_TOKEN,
    });
  }

  // Activate user
  const user = await UserModel.findByIdAndUpdate(
    verificationToken.user,
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return apiResponse(res, {
      success: false,
      message: 'User not found',
      statusCode: HttpStatusCodes.NOT_FOUND,
      error: ErrorCodes.NOT_FOUND,
    });
  }

  // Delete the token
  await VerificationTokenModel.deleteOne({ token });

  return apiResponse(res, {
    success: true,
    message: 'Email verified successfully',
    statusCode: HttpStatusCodes.OK,
  });
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return apiResponse(res, {
      success: false,
      message: 'Please provide email and password',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  }

  // Check if the user exists
  const user = await UserModel.findOne({ email });
  if (!user) {
    return apiResponse(res, {
      success: false,
      message: 'Invalid credentials',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  // Check if email is verified
  if (!user.isVerified) {
    return apiResponse(res, {
      success: true,
      message: 'Please verify your email before logging in',
      statusCode: HttpStatusCodes.FORBIDDEN,
    });
  }

  // Verify the password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    // return apiResponse(res, false, 'Incorrect password', null, 401);
    return apiResponse(res, {
      success: false,
      message: 'Incorrect password',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  // Delete the existing refresh token for this user
  await RefreshTokenModel.deleteOne({ user: user._id });

  // Generate access and refresh tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const refreshTokenExpiry = envVariables.tokens.refreshToken.expiry;
  const expiresAt = new Date(Date.now() + Number(refreshTokenExpiry) * 1000);

  await RefreshTokenModel.create({
    user: user._id,
    token: refreshToken,
    expiresAt: expiresAt,
  });

  //options
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
    sameSite: 'none', // Adjust based on your frontend-backend setup
    path: '/', // Cookies will be available site-wide
  };

  // remove the password and other unnecessary fields

  const filteredUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    image: user.image,
  };

  // Send tokens in response (securely in cookies)
  return apiResponse(
    res
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options),

    {
      success: true,
      message: 'Login successfull',
      statusCode: HttpStatusCodes.OK,
      data: { user: filteredUser },
    }
  );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  // Check if the refresh token exists
  if (!refreshToken) {
    return apiResponse(res, {
      success: false,
      message: 'No refresh token provided for logout',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  }
  // Find and delete the refresh token from the database
  await RefreshTokenModel.findOneAndDelete({ token: refreshToken });

  //options
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
    sameSite: 'none', // Adjust based on your frontend-backend setup
    path: '/', // Cookies will be available site-wide
  };

  // Clear cookies
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);

  // Send response indicating successful logout
  return apiResponse(res, {
    success: true,
    message: 'Logout successfull',
    statusCode: HttpStatusCodes.OK,
  });
});

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;

  // If no token is present, respond with a 401 (Unauthorized)
  if (!accessToken) {
    return apiResponse(res, {
      success: false,
      message: 'Not authentication',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  // Verify the token
  const decodedToken = jwt.verify(
    accessToken,
    envVariables.tokens.accessToken.secret!
  ) as DecodedToken;

  if (!decodedToken) {
    return apiResponse(res, {
      success: false,
      message: 'User not found',
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  }

  // Find the user by ID from the decoded token
  const user = await UserModel.findById(decodedToken._id).select('-password');

  if (!user) {
    return apiResponse(res, {
      success: false,
      message: 'User not found',
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  }

  // Send the user profile in the response
  return apiResponse(res, {
    success: true,
    message: 'User profile retrieved successfully',
    data: user,
    statusCode: HttpStatusCodes.OK,
  });
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return apiResponse(res, {
      success: false,
      message: 'Refresh token missing',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  const storedToken = await RefreshTokenModel.findOne({ token: refreshToken });

  if (!storedToken) {
    return apiResponse(res, {
      success: false,
      message: 'Invalid refresh token',
      statusCode: HttpStatusCodes.FORBIDDEN,
    });
  }

  const decodedToken = jwt.verify(
    refreshToken,
    envVariables.tokens.refreshToken.expiry
  ) as DecodedToken;

  if (!decodedToken) {
    return apiResponse(res, {
      success: false,
      message: 'Invalid refresh token',
      statusCode: HttpStatusCodes.FORBIDDEN,
    });
  }

  // find the user by decoded token
  const user = await UserModel.findById(decodedToken._id).select('-password');

  if (!user) {
    return apiResponse(res, {
      success: false,
      message: 'User not found',
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  }

  // generate access token

  const accessToken = user.generateAccessToken();

  //options
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
    sameSite: 'none', // Adjust based on your frontend-backend setup
    path: '/', // Cookies will be available site-wide
  };

  return apiResponse(res.cookie('accessToken', accessToken, options), {
    success: true,
    message: 'Access token refreshed',
    statusCode: HttpStatusCodes.OK,
  });
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshAccessToken,
};
