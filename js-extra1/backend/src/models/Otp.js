import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index — auto-deletes when expiresAt is reached
  }
}, { timestamps: true });

/**
 * Compare a plain-text OTP against the stored hash.
 */
otpSchema.methods.compareOtp = function compareOtp(plainOtp) {
  return bcrypt.compare(String(plainOtp), this.otpHash);
};

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
