import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ['german', 'english'], 
  },
  sourceWord: {
    type: String,
    required: true,
  },
  polishTranslation: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  }
}, {
  unique: ['language', 'sourceWord'] 
});

const Word = mongoose.model("Word", wordSchema);

export default Word;