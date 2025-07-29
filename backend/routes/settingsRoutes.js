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

export default router;