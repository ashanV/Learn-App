import express from 'express';
import User from '../models/User.js'; 

const router = express.Router();

// Endpoint for updating user reminder settings
router.put('/:firebaseUid/reminder', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { reminderEnabled, reminderTime } = req.body;

    // Time format validation
    if (reminderTime && !/^\d{2}:\d{2}$/.test(reminderTime)) {
      return res.status(400).json({ message: 'Nieprawidłowy format czasu.' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        'learningPreferences.reminderEnabled': reminderEnabled,
        'learningPreferences.reminderTime': reminderTime,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    res.status(200).json({
      message: 'Ustawienia przypomnień zostały zaktualizowane.',
      learningPreferences: user.learningPreferences,
    });
  } catch (error) {
    console.error('Błąd aktualizacji przypomnień:', error);
    res.status(500).json({
      message: 'Błąd serwera podczas aktualizacji przypomnień',
    });
  }
});

// Endpoint for exporting user data
router.get('/:firebaseUid/export', async (req, res) => {
  console.log('🔍 Export endpoint called for user:', req.params.firebaseUid);
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    // Calculate overall accuracy
    const totalAnswers = (user.overallStats?.totalCorrectAnswers || 0) + (user.overallStats?.totalIncorrectAnswers || 0);
    const overallAccuracy = totalAnswers > 0 ? Math.round(((user.overallStats.totalCorrectAnswers || 0) / totalAnswers) * 100) : 0;

    // Prepare export data based on actual schema
    const exportData = {
      exportDate: new Date().toISOString(),
      userData: {
        email: user.email,
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        learningPreferences: {
          selectedLanguage: user.learningPreferences?.selectedLanguage || null,
          languageSetAt: user.learningPreferences?.languageSetAt || null,
          dailyGoal: user.learningPreferences?.dailyGoal || 10,
          dailyGoalSetAt: user.learningPreferences?.dailyGoalSetAt || null,
          reminderEnabled: user.learningPreferences?.reminderEnabled || false,
          reminderTime: user.learningPreferences?.reminderTime || '18:00'
        },
        statistics: {
          totalCorrectAnswers: user.overallStats?.totalCorrectAnswers || 0,
          totalIncorrectAnswers: user.overallStats?.totalIncorrectAnswers || 0,
          overallAccuracy: overallAccuracy,
          totalAnswers: totalAnswers
        },
        dailyStats: {
          completedWords: user.dailyStats?.completedWords || 0,
          lastCompletedDate: user.dailyStats?.lastCompletedDate || null,
          currentStreak: user.dailyStats?.streak || 0
        },
        quizHistory: user.quizHistory?.map(quiz => ({
          date: quiz.date,
          totalQuestions: quiz.totalQuestions,
          correctAnswers: quiz.correctAnswers,
          incorrectAnswers: quiz.incorrectAnswers,
          accuracyPercentage: quiz.accuracyPercentage,
          timeSpent: quiz.timeSpent || 0,
          resultsCount: quiz.results?.length || 0
        })) || []
      }
    };

    console.log('✅ Export data prepared successfully');
    res.status(200).json(exportData);
  } catch (error) {
    console.error('Błąd eksportu danych:', error);
    res.status(500).json({
      message: 'Błąd serwera podczas eksportu danych',
    });
  }
});

export default router;