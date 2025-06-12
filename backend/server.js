import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import User from "./models/User.js";
import Word from "./models/Word.js";

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
app.post("/api/register", async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Firebase UID i email są wymagane",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Użytkownik już istnieje",
      });
    }

    // Create new user
    const newUser = new User({
      firebaseUid,
      email,
      createdAt: new Date(),
      lastLogin: new Date(),
      learningPreferences: {
        selectedLanguage: null,
        languageSetAt: null,
      },
    });

    await newUser.save();

    res.status(201).json({
      message: "Użytkownik został utworzony pomyślnie",
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    res.status(500).json({
      message: "Błąd serwera podczas rejestracji",
    });
  }
});

// Downloading a random word
app.get("/api/words/random", async (req, res) => {
  try {
    const { lang } = req.query; 

    if (!lang) {
      return res
        .status(400)
        .json({ message: "Parametr 'lang' jest wymagany." });
    }

    // We use MongoDB aggregation to efficiently randomize a single document
    const randomWord = await Word.aggregate([
      { $match: { language: lang } },
      { $sample: { size: 1 } },
    ]);

    if (!randomWord || randomWord.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono słówek dla podanego języka." });
    }

    res.status(200).json(randomWord[0]);
  } catch (error) {
    console.error("Błąd pobierania słówka:", error);
    res.status(500).json({ message: "Błąd serwera podczas pobierania słówka" });
  }
});

// Checking the translation
app.post("/api/words/check", async (req, res) => {
  try {
    const { sourceWord, userAnswer, language } = req.body;

    if (!sourceWord || !userAnswer || !language) {
      return res
        .status(400)
        .json({ message: "Wymagane są: sourceWord, userAnswer i language." });
    }

    const wordInDb = await Word.findOne({ sourceWord, language });

    if (!wordInDb) {
      return res
        .status(404)
        .json({ message: "Podane słowo nie istnieje w bazie." });
    }

    // We compare answers ignoring case and trailing whitespace
    const isCorrect =
      wordInDb.polishTranslation.trim().toLowerCase() ===
      userAnswer.trim().toLowerCase();

    res.status(200).json({
      correct: isCorrect,
      correctAnswer: wordInDb.polishTranslation,
    });
  } catch (error) {
    console.error("Błąd sprawdzania tłumaczenia:", error);
    res
      .status(500)
      .json({ message: "Błąd serwera podczas sprawdzania tłumaczenia" });
  }
});

// Set user language preference
app.post("/api/user/set-language", async (req, res) => {
  try {
    const { firebaseUid, selectedLanguage } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase UID jest wymagany",
      });
    }

    // Validate language if provided
    if (selectedLanguage && !["english", "german"].includes(selectedLanguage)) {
      return res.status(400).json({
        message: "Nieprawidłowy język. Dostępne opcje: english, german",
      });
    }

    // Update user's language preference
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "learningPreferences.selectedLanguage": selectedLanguage,
        "learningPreferences.languageSetAt": selectedLanguage
          ? new Date()
          : null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: selectedLanguage
        ? "Język został zapisany pomyślnie"
        : "Wybór języka został pominięty",
      user: {
        id: user._id,
        email: user.email,
        learningPreferences: user.learningPreferences,
      },
    });
  } catch (error) {
    console.error("Błąd zapisywania języka:", error);
    res.status(500).json({
      message: "Błąd serwera podczas zapisywania języka",
    });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Firebase UID i email są wymagane",
      });
    }

    // Find the user and update last login
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        lastLogin: new Date(),
        email, // email update in case of change
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Logowanie pomyślne",
      user: {
        id: user._id,
        email: user.email,
        lastLogin: user.lastLogin,
        profile: user.profile,
        learningPreferences: user.learningPreferences,
      },
    });
  } catch (error) {
    console.error("Błąd logowania:", error);
    res.status(500).json({
      message: "Błąd serwera podczas logowania",
    });
  }
});

// Check if email exists
app.post("/api/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email jest wymagany",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Nieprawidłowy format emaila",
      });
    }

    // Check if user exists with this email
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik z tym adresem email nie istnieje",
      });
    }

    res.status(200).json({
      message: "Email istnieje w systemie",
      exists: true,
    });
  } catch (error) {
    console.error("Błąd sprawdzania emaila:", error);
    res.status(500).json({
      message: "Błąd serwera podczas sprawdzania emaila",
    });
  }
});

// Get user profile
app.get("/api/user/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        profile: user.profile,
        learningPreferences: user.learningPreferences,
      },
    });
  } catch (error) {
    console.error("Błąd pobierania użytkownika:", error);
    res.status(500).json({
      message: "Błąd serwera podczas pobierania użytkownika",
    });
  }
});

// Update user profile
app.put("/api/user/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { displayName, photoURL } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "profile.displayName": displayName,
        "profile.photoURL": photoURL,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Profil zaktualizowany pomyślnie",
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        learningPreferences: user.learningPreferences,
      },
    });
  } catch (error) {
    console.error("Błąd aktualizacji profilu:", error);
    res.status(500).json({
      message: "Błąd serwera podczas aktualizacji profilu",
    });
  }
});

// Update user language preference (separate endpoint for settings)
app.put("/api/user/:firebaseUid/language", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { selectedLanguage } = req.body;

    // Validate language
    if (selectedLanguage && !["english", "german"].includes(selectedLanguage)) {
      return res.status(400).json({
        message: "Nieprawidłowy język. Dostępne opcje: english, german",
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "learningPreferences.selectedLanguage": selectedLanguage,
        "learningPreferences.languageSetAt": new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Język został zaktualizowany pomyślnie",
      user: {
        id: user._id,
        email: user.email,
        learningPreferences: user.learningPreferences,
      },
    });
  } catch (error) {
    console.error("Błąd aktualizacji języka:", error);
    res.status(500).json({
      message: "Błąd serwera podczas aktualizacji języka",
    });
  }
});

// Middleware for error handling
app.use((err, req, res, next) => {
  console.error("Błąd serwera:", err);
  res.status(500).json({
    message: "Błąd wewnętrzny serwera",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Middleware for non-existent routes - FIXED
app.use((req, res) => {
  res.status(404).json({
    message: "Nie znaleziono endpointa",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
