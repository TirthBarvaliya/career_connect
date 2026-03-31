import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["credit_purchase", "credit_usage"],
      required: true
    },
    amount: { type: Number, required: true, min: 1 },
    planId: { type: String, trim: true, default: "" },
    planLabel: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
