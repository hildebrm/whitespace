const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Document = require('../models/Document'); // Add this import
const passport = require('passport');
const { check, validationResult } = require('express-validator');

// Middleware to authenticate JWT token
const auth = passport.authenticate('jwt', { session: false });

router.put(
  '/profile',
  [
    auth,
    check('username', 'Username must be between 3 and 30 characters').optional().isLength({ min: 3, max: 30 }),
    check('email', 'Please include a valid email').optional().isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { username, email, currentPassword, newPassword } = req.body;

      if (username && username !== user.username) {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username already taken' });
        }
        user.username = username;
      }

      if (email && email !== user.email && user.authType === 'local') {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }

      if (newPassword && user.authType === 'local') {
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
      }

      await user.save();

      res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        authType: user.authType,
        profilePicture: user.profilePicture
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;