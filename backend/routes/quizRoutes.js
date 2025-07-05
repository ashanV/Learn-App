import express from "express";
import User from "../models/User.js";
import Word from "../models/Word.js";

const router = express.Router();

// Get quiz questions
router.get("/questions", async (req, res) => {
  try {
    const { lang, count = 10 } = req.query;

    if (!lang) {
      return res
        .status(400)
        .json({ message: "Parametr 'lang' jest wymagany." });
    }

    const questionsCount = Math.min(parseInt(count), 20); // Max 20 questions

    // Get random words for quiz
    const words = await Word.aggregate([
      { $match: { language: lang } },
      { $sample: { size: questionsCount * 4 } }, // Get more words to create distractors
    ]);

    if (!words || words.length < questionsCount) {
      return res
        .status(404)
        .json({
          message: "Niewystarczająca liczba słówek dla podanego języka.",
        });
    }

    const questions = [];
    const usedWords = new Set();

    for (let i = 0; i < questionsCount && i < words.length; i++) {
      const correctWord = words[i];
      if (usedWords.has(correctWord._id.toString())) continue;

      usedWords.add(correctWord._id.toString());

      // Create distractors (wrong answers)
      const distractors = words
        .filter(
          (w) =>
            !usedWords.has(w._id.toString()) &&
            w._id.toString() !== correctWord._id.toString()
        )
        .slice(0, 3)
        .map((w) => w.polishTranslation);

      // Add distractors to used words to avoid repetition
      words
        .filter((w) => distractors.includes(w.polishTranslation))
        .forEach((w) => usedWords.add(w._id.toString()));

      if (distractors.length < 3) {
        // If not enough distractors, create some generic ones
        const genericDistractors = [
          "nie wiem",
          "może",
          "trudne",
          "łatwe",
          "test",
          "quiz",
          "słowo",
          "język",
          "nauka",
          "odpowiedź",
          "pytanie",
          "opcja",
        ];

        while (distractors.length < 3) {
          const randomDistractor =
            genericDistractors[
              Math.floor(Math.random() * genericDistractors.length)
            ];
          if (
            !distractors.includes(randomDistractor) &&
            randomDistractor !== correctWord.polishTranslation
          ) {
            distractors.push(randomDistractor);
          }
        }
      }

      // Create options array with correct answer and distractors
      const options = [correctWord.polishTranslation, ...distractors];

      // Shuffle options
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [options[j], options[k]] = [options[k], options[j]];
      }

      const correctAnswerIndex = options.indexOf(correctWord.polishTranslation);

      questions.push({
        id: correctWord._id,
        question: `Jak przetłumaczyć "${correctWord.sourceWord}" na polski?`,
        sourceWord: correctWord.sourceWord,
        options: options,
        correctAnswer: correctAnswerIndex,
        language: lang,
      });
    }

    res.status(200).json({
      questions: questions.slice(0, questionsCount),
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Błąd pobierania pytań quizu:", error);
    res.status(500).json({
      message: "Błąd serwera podczas pobierania pytań quizu",
    });
  }
});

// Submit quiz results
router.post("/submit", async (req, res) => {
  try {
    const { firebaseUid, results, totalQuestions, correctAnswers, timeSpent } =
      req.body;

    if (!firebaseUid || !results || typeof correctAnswers !== "number") {
      return res.status(400).json({
        message: "Wymagane są: firebaseUid, results i correctAnswers",
      });
    }

    // Find user
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracyPercentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );

    // Just add quiz history - statistics are already updated during the quiz
    await User.findOneAndUpdate(
      { firebaseUid },
      {
        $push: {
          quizHistory: {
            date: new Date(),
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            accuracyPercentage,
            timeSpent: timeSpent || 0,
            results,
          },
        },
      }
    );

    res.status(200).json({
      message: "Wyniki quizu zostały zapisane pomyślnie",
      results: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        accuracyPercentage,
        timeSpent: timeSpent || 0,
      },
    });
  } catch (error) {
    console.error("Błąd zapisywania wyników quizu:", error);
    res.status(500).json({
      message: "Błąd serwera podczas zapisywania wyników quizu",
    });
  }
});

// Get user quiz history
router.get("/user/:firebaseUid/quiz-history", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { limit = 10 } = req.query;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    const quizHistory = user.quizHistory || [];
    const limitedHistory = quizHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    // Calculate stats
    const totalQuizzes = quizHistory.length;
    const averageAccuracy =
      totalQuizzes > 0
        ? Math.round(
            quizHistory.reduce(
              (sum, quiz) => sum + quiz.accuracyPercentage,
              0
            ) / totalQuizzes
          )
        : 0;

    res.status(200).json({
      history: limitedHistory,
      stats: {
        totalQuizzes,
        averageAccuracy,
        bestScore:
          totalQuizzes > 0
            ? Math.max(...quizHistory.map((q) => q.accuracyPercentage))
            : 0,
        totalTimeSpent: quizHistory.reduce(
          (sum, quiz) => sum + (quiz.timeSpent || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Błąd pobierania historii quizów:", error);
    res.status(500).json({
      message: "Błąd serwera podczas pobierania historii quizów",
    });
  }
});

export default router;
