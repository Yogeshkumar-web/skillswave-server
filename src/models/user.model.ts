import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import envVariables from '../config';
import { User } from '../types';

export const userSchema = new Schema<User>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    provider: { type: String, enum: ['google', 'github', 'local'] },
    providerId: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: ['admin', 'student', 'teacher', 'user', 'writer'],
      default: 'user',
    },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }], // Relationship with Course
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }], // Relationship with Transaction
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
  }
  next();
});

// Instance method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate an access token
userSchema.methods.generateAccessToken = function (): string {
  try {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
      },
      envVariables.tokens.accessToken.secret as string,
      { expiresIn: envVariables.tokens.accessToken.expiry }
    );
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Token generation failed');
  }
};

// Instance method to generate a refresh token
userSchema.methods.generateRefreshToken = function (): string {
  try {
    return jwt.sign(
      { _id: this._id },
      envVariables.tokens.refreshToken.secret as string,
      { expiresIn: envVariables.tokens.refreshToken.expiry }
    );
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
};

export const UserModel = model<User>('User', userSchema);
