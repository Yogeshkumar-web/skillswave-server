import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { UserModel } from '../models/user.model';
import envVariables from '../config';
import { Request } from 'express';
import { JwtPayload } from '../types';

const cookieExtractor = (req: Request) => {
  return req?.cookies?.accessToken || null;
};

const options: StrategyOptions = {
  jwtFromRequest: cookieExtractor, // Use cookie extractor
  secretOrKey: envVariables.tokens.accessToken.secret!,
  algorithms: ['HS256'],
};

// Passport JWT Strategy
passport.use(
  new JwtStrategy(options, async (jwtPayload: JwtPayload, done) => {
    try {
      // Fetch user from the database
      const user = await UserModel.findById(jwtPayload._id).select('-password');

      if (!user) {
        console.error('User not found for the provided JWT payload.');
        return done(null, false, {
          message: 'Invalid token or user not found.',
        });
      }

      // Add additional checks if needed (e.g., user.isActive)
      if (!user.isVerified) {
        console.warn(
          'Attempt to authenticate with an unverified user account.'
        );
        return done(null, false, { message: 'Account not verified.' });
      }

      // User is authenticated
      return done(null, user);
    } catch (error) {
      console.error('Error in Passport JWT strategy:', error);
      return done(error, false);
    }
  })
);

// Auth Middleware for routes
export const authenticateJwt = passport.authenticate('jwt', { session: false });
