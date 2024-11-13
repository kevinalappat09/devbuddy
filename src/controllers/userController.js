const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { driver } = require('../config/neo4j');

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

const connectUsers = async (req, res) => {
  const session = driver.session();
  try {
    const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { userIdToConnect } = req.params;

    const mainUser = await User.findById(userId);
    if (!mainUser) {
      return res.status(404).json({ msg: 'Authenticated user not found' });
    }

    const userToConnect = await User.findById(userIdToConnect);
    if (!userToConnect) {
      return res.status(404).json({ msg: 'User to connect not found' });
    }

    await session.run(
      `MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
       MERGE (u1)-[:CONNECTED]->(u2)`,
      { userId1: userId, userId2: userIdToConnect }
    );

    session.close();
    res.status(200).json({
      message: 'User connected successfully',
      user: { firstName: userToConnect.firstName, lastName: userToConnect.lastName }
    });
  } catch (err) {
    console.error(err.message);
    session.close();
    res.status(500).send('Server error');
  }
};

const getConnectedUsers = async (req, res) => {
  const session = driver.session();
  try {
    // Decode token to get the authenticated user ID
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Ensure the user exists in MongoDB (optional, for extra validation)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Neo4j query to get first-degree connections
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:CONNECTED]->(connectedUser:User)
       RETURN connectedUser.id AS userId, connectedUser.firstName AS firstName, connectedUser.lastName AS lastName, connectedUser.githubUrl AS githubUrl, connectedUser.linkedinUrl AS linkedinUrl`,
      { userId }
    );

    // Map result records to an array of connected users
    const connectedUsers = result.records.map(record => ({
      userId: record.get('userId'),
      firstName: record.get('firstName'),
      lastName: record.get('lastName'),
      githubUrl: record.get('githubUrl'),
      linkedinUrl: record.get('linkedinUrl')
    }));

    res.status(200).json({
      message: "Connected users fetched successfully",
      connections: connectedUsers
    });
  } catch (error) {
    console.error('Error fetching connected users:', error.message);
    res.status(500).send('Server error');
  } finally {
    session.close();
  }
};


module.exports = {
  getProfile,
  getInitPreferences,
  connectUsers,
  getConnectedUsers,
};

