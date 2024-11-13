const neo4j = require('neo4j-driver');
const User = require('../models/User');

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const { driver } = require('../config/neo4j');

const getRecommendations = async (req, res) => {
    const session = driver.session();
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const mainUser = await User.findById(userId);
        if (!mainUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userUserSet = new Set();
        const userUserResult = await session.run(
            `MATCH (u:User {id: $userId})-[:CONNECTED*1..2]-(other:User)
             WHERE u.id <> other.id
             RETURN other.id AS userId`,
            { userId }
        );
        userUserResult.records.forEach(record => userUserSet.add(record.get('userId')));

        const userLanguageSet = new Set();
        const languagesResult = await session.run(
            `MATCH (u:User {id: $userId})-[:KNOWS]->(l:Language)
             RETURN l.name AS language`,
             {userId}
        );
        const languagesKnown = languagesResult.records.map(record => record.get('language'));

        const userLanguageResult = await session.run(
            `MATCH (u:User)-[:KNOWS]->(l:Language)
             WHERE l.name IN $languagesKnown
             RETURN u.id AS userId, COLLECT(l.name) AS languages`,
            { languagesKnown }
        );

        userLanguageResult.records.forEach(record => {
            userLanguageSet.add({
                userId: record.get('userId'),
                languages: record.get('languages')
            });
        });

        const recommendedUsers = [];
        for(let userLanguage of userLanguageSet) {
            const user = await User.findById(userLanguage.userId);
            if(!user || user.id === mainUser.id) continue; // Skip if the user is the main user

            const similarityScore = userLanguage.languages.filter(language => languagesKnown.includes(language)).length;
            let score = similarityScore;

            if(userUserSet.has(userLanguage.userId)) {
                score += 10; // Boost score if close connection
            }
            recommendedUsers.push({user, score});
        }

        recommendedUsers.sort((a,b) => b.score - a.score);
        const topRecommendations = recommendedUsers.slice(0, 10);
        res.status(200).json({
            message : 'Recommendations fetched successfully',
            recommendations : topRecommendations
        });
    } catch(error) {
        console.error('Error in fetching recommendations', error.message);
        res.status(500).send('Server error');
    } finally {
        session.close();
    }
};

module.exports = getRecommendations;
