import express from "express";
import WritingWord from "../models/WritingWord.js";
import User from "../models/User.js"; 

const router = express.Router();

// Get all the words to write
router.get("/words", async (req, res) => {
  try {
    const { level, difficulty, limit } = req.query;

    let filter = {};

    // Filtering by level
    if (level) {
      filter.level = level.toUpperCase();
    }

    // Filtering by difficulty
    if (difficulty) {
      filter.difficulty = difficulty.toLowerCase();
    }

    let query = WritingWord.find(filter);

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit);
      if (limitNum > 0 && limitNum <= 100) {
        query = query.limit(limitNum);
      }
    }

    const words = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: words.length,
      data: words,
    });
  } catch (error) {
    console.error("Błąd pobierania słówek do pisania:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas pobierania słówek do pisania",
    });
  }
});

// Get a random word for writing practice
router.get("/words/random", async (req, res) => {
  try {
    const { level, difficulty } = req.query;

    let filter = {};

    if (level) {
      filter.level = level.toUpperCase();
    }

    if (difficulty) {
      filter.difficulty = difficulty.toLowerCase();
    }

    const randomWord = await WritingWord.aggregate([
      { $match: filter },
      { $sample: { size: 1 } },
    ]);

    if (!randomWord || randomWord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nie znaleziono słówek dla podanych kryteriów",
      });
    }

    res.status(200).json({
      success: true,
      data: randomWord[0],
    });
  } catch (error) {
    console.error("Błąd pobierania losowego słówka:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas pobierania losowego słówka",
    });
  }
});

// Get words by level
router.get("/words/level/:level", async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 10 } = req.query;

    const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    if (!validLevels.includes(level.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy poziom. Dostępne: A1, A2, B1, B2, C1, C2",
      });
    }

    const words = await WritingWord.find({ level: level.toUpperCase() })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      level: level.toUpperCase(),
      count: words.length,
      data: words,
    });
  } catch (error) {
    console.error("Błąd pobierania słówek według poziomu:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas pobierania słówek według poziomu",
    });
  }
});

// Check user's answer against the word's translations
router.post("/check-answer", async (req, res) => {
  try {
    const { wordId, userAnswer, userId } = req.body; 

    if (!wordId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: "Wymagane są: wordId i userAnswer",
      });
    }

    const word = await WritingWord.findById(wordId);

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Słówko nie zostało znalezione",
      });
    }

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const isCorrect = word.translations.some(
      (translation) => translation.trim().toLowerCase() === normalizedUserAnswer
    );

    // Calculate the best similarity score
    let bestSimilarity = 0;
    let closestTranslation = "";

    word.translations.forEach((translation) => {
      const similarity = calculateSimilarity(
        normalizedUserAnswer,
        translation.toLowerCase()
      );
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        closestTranslation = translation;
      }
    });

    // If the answer is correct, update user's statistics
    if (userId && isCorrect) {
      try {
        const user = await User.findOne({ firebaseUid: userId });
        if (user) {
          const wordAlreadyMastered = user.masteredWords.includes(wordId);

          if (!wordAlreadyMastered) {
            // Add a word to the mastered ones
            user.masteredWords.push(wordId);

            // Update daily stats
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            let dailyProgress = user.dailyProgress.find(
              (progress) =>
                progress.date.toISOString().split("T")[0] === todayStr
            );

            if (!dailyProgress) {
              // Create a new entry for today
              dailyProgress = {
                date: today,
                wordsLearned: 0,
                timeSpent: 0,
                streakCount: 0,
                accuracy: 0,
                sessionsCompleted: 0,
              };
              user.dailyProgress.push(dailyProgress);
            }
            
            dailyProgress.wordsLearned += 1;

            // Update streak
            user.currentStreak += 1;
            if (user.currentStreak > user.longestStreak) {
              user.longestStreak = user.currentStreak;
            }

            // Update overall accuracy
            user.totalCorrectAnswers += 1;
            user.totalAnswers += 1;
            user.overallAccuracy = Math.round(
              (user.totalCorrectAnswers / user.totalAnswers) * 100
            );

            await user.save();
          } else {
           // Word already learned, but still update answer stats
            user.totalCorrectAnswers += 1;
            user.totalAnswers += 1;
            user.overallAccuracy = Math.round(
              (user.totalCorrectAnswers / user.totalAnswers) * 100
            );

            // Update streak
            user.currentStreak += 1;
            if (user.currentStreak > user.longestStreak) {
              user.longestStreak = user.currentStreak;
            }

            await user.save();
          }
        }
      } catch (userUpdateError) {
        console.error(
          "Błąd aktualizacji statystyk użytkownika:",
          userUpdateError
        );
      }
    }

    res.status(200).json({
      success: true,
      correct: isCorrect,
      similarity: Math.round(bestSimilarity * 100),
      correctAnswers: word.translations,
      closestAnswer: closestTranslation,
      feedback: isCorrect
        ? "Doskonale!"
        : bestSimilarity > 0.7
        ? "Prawie dobrze! Sprawdź pisownię."
        : "Niestety, to nie to.",
    });
  } catch (error) {
    console.error("Błąd sprawdzania odpowiedzi:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas sprawdzania odpowiedzi",
    });
  }
});

// Get statistics about the words
router.get("/stats", async (req, res) => {
  try {
    const totalWords = await WritingWord.countDocuments();

    const levelStats = await WritingWord.aggregate([
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const difficultyStats = await WritingWord.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    const frequencyStats = await WritingWord.aggregate([
      {
        $group: {
          _id: "$frequency",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalWords,
        byLevel: levelStats,
        byDifficulty: difficultyStats,
        byFrequency: frequencyStats,
      },
    });
  } catch (error) {
    console.error("Błąd pobierania statystyk:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas pobierania statystyk",
    });
  }
});

// Function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export default router;
