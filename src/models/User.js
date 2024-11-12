const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    githubProfile: {
        type: String,
        default: ''
    },
    linkedinProfile: {
        type: String,
        default: ''
    },
    init_preferences: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('User', userSchema);