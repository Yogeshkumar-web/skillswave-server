import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import envVariables from '../config';

// Define the User document interface
export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  isVerified: boolean;
  provider?: string;
  providerId?: string;
  image?: string;
  role: string;
  posts: Schema.Types.ObjectId[];
  comments: Schema.Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    provider: { type: String, enum: ['google', 'github', 'local'] },
    providerId: { type: String },
    image: { type: String },
    role: { type: String, enum: ['admin', 'user', 'writer'], default: 'user' },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
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
    // Compare the provided password with the hashed password stored in the database
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    // Log the error for debugging if needed
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
      envVariables.tokens.accessToken.secret as string, // cast to string to satisfy TypeScript
      {
        expiresIn: envVariables.tokens.accessToken.expiry,
      }
    );
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Token generation failed');
  }
};

// Instance method to generate a refresh token
userSchema.methods.generateRefreshToken = function (): string {
  if (!envVariables.tokens.refreshToken.secret)
    throw new Error('Refresh token secret missing');
  try {
    return jwt.sign(
      { _id: this._id },
      envVariables.tokens.refreshToken.secret as string, // Cast to string for TypeScript compatibility
      { expiresIn: envVariables.tokens.refreshToken.expiry }
    );
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
};

// Define the User model with IUser type
export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
