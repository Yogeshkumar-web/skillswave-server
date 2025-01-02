import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { UserModel } from '../models/user.model';
import envVariables from '../config';

// Google OAuth configuration
const googleOptions = {
  clientID: envVariables.googleAuth.clientId!,
  clientSecret: envVariables.googleAuth.clientSecret!,
  callbackURL: envVariables.googleAuth.callbackUrl!,
};

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    googleOptions,
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract required fields from the profile
        const { email, name } = profile._json;

        // Ensure email exists
        if (!email) {
          return done(
            new Error('Google account does not have an email'),
            false
          );
        }

        // Check if user exists in the database
        let user = await UserModel.findOne({ email });
        if (!user) {
          // Create a new user in the database
          user = await UserModel.create({
            fullName: name,
            email,
            isVerified: true,
            provider: 'google',
            providerId: profile.id,
          });

          console.log(`New user created via Google OAuth: ${user.email}.`);
        }

        // Generate access and refresh tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Pass user and tokens to Passport
        return done(null, {
          user,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error, false);
      }
    }
  )
);

// Middleware for Google OAuth
export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// Middleware for Google OAuth callback
export const handleGoogleCallback = passport.authenticate('google', {
  session: false,
});
