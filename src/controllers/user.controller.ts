import { asyncHandler } from '../utils/async-handler';
import apiResponse from '../utils/api-response';
import { User } from '../models/user.model';
import { Request, Response } from 'express';
import { VerificationToken } from '../models/verificationtoken.model';
import crypto from 'crypto';
import envVariables from '../config';
import { sendEmail } from '../utils/send-email';
import { RefreshToken } from '../models/refreshtoken.model';
import { DecodedToken } from '../types';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, confirmPassword } = req.body;

  // Validate required fields
  if (!fullName || !email || !password) {
    return apiResponse(res, false, 'All fields are required', null, 400);
  }

  // match password
  if (password !== confirmPassword) {
    return apiResponse(res, false, 'Enter the same password!', null, 400);
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return apiResponse(
      res,
      false,
      'User with this email already exists',
      null,
      409
    );
  }

  // Create unverified user
  const user = await User.create({
    fullName,
    email,
    password,
  });

  // Generate a verification token and expiration
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Token expires in 15 mins

  // Save verification token in the database
  await VerificationToken.create({
    user: user._id,
    token,
    expiresAt,
  });

  // Construct the verification URL
  const verificationUrl = `${envVariables.app.clientUrl}/verify-email?token=${token}`;

  // Send the email
  const emailResponse = await sendEmail({ email, fullName, verificationUrl });
  if (!emailResponse.success) {
    // Roll back user creation if email fails to send
    await user.deleteOne();
    await VerificationToken.deleteOne({ user: user._id });
    return apiResponse(
      res,
      false,
      'Failed to sent verification email',
      null,
      500
    );
  }

  // Send success response
  return apiResponse(
    res,
    true,
    'Verification email sent successfully',
    null,
    200
  );
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  // Check for the presence of token
  if (!token) {
    return apiResponse(res, false, 'Verification token is required', null, 400);
  }

  // Find token in the database
  const verificationToken = await VerificationToken.findOne({ token });
  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return apiResponse(
      res,
      false,
      'Token is invalid or has expired',
      null,
      400
    );
  }

  // Activate user
  const user = await User.findByIdAndUpdate(
    verificationToken.user,
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return apiResponse(res, false, 'User not found', null, 404);
  }

  // Delete the token
  await VerificationToken.deleteOne({ token });

  return apiResponse(res, true, 'Email verified successfully', null, 200);
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return apiResponse(
      res,
      false,
      'Please provide email and password',
      null,
      400
    );
  }

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    // throw new ApiError(401, "Invalid credentials");
    return apiResponse(res, false, 'Invalid credentials', null, 401);
  }

  // Check if email is verified
  if (!user.isVerified) {
    return apiResponse(
      res,
      false,
      'Please verify your email before logging in',
      null,
      403
    );
  }

  // Verify the password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return apiResponse(res, false, 'Incorrect password', null, 401);
  }

  // Delete the existing refresh token for this user
  await RefreshToken.deleteOne({ user: user._id });

  // Generate access and refresh tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const refreshTokenExpiry = envVariables.tokens.refreshToken.expiry;
  const expiresAt = new Date(Date.now() + Number(refreshTokenExpiry) * 1000);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: expiresAt,
  });

  // Now you can remove the password field from the user object before sending the response
  user.password = undefined;

  //options
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Send tokens in response (securely in cookies)
  return apiResponse(
    res
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options),
    true,
    'Login successfull',
    user,
    200
  );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  // Check if the refresh token exists
  if (!refreshToken) {
    return apiResponse(
      res,
      false,
      'No refresh token provided for logout',
      null,
      400
    );
  }
  // Find and delete the refresh token from the database
  await RefreshToken.findOneAndDelete({ token: refreshToken });

  //options
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Clear cookies
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);

  // Send response indicating successful logout
  return apiResponse(res, true, 'Logout successful', null, 200);
});

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;

  // If no token is present, respond with a 401 (Unauthorized)
  if (!accessToken) {
    return apiResponse(res, false, 'Not authenticated', null, 401);
  }

  try {
    // Verify the token
    const decodedToken = jwt.verify(
      accessToken,
      envVariables.tokens.accessToken.secret!
    ) as DecodedToken;

    // Find the user by ID from the decoded token
    const user = await User.findById(decodedToken._id).select('-password');

    if (!user) {
      return apiResponse(res, false, 'User not found', null, 404);
    }

    // Send the user profile in the response
    return apiResponse(
      res,
      true,
      'User profile retrieved successfully',
      user,
      200
    );
  } catch (error) {
    return apiResponse(res, false, 'Invalid token', null, 401);
  }
});

export { registerUser, verifyEmail, loginUser, logoutUser, getUserProfile };
