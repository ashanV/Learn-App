import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import User from "./models/User.js";
import Word from "./models/Word.js";
import quizRoutes from "./routes/quizroutes.js";
import writingRoutes from "./routes/writingRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

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

// API routes
app.use("/api/quiz", quizRoutes);
app.use("/api/writing", writingRoutes);
app.use("/api/user", profileRoutes);

// User registration
app.post("/api/register", async (req, res) => {
  try {
    const { firebaseUid, username, email } = req.body;

    if (!firebaseUid || !username || !email) {
      return res.status(400).json({
        message: "Firebase UID, nazwa użytkownika i email są wymagane",
      });
    }

    // Validate username
    if (username.length < 3) {
      return res.status(400).json({
        message: "Nazwa użytkownika musi mieć co najmniej 3 znaki",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message:
          "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.firebaseUid === firebaseUid) {
        return res.status(409).json({
          message: "Użytkownik już istnieje",
        });
      }
      if (existingUser.email === email) {
        return res.status(409).json({
          message: "Ten adres email jest już zarejestrowany",
        });
      }
      if (existingUser.username === username.toLowerCase()) {
        return res.status(409).json({
          message: "Ta nazwa użytkownika jest już zajęta",
        });
      }
    }

    // Create new user
    const newUser = new User({
      firebaseUid,
      username: username.toLowerCase(),
      email,
      createdAt: new Date(),
      lastLogin: new Date(),
      profile: {
        displayName: username,
      },
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
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Błąd rejestracji:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message =
        field === "username"
          ? "Ta nazwa użytkownika jest już zajęta"
          : field === "email"
          ? "Ten adres email jest już zarejestrowany"
          : "Użytkownik już istnieje";

      return res.status(409).json({ message });
    }

    res.status(500).json({
      message: "Błąd serwera podczas rejestracji",
    });
  }
});

app.post("/api/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "Nazwa użytkownika jest wymagana",
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({
        message: "Nazwa użytkownika musi mieć co najmniej 3 znaki",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message:
          "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia",
      });
    }

    // Check if username exists
    const user = await User.findOne({
      username: username.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "Nazwa użytkownika jest dostępna",
      });
    }

    res.status(200).json({
      message: "Nazwa użytkownika jest już zajęta",
      exists: true,
    });
  } catch (error) {
    console.error("Błąd sprawdzania nazwy użytkownika:", error);
    res.status(500).json({
      message: "Błąd serwera podczas sprawdzania nazwy użytkownika",
    });
  }
});

// Set a daily vocabulary goal
app.put("/api/user/:firebaseUid/daily-goal", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { dailyGoal } = req.body;

    // Daily goal validation
    if (
      !dailyGoal ||
      typeof dailyGoal !== "number" ||
      dailyGoal < 1 ||
      dailyGoal > 100
    ) {
      return res.status(400).json({
        message: "Cel dzienny musi być liczbą między 1 a 100",
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "learningPreferences.dailyGoal": dailyGoal,
        "learningPreferences.dailyGoalSetAt": new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Cel dzienny został zaktualizowany pomyślnie",
      dailyGoal: user.learningPreferences.dailyGoal,
      dailyGoalSetAt: user.learningPreferences.dailyGoalSetAt,
    });
  } catch (error) {
    console.error("Błąd aktualizacji celu dziennego:", error);
    res.status(500).json({
      message: "Błąd serwera podczas aktualizacji celu dziennego",
    });
  }
});

// Get user daily stats
app.get("/api/user/:firebaseUid/daily-stats", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    // Check if today's statistics are up to date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompletedDate = user.dailyStats.lastCompletedDate
      ? new Date(user.dailyStats.lastCompletedDate)
      : null;

    let completedWords = 0;
    let streak = user.dailyStats.streak || 0;

    // If last activity was today, keep current progress
    if (
      lastCompletedDate &&
      lastCompletedDate.toDateString() === today.toDateString()
    ) {
      completedWords = user.dailyStats.completedWords || 0;
    } else if (lastCompletedDate) {
      // Check if the series has not been broken
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastCompletedDate.toDateString() !== yesterday.toDateString()) {
        // Series interrupted - reset
        streak = 0;
        await User.findOneAndUpdate(
          { firebaseUid },
          {
            "dailyStats.streak": 0,
            "dailyStats.completedWords": 0,
          }
        );
      }
    }

    const dailyGoal = user.learningPreferences.dailyGoal || 10;
    const progressPercentage = Math.round((completedWords / dailyGoal) * 100);

    res.status(200).json({
      dailyGoal,
      completedWords,
      progressPercentage: Math.min(progressPercentage, 100),
      streak,
      goalAchieved: completedWords >= dailyGoal,
    });
  } catch (error) {
    console.error("Błąd pobierania statystyk dziennych:", error);
    res.status(500).json({
      message: "Błąd serwera podczas pobierania statystyk dziennych",
    });
  }
});

// Update daily goal progress (call after correct answer)
app.post("/api/user/:firebaseUid/update-daily-progress", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompletedDate = user.dailyStats.lastCompletedDate
      ? new Date(user.dailyStats.lastCompletedDate)
      : null;

    let completedWords = user.dailyStats.completedWords || 0;
    let streak = user.dailyStats.streak || 0;

    // Check if this is the first progress today
    if (
      !lastCompletedDate ||
      lastCompletedDate.toDateString() !== today.toDateString()
    ) {
      // New day
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if the series is continuing
      if (
        lastCompletedDate &&
        lastCompletedDate.toDateString() === yesterday.toDateString()
      ) {
        const dailyGoal = user.learningPreferences.dailyGoal || 10;
        const yesterdayCompleted = user.dailyStats.completedWords || 0;

        if (yesterdayCompleted >= dailyGoal) {
          streak += 1;
        }
      } else if (lastCompletedDate) {
        streak = 0;
      }

      completedWords = 1;
    } else {
      completedWords += 1;
    }

    // Update database
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "dailyStats.completedWords": completedWords,
        "dailyStats.lastCompletedDate": new Date(),
        "dailyStats.streak": streak,
      },
      { new: true }
    );

    const dailyGoal = updatedUser.learningPreferences.dailyGoal || 10;
    const progressPercentage = Math.round((completedWords / dailyGoal) * 100);
    const goalAchieved = completedWords >= dailyGoal;

    // If the goal was achieved for the first time today
    if (goalAchieved && completedWords === dailyGoal) {
      await User.findOneAndUpdate(
        { firebaseUid },
        {
          "dailyStats.streak": streak + 1,
        }
      );
      streak += 1;
    }

    res.status(200).json({
      message: "Postęp zaktualizowany pomyślnie",
      dailyGoal,
      completedWords,
      progressPercentage: Math.min(progressPercentage, 100),
      streak,
      goalAchieved,
      goalJustAchieved: goalAchieved && completedWords === dailyGoal,
    });
  } catch (error) {
    console.error("Błąd aktualizacji postępu dziennego:", error);
    res.status(500).json({
      message: "Błąd serwera podczas aktualizacji postępu dziennego",
    });
  }
});

// Update user's overall stats after a session
app.post("/api/user/:firebaseUid/update-overall-stats", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { correctAnswers, incorrectAnswers } = req.body;

    if (
      typeof correctAnswers !== "number" ||
      typeof incorrectAnswers !== "number"
    ) {
      return res.status(400).json({ message: "Invalid stats provided." });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $inc: {
          "overallStats.totalCorrectAnswers": correctAnswers,
          "overallStats.totalIncorrectAnswers": incorrectAnswers,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Overall stats updated successfully." });
  } catch (error) {
    console.error("Error updating overall stats:", error);
    res.status(500).json({
      message: "Server error while updating overall stats",
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

    // Calculate overall accuracy
    const totalAnswers =
      (user.overallStats?.totalCorrectAnswers || 0) +
      (user.overallStats?.totalIncorrectAnswers || 0);
    const overallAccuracy =
      totalAnswers > 0
        ? Math.round(
            ((user.overallStats.totalCorrectAnswers || 0) / totalAnswers) * 100
          )
        : 0;

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        profile: user.profile,
        learningPreferences: user.learningPreferences,
        overallAccuracy: overallAccuracy,
        masteredWords: user.overallStats?.totalCorrectAnswers || 0,
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
