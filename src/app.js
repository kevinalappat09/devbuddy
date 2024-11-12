const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

// Config imports
const connectDB = require('./config/mongo');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes')

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
};

app.use(cors(corsOptions));

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
