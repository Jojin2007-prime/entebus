const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    if (req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Convert email to lowercase before checking and saving
    const emailLower = req.body.email.toLowerCase();
    const userExists = await User.findOne({ email: emailLower });
    
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      name: req.body.name,
      email: emailLower, // Save as lowercase
      password: hashedPassword,
    });
    
    await user.save();
    console.log('✅ New User Registered:', user.email);
    res.json({ message: 'User Registered Successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    // Find user using lowercase email
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email not found' });

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ _id: user._id, email: user.email }, 'SECRET_KEY');
    res.header('auth-token', token).json({ 
      token, 
      user: { name: user.name, email: user.email } 
    });
    console.log('✅ User Logged In:', user.email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATED: RESET PASSWORD ENDPOINT (Case-Insensitive) ---
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // 1. Check if user exists using case-insensitive search
    const user = await User.findOne({ email: email.toLowerCase() }); 
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // 2. Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update user in MongoDB
    user.password = hashedPassword;
    await user.save();

    console.log('🔄 Password Reset Successful for:', email.toLowerCase());
    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
