import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Smartphone, Building2, CheckCircle2, ArrowLeft, Sparkles, Zap, Crown, Loader2, AlertCircle } from "lucide-react";
import apiClient from "../../utils/api";

const BANKS = [
  { code: "sbi", label: "State Bank of India" },
  { code: "hdfc", label: "HDFC Bank" },
  { code: "icici", label: "ICICI Bank" },
  { code: "axis", label: "Axis Bank" },
  { code: "kotak", label: "Kotak Mahindra Bank" },
  { code: "pnb", label: "Punjab National Bank" },
  { code: "bob", label: "Bank of Baroda" },
  { code: "idbi", label: "IDBI Bank" }
];

const PLAN_ICONS = { basic: Zap, standard: Sparkles, premium: Crown };

const planColorClasses = {
  basic: {
    border: "border-sky-300/70 dark:border-sky-600/60",
    bg: "bg-gradient-to-br from-sky-50 to-sky-100/60 dark:from-sky-950/40 dark:to-sky-900/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
    btn: "bg-sky-600 hover:bg-sky-700 text-white"
  },
  standard: {
    border: "border-violet-400/70 dark:border-violet-500/60 ring-2 ring-violet-300/40 dark:ring-violet-700/40",
    bg: "bg-gradient-to-br from-violet-50 to-purple-100/60 dark:from-violet-950/40 dark:to-purple-900/30",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    btn: "bg-violet-600 hover:bg-violet-700 text-white"
  },
  premium: {
    border: "border-amber-300/70 dark:border-amber-600/60",
    bg: "bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-900/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    btn: "bg-amber-600 hover:bg-amber-700 text-white"
  }
};

const CreditPurchaseModal = ({ isOpen, onClose, onPurchaseComplete }) => {
  const [step, setStep] = useState("plans"); // plans → payment → processing → success
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState("");
  const [purchaseResult, setPurchaseResult] = useState(null);

  // Payment form fields
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bankCode, setBankCode] = useState("");

  const resetState = () => {
    setStep("plans");
    setSelectedPlan(null);
    setPaymentMethod("upi");
    setError("");
    setPurchaseResult(null);
    setUpiId("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setBankCode("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Fetch plans when modal opens
  const fetchPlans = async () => {
    if (plans.length > 0) return;
    setLoadingPlans(true);
    try {
      const res = await apiClient.get("/credits/plans");
      setPlans(res.data?.plans || []);
    } catch {
      setError("Failed to load credit plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setError("");
    setStep("payment");
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validatePayment = () => {
    if (paymentMethod === "upi") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setError("Enter a valid UPI ID (e.g., name@upi)");
        return false;
      }
    } else if (paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s/g, "");
      if (cleanCard.length < 13 || !/^\d+$/.test(cleanCard)) {
        setError("Enter a valid card number");
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError("Enter expiry in MM/YY format");
        return false;
      }
      if (!/^\d{3,4}$/.test(cardCvv)) {
        setError("Enter a valid CVV");
        return false;
      }
    } else if (paymentMethod === "netbanking") {
      if (!bankCode) {
        setError("Please select a bank");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handlePay = async () => {
    if (!validatePayment()) return;

    setStep("processing");
    setError("");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2200));

    try {
      const paymentDetails =
        paymentMethod === "upi"
          ? { upiId: upiId.trim() }
          : paymentMethod === "card"
            ? { cardNumber: cardNumber.replace(/\s/g, ""), expiry: cardExpiry, cvv: cardCvv }
            : { bankCode };

      const res = await apiClient.post("/credits/purchase", {
        planId: selectedPlan.id,
        paymentMethod,
        paymentDetails
      });

      setPurchaseResult(res.data);
      setStep("success");
      if (onPurchaseComplete) onPurchaseComplete(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed. Please try again.");
      setStep("payment");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            className="glass-panel mx-auto my-8 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onAnimationComplete={() => { if (step === "plans") fetchPlans(); }}
          >
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5 sm:p-6">
              {/* Header */}
              <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {step === "payment" && (
                    <button
                      type="button"
                      onClick={() => { setStep("plans"); setError(""); }}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <h3 className="pr-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {step === "plans" && "Choose a Credit Plan"}
                    {step === "payment" && "Complete Payment"}
                    {step === "processing" && "Processing Payment"}
                    {step === "success" && "Payment Successful!"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Step 1: Plan Selection */}
              {step === "plans" && (
                <div className="space-y-3">
                  {loadingPlans ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={28} className="animate-spin text-brand-indigo" />
                    </div>
                  ) : (
                    plans.map((plan) => {
                      const colors = planColorClasses[plan.id] || planColorClasses.basic;
                      const Icon = PLAN_ICONS[plan.id] || Zap;
                      return (
                        <motion.div
                          key={plan.id}
                          whileHover={{ scale: 1.015 }}
                          className={`relative cursor-pointer rounded-2xl border p-5 transition ${colors.border} ${colors.bg}`}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {plan.popular && (
                            <span className="absolute -top-2.5 right-4 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">Most Popular</span>
                          )}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-xl p-2.5 ${colors.badge}`}>
                                <Icon size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">{plan.label}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {plan.credits} credits • ₹{plan.perCredit.toFixed(0)}/credit
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{plan.price}</p>
                            </div>
                          </div>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Step 2: Payment */}
              {step === "payment" && selectedPlan && (
                <div className="space-y-5">
                  {/* Order summary */}
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/50 dark:bg-slate-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{selectedPlan.label}</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">₹{selectedPlan.price}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedPlan.credits} credits will be added to your account</p>
                  </div>

                  {/* Payment method tabs */}
                  <div className="grid grid-cols-1 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-3 dark:bg-slate-800">
                    {[
                      { id: "upi", label: "UPI", icon: Smartphone },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "netbanking", label: "Net Banking", icon: Building2 }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => { setPaymentMethod(method.id); setError(""); }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                          paymentMethod === method.id
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        <method.icon size={14} />
                        {method.label}
                      </button>
                    ))}
                  </div>

                  {/* UPI form */}
                  {paymentMethod === "upi" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="field-input w-full"
                      />
                      <p className="text-xs text-slate-400">Example: name@paytm, name@ybl, name@oksbi</p>
                    </div>
                  )}

                  {/* Card form */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="field-input mt-1 w-full"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="field-input mt-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="field-input mt-1 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking form */}
                  {paymentMethod === "netbanking" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Select Bank</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {BANKS.map((bank) => (
                          <button
                            key={bank.code}
                            type="button"
                            onClick={() => { setBankCode(bank.code); setError(""); }}
                            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                              bankCode === bank.code
                                ? "border-brand-indigo bg-brand-indigo/10 font-semibold text-brand-indigo dark:border-cyan-400 dark:bg-cyan-900/30 dark:text-cyan-300"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            }`}
                          >
                            {bank.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay button */}
                  <button
                    type="button"
                    onClick={handlePay}
                    className="w-full rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
                  >
                    Pay ₹{selectedPlan.price}
                  </button>
                  <p className="text-center text-[10px] text-slate-400">This is a simulated payment for demo purposes</p>
                </div>
              )}

              {/* Step 3: Processing */}
              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={48} className="animate-spin text-brand-indigo" />
                  <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Processing your payment...</p>
                  <p className="mt-1 text-xs text-slate-400">Please do not close this window</p>
                </div>
              )}

              {/* Step 4: Success */}
              {step === "success" && purchaseResult && (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <CheckCircle2 size={64} className="text-emerald-500" />
                  </motion.div>
                  <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Payment Successful!</h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{purchaseResult.message}</p>

                  <div className="mt-6 w-full max-w-xs rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/40">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Credits Added</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{purchaseResult.transaction?.amount || 0}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Total Balance</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{purchaseResult.credits}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreditPurchaseModal;
