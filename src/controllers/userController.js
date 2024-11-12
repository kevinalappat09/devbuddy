// controllers/userController.js
const User = require('../models/User');

// Function to get profile information of a user
const getProfile = async (req, res) => {
  try {
    // Use findById to directly fetch the user based on the _id
    const user = await User.findById(req.user).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send profile information
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      githubProfile: user.githubProfile,
      linkedinProfile: user.linkedinProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Function to get the init_preferences value for the user
const getInitPreferences = async (req, res) => {
  try {
    // Use findById to fetch only the init_preferences field
    const user = await User.findById(req.user).select('init_preferences');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send init_preferences value
    res.status(200).json({
      init_preferences: user.init_preferences,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getProfile,
  getInitPreferences,
};
