const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { driver, session } = require('../config/neo4j');

const signup = async (req, res) => {
    const { email, password, githubProfile, linkedinProfile, firstName, lastName } = req.body;
    try {
        // Check if user already exists in MongoDB
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user document in MongoDB with first name and last name
        user = new User({
            email,
            password: hashedPassword,
            githubProfile,
            linkedinProfile,
            firstName,   // Adding first name
            lastName     // Adding last name
        });

        // Save user to MongoDB
        await user.save();

        // Add user to Neo4j using only the MongoDB _id (userId)
        const userId = user._id.toString(); // MongoDB _id
        const result = await session.run(
            'CREATE (u:User {id: $userId}) RETURN u', // Only using userId for Neo4j node
            { userId }
        );

        // Retrieve the created user from Neo4j
        const createdUser = result.records[0].get('u').properties;

        // Close the Neo4j session
        session.close();

        // Respond with success
        res.status(201).json({
            message: 'User created successfully',
            user: createdUser,
        });
    } catch (err) {
        console.error('Error during signup:', err.message);
        res.status(500).send('Server error');
    }
};



const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        res.json({ token });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


module.exports = {signup, login};