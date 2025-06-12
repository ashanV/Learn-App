import mongoose from "mongoose";
import dotenv from "dotenv";
import Word from "./models/Word.js"; 

dotenv.config();

// List of words to add
const wordsToSeed = [

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