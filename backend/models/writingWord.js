import mongoose from "mongoose";

const writingWordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
    },
    translations: [
      {
        type: String,
        required: true,
      },
    ],
    context: {
      type: String,
      required: true,
    },
    pronunciation: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["rzeczownik", "przymiotnik", "czasownik", "przysłówek", "inne"],
    },
    level: {
      type: String,
      required: true,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    frequency: {
      type: String,
      required: true,
      enum: ["Bardzo częste", "Częste", "Średnie", "Rzadkie", "Bardzo rzadkie"],
    },
    hints: [
      {
        type: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

writingWordSchema.index({ level: 1 });
writingWordSchema.index({ difficulty: 1 });
writingWordSchema.index({ frequency: 1 });

const WritingWord = mongoose.model("WritingWord", writingWordSchema);

export default WritingWord;
