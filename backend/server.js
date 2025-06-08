import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import User from "./User.js";

const app = express();
const PORT = 5000;

// Environment configuration
dotenv.config();
app.use(express.static("./"));

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Connection to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ 
        message: 'Firebase UID i email są wymagane' 
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid }, { email }] 
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'Użytkownik już istnieje' 
      });
    }

    // Create new user
    const newUser = new User({
      firebaseUid,
      email,
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await newUser.save();

    res.status(201).json({
      message: 'Użytkownik został utworzony pomyślnie',
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ 
      message: 'Błąd serwera podczas rejestracji' 
    });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ 
        message: 'Firebase UID i email są wymagane' 
      });
    }

    // Find the user and update last login
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        lastLogin: new Date(),
        email // email update in case of change
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        message: 'Użytkownik nie został znaleziony' 
      });
    }

    res.status(200).json({
      message: 'Logowanie pomyślne',
      user: {
        id: user._id,
        email: user.email,
        lastLogin: user.lastLogin,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ 
      message: 'Błąd serwera podczas logowania' 
    });
  }
});

// Get user profile
app.get('/api/user/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ 
        message: 'Użytkownik nie został znaleziony' 
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Błąd pobierania użytkownika:', error);
    res.status(500).json({ 
      message: 'Błąd serwera podczas pobierania użytkownika' 
    });
  }
});

// Update user profile
app.put('/api/user/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { displayName, photoURL } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        'profile.displayName': displayName,
        'profile.photoURL': photoURL
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        message: 'Użytkownik nie został znaleziony' 
      });
    }

    res.status(200).json({
      message: 'Profil zaktualizowany pomyślnie',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Błąd aktualizacji profilu:', error);
    res.status(500).json({ 
      message: 'Błąd serwera podczas aktualizacji profilu' 
    });
  }
});

// Middleware for error handling
app.use((err, req, res, next) => {
  console.error('Błąd serwera:', err);
  res.status(500).json({ 
    message: 'Błąd wewnętrzny serwera',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Middleware for non-existent routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Nie znaleziono endpointa' 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});