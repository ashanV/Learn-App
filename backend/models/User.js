import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  profile: {
    displayName: String,
    photoURL: String,
  },
  learningPreferences: {
    selectedLanguage: {
      type: String,
      enum: ["english", "german"],
      default: null,
    },
    languageSetAt: Date,
    dailyGoal: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    dailyGoalSetAt: Date,
  },
  dailyStats: {
    completedWords: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: Date,
    streak: {
      type: Number,
      default: 0,
    },
  },
  overallStats: {
    totalCorrectAnswers: {
      type: Number,
      default: 0,
    },
    totalIncorrectAnswers: {
      type: Number,
      default: 0,
    },
  },
  quizHistory: [
    {
      date: { type: Date, default: Date.now },
      totalQuestions: { type: Number, required: true },
      correctAnswers: { type: Number, required: true },
      incorrectAnswers: { type: Number, required: true },
      accuracyPercentage: { type: Number, required: true },
      timeSpent: { type: Number, default: 0 },
      results: [
        {
          questionId: String,
          userAnswer: Number,
          correctAnswer: Number,
          isCorrect: Boolean,
        },
      ],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
});

const User = mongoose.model("User", userSchema);

export default User;
