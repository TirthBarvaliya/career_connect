import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// ─── Credit plans ────────────────────────────────────────────────────────────

const FREE_POST_LIMIT = 3;

const CREDIT_PLANS = [
  {
    id: "basic",
    label: "Basic Plan",
    credits: 5,
    price: 199,
    perCredit: 39.8,
    popular: false,
    features: ["5 job postings", "Standard visibility", "30-day listing"]
  },
  {
    id: "standard",
    label: "Standard Plan",
    credits: 15,
    price: 499,
    perCredit: 33.27,
    popular: true,
    features: ["15 job postings", "Priority visibility", "45-day listing", "Best value"]
  },
  {
    id: "premium",
    label: "Premium Plan",
    credits: 50,
    price: 1499,
    perCredit: 29.98,
    popular: false,
    features: ["50 job postings", "Top visibility", "60-day listing", "Premium badge", "Dedicated support"]
  }
];

const PLAN_MAP = new Map(CREDIT_PLANS.map((p) => [p.id, p]));

// ─── GET /credits/balance ────────────────────────────────────────────────────

export const getCreditBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("credits freePostsUsed");
  const freePostsUsed = user.freePostsUsed || 0;
  const freePostsRemaining = Math.max(0, FREE_POST_LIMIT - freePostsUsed);

  return res.status(200).json({
    credits: user.credits || 0,
    freePostsUsed,
    freePostsRemaining,
    freePostLimit: FREE_POST_LIMIT,
    canPostFree: freePostsRemaining > 0
  });
});

// ─── GET /credits/plans ──────────────────────────────────────────────────────

export const getCreditPlans = asyncHandler(async (_req, res) => {
  return res.status(200).json({ plans: CREDIT_PLANS });
});

// ─── POST /credits/purchase ──────────────────────────────────────────────────

export const purchaseCredits = asyncHandler(async (req, res) => {
  const { planId, paymentMethod, paymentDetails } = req.body;

  // Validate plan
  const plan = PLAN_MAP.get(planId);
  if (!plan) {
    res.status(400);
    throw new Error("Invalid plan selected.");
  }

  // Validate payment method
  const validMethods = ["upi", "card", "netbanking"];
  if (!validMethods.includes(paymentMethod)) {
    res.status(400);
    throw new Error("Invalid payment method.");
  }

  // Basic payment validation (mock — always succeeds if format is valid)
  if (paymentMethod === "upi") {
    const upiId = String(paymentDetails?.upiId || "").trim();
    if (!upiId || !upiId.includes("@")) {
      res.status(400);
      throw new Error("Please enter a valid UPI ID (e.g., name@upi).");
    }
  } else if (paymentMethod === "card") {
    const cardNumber = String(paymentDetails?.cardNumber || "").replace(/\s/g, "");
    const expiry = String(paymentDetails?.expiry || "").trim();
    const cvv = String(paymentDetails?.cvv || "").trim();
    if (cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
      res.status(400);
      throw new Error("Please enter a valid card number.");
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      res.status(400);
      throw new Error("Please enter expiry in MM/YY format.");
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      res.status(400);
      throw new Error("Please enter a valid CVV.");
    }
  } else if (paymentMethod === "netbanking") {
    const bankCode = String(paymentDetails?.bankCode || "").trim();
    if (!bankCode) {
      res.status(400);
      throw new Error("Please select a bank.");
    }
  }

  // Add credits to user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { credits: plan.credits } },
    { new: true }
  );

  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user._id,
    type: "credit_purchase",
    amount: plan.credits,
    planId: plan.id,
    planLabel: plan.label,
    price: plan.price,
    paymentMethod,
    description: `Purchased ${plan.credits} credits via ${plan.label}`
  });

  return res.status(200).json({
    message: `Successfully purchased ${plan.credits} credits!`,
    credits: user.credits,
    transaction: {
      id: String(transaction._id),
      type: transaction.type,
      amount: transaction.amount,
      planLabel: transaction.planLabel,
      price: transaction.price,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      createdAt: transaction.createdAt
    }
  });
});

// ─── GET /credits/transactions ───────────────────────────────────────────────

export const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Transaction.countDocuments({ user: req.user._id })
  ]);

  return res.status(200).json({
    transactions: transactions.map((t) => ({
      id: String(t._id),
      type: t.type,
      amount: t.amount,
      planLabel: t.planLabel || "",
      price: t.price || 0,
      paymentMethod: t.paymentMethod || "",
      description: t.description,
      createdAt: t.createdAt
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Export free post limit for use in jobController
export { FREE_POST_LIMIT };
