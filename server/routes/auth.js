const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const {check, validationResult} = require('express-validator');

// Make sure JWT_SECRET is properly defined
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const generateToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
        expiresIn: '7d',
    })
}

router.post('/register', [
    check('username').notEmpty().withMessage('Username is required'),
    check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (email) {
            user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        user = new User({ username, email: email || null, password, authType: 'local' });
        await user.save();
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.authType !== 'local') {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                authType: user.authType,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }),
    (req, res) => {
        // This function will never be called because the user is redirected to Google for authentication
    }
);

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const token = generateToken(req.user);
    // Make sure the redirect URL is an environment variable
    const redirectURL = process.env.CLIENT_ORIGIN || 'https://whitespace-je8t.onrender.com';
    res.redirect(`${redirectURL}/?token=${token}`);
});

router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        authType: req.user.authType,
        profilePicture: req.user.profilePicture,
    });
});

module.exports = router;