import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Update user avatar only
router.put("/:firebaseUid/avatar", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { photoURL } = req.body;

    if (!photoURL) {
      return res.status(400).json({
        message: "URL zdjęcia jest wymagany",
      });
    }

    try {
      new URL(photoURL);
    } catch (error) {
      return res.status(400).json({
        message: "Nieprawidłowy URL zdjęcia",
      });
    }

    // Check if the URL is from Cloudinary
    if (!photoURL.includes("cloudinary.com")) {
      return res.status(400).json({
        message: "URL zdjęcia musi pochodzić z Cloudinary",
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "profile.photoURL": photoURL,
        "profile.avatarUpdatedAt": new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Awatar zaktualizowany pomyślnie",
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Błąd aktualizacji avatara:", error);
    res.status(500).json({
      message: "Błąd serwera podczas aktualizacji avatara",
    });
  }
});

// Delete user avatar
router.delete("/:firebaseUid/avatar", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        "profile.photoURL": null,
        "profile.avatarUpdatedAt": new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie został znaleziony",
      });
    }

    res.status(200).json({
      message: "Awatar usunięty pomyślnie",
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Błąd usuwania avatara:", error);
    res.status(500).json({
      message: "Błąd serwera podczas usuwania avatara",
    });
  }
});

export default router;
