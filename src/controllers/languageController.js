const { driver, session } = require('../config/neo4j');
const User = require('../models/User'); // Import the User model

const setLanguagePreferences = async (req, res) => {
  const { userId, languages } = req.body;

  // Start a session
  const neoSession = driver.session();

  try {
    // Start a transaction
    const txc = neoSession.beginTransaction();

    // Step 1: Set language preferences in Neo4j
    for (let lang of languages) {
      const { language, score } = lang;

      // Only use the userId to create the node and link languages
      await txc.run(
        `MERGE (u:User {id: $userId})  // Match only based on userId
         ON CREATE SET u.createdAt = timestamp()  // Set properties only when the node is created
         MERGE (l:Language {name: $language})  // Match or create the Language node
         MERGE (u)-[r:KNOWS]->(l)  // Create the relationship if it doesn't exist
         SET r.score = $score`,  // Set the score for the relationship
        {
          userId,    // MongoDB _id as the userId
          language,  // The language name
          score      // The score for the language
        }
      );
    }

    // Step 2: Commit the transaction
    await txc.commit();

    // Step 3: Update init_preferences in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.init_preferences = true; // Set init_preferences to true
    await user.save(); // Save the updated user document

    // Step 4: Send success response
    res.status(200).json({ message: 'Language preferences set successfully and MongoDB updated' });

  } catch (error) {
    // If an error occurs, roll back the transaction
    if (neoSession) {
      await neoSession.rollbackTransaction();
    }

    console.error('Error setting language preferences:', error);
    res.status(500).json({ message: 'Error setting language preferences', error: error.message });
  } finally {
    // Close the session
    neoSession.close();
  }
};

module.exports = { setLanguagePreferences };
