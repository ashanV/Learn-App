import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  profile: {
    displayName: { type: String },
    photoURL: { type: String },
  },
  learningPreferences: {
    selectedLanguage: { type: String },
    languageSetAt: { type: Date },
    dailyGoal: { type: Number, default: 10 },
    dailyGoalSetAt: { type: Date },
  },
  dailyStats: {
    completedWords: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    streak: { type: Number, default: 0 },
  },
  overallStats: {
    totalCorrectAnswers: { type: Number, default: 0 },
    totalIncorrectAnswers: { type: Number, default: 0 },
  },
});

const User = mongoose.model("User", userSchema);

export default User;
