import mongoose from "mongoose";
import dotenv from "dotenv";
import Word from "./models/Word.js"; 

dotenv.config();

// List of words to add
const wordsToSeed = [
  { language: "english", sourceWord: "jeździć", polishTranslation: "drive", difficulty: "easy" },
  { language: "english", sourceWord: "cat", polishTranslation: "kot", difficulty: "easy" },
  { language: "english", sourceWord: "bird", polishTranslation: "ptak", difficulty: "medium" },
  { language: "english", sourceWord: "horse", polishTranslation: "koń", difficulty: "medium" },
  { language: "english", sourceWord: "elephant", polishTranslation: "słoń", difficulty: "hard" },
  { language: "english", sourceWord: "write", polishTranslation: "pisać", difficulty: "easy" },
  { language: "english", sourceWord: "dog", polishTranslation: "pies", difficulty: "easy" },
  { language: "english", sourceWord: "development", polishTranslation: "rozwój", difficulty: "hard" },
  { language: "english", sourceWord: "government", polishTranslation: "rząd", difficulty: "hard" },
  { language: "english", sourceWord: "car", polishTranslation: "samochód", difficulty: "easy" },
  { language: "english", sourceWord: "search", polishTranslation: "szukanie", difficulty: "medium" },
];

const seedDB = async () => {
  try {
    // Database connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Połączono z MongoDB...");

    // Removed existing words to avoid duplicates when restarting
    await Word.deleteMany({});
    console.log("Usunięto istniejące słówka...");

    // Adding new words
    await Word.insertMany(wordsToSeed);
    console.log("Baza danych została pomyślnie zasilona!");

  } catch (error) {
    console.error("Błąd podczas zasilania bazy danych:", error);
  } finally {
    // Always close the connection
    await mongoose.connection.close();
    console.log("Rozłączono z MongoDB.");
  }
};

seedDB();