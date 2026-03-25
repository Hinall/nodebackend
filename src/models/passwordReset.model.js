import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const passwordResetModel = mongoose.model("passwordResets", passwordResetSchema);

export default passwordResetModel;