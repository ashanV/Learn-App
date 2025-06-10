import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  profile: {
    displayName: String,
    photoURL: String
  },
  learningPreferences: {
    selectedLanguage: {
      type: String,
      enum: ['english', 'german', null],
      default: null
    },
    languageSetAt: {
      type: Date,
      default: null
    }
  }
});

export default mongoose.model("User", userSchema);