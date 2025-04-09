// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

// Configure Passport strategies
module.exports = function(passport) {
  // JWT Strategy for protected routes
  passport.use(
    new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        
        if (user) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by Google ID
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            // Update last login
            user.lastLogin = Date.now();
            await user.save();
            return done(null, user);
          }
          
          // Check if user exists with the same email
          const email = profile.emails && profile.emails[0].value;
          
          if (email) {
            user = await User.findOne({ email });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.lastLogin = Date.now();
              await user.save();
              return done(null, user);
            }
          }
          
          // Create new user with Google data
          const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + 
                          Math.floor(Math.random() * 1000);
          
                          const newUser = new User({
                            username,
                            email: email || null,
                            googleId: profile.id,
                            authType: 'google',
                            profilePicture: profile.photos && profile.photos[0].value,
                            lastLogin: Date.now()
                          });
                          
                          await newUser.save();
                          return done(null, newUser);
                        } catch (err) {
                          return done(err, false);
                        }
                      }
                    )
                  );
                
                  // Serialize and deserialize user
                  passport.serializeUser((user, done) => {
                    done(null, user.id);
                  });
                
                  passport.deserializeUser(async (id, done) => {
                    try {
                      const user = await User.findById(id);
                      done(null, user);
                    } catch (err) {
                      done(err, null);
                    }
                  });
                };