import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Smartphone, Building2, CheckCircle2, ArrowLeft, Sparkles, Zap, Crown, Loader2, AlertCircle, Star } from "lucide-react";
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

const planAccentColors = {
  basic: { glow: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.25)", text: "#38bdf8" },
  standard: { glow: "rgba(147, 51, 234, 0.2)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  premium: { glow: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.25)", text: "#fbbf24" }
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
            className={`mx-auto w-full overflow-hidden ${
              step === "plans"
                ? "my-4 max-w-5xl rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-[#0a0a14]"
                : "my-8 max-w-2xl w-full rounded-2xl border border-slate-200/70 bg-white shadow-2xl dark:border-slate-700/50 dark:bg-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
            onAnimationComplete={() => { if (step === "plans") fetchPlans(); }}
          >
            {/* ═══════════ PLANS STEP — Full Luxury Dark ═══════════ */}
            {step === "plans" && (
              <div className="relative overflow-hidden px-5 py-6 sm:px-8">
                {/* Static gradient backgrounds (no animation — zero GPU overhead) */}
                <div
                  className="pointer-events-none absolute -left-1/3 -top-1/3 h-2/3 w-2/3 rounded-full opacity-20 blur-[100px] dark:opacity-35"
                  style={{ background: "radial-gradient(circle, #6366f1 0%, #a855f7 40%, transparent 70%)" }}
                />
                <div
                  className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full opacity-15 blur-[100px] dark:opacity-25"
                  style={{ background: "radial-gradient(circle, #ec4899 0%, #be185d 40%, transparent 70%)" }}
                />

                {/* Close button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute right-4 top-4 z-20 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={18} />
                </button>

                {/* Error banner */}
                {error && (
                  <div className="relative z-10 mb-3 flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <h2 className="relative z-10 mb-6 text-center text-2xl font-thin tracking-[0.3em] text-slate-700 sm:text-3xl dark:text-white/80 uppercase">
                  Credit Plans
                </h2>

                {/* Plan cards */}
                {loadingPlans ? (
                  <div className="relative z-10 flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-brand-indigo dark:text-violet-400" />
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
                    {plans.map((plan, i) => {
                      const accent = planAccentColors[plan.id] || planAccentColors.basic;
                      const Icon = PLAN_ICONS[plan.id] || Zap;
                      const isCenter = plan.popular || i === 1;
                      return (
                        <div
                          key={plan.id}
                          className="relative w-full max-w-xs cursor-pointer rounded-xl border p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] lg:w-1/3"
                          style={{
                            backgroundColor: isCenter ? "rgba(139,92,246,0.08)" : "rgba(100,116,139,0.06)",
                            borderColor: accent.border,
                            boxShadow: isCenter ? `0 12px 24px -6px ${accent.glow}` : "none"
                          }}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {plan.popular && (
                            <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">Most Popular</span>
                          )}

                          {/* Plan name + icon */}
                          <div className="mb-2 flex items-center gap-2">
                            <div className="rounded-lg p-1.5" style={{ backgroundColor: isCenter ? "rgba(139,92,246,0.15)" : "rgba(100,116,139,0.1)" }}>
                              <Icon size={16} style={{ color: accent.text }} />
                            </div>
                            <h3 className="text-base font-medium text-slate-800 dark:text-white">{plan.label}</h3>
                          </div>

                          {/* Divider */}
                          <div className="mb-3 h-px w-10" style={{ background: `linear-gradient(to right, ${accent.text}, transparent)` }} />

                          {/* Price */}
                          <div className="mb-0.5 text-3xl font-extralight tracking-tight text-slate-900 dark:text-white">₹{plan.price}</div>
                          <p className="mb-4 text-[11px] font-light tracking-wide text-slate-500 dark:text-white/40">
                            {plan.credits} credits • ₹{plan.perCredit.toFixed(0)}/credit
                          </p>

                          {/* Features */}
                          <ul className="mb-5 space-y-2">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2.5 text-xs font-light tracking-wide text-slate-600 dark:text-white/55">
                                <Star size={9} className="shrink-0 fill-current" style={{ color: accent.text }} />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          {/* Select button */}
                          <button
                            type="button"
                            className="w-full overflow-hidden rounded-lg py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${accent.border}, rgba(139,92,246,0.2))`,
                              color: accent.text
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${accent.text}, #8b5cf6)`;
                              e.currentTarget.style.color = "#ffffff";
                              e.currentTarget.style.boxShadow = `0 4px 20px ${accent.glow}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${accent.border}, rgba(139,92,246,0.2))`;
                              e.currentTarget.style.color = accent.text;
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan); }}
                          >
                            SELECT
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════ OTHER STEPS — Professional Standard Theme ═══════════ */}
            {step !== "plans" && (
              <div className="p-5 sm:p-6">
                {/* Header */}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
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

              {/* Step 2: Payment */}
              {step === "payment" && selectedPlan && (
                <div className="space-y-4">
                  {/* Order summary */}
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{selectedPlan.label}</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">₹{selectedPlan.price}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedPlan.credits} credits will be added to your account</p>
                  </div>

                  {/* Payment method tabs */}
                  <div className="grid grid-cols-1 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-3 dark:bg-slate-800/80">
                    {[
                      { id: "upi", label: "UPI", icon: Smartphone },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "netbanking", label: "Net Banking", icon: Building2 }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => { setPaymentMethod(method.id); setError(""); }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
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
                     <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand-cyan dark:focus:ring-brand-cyan"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Example: name@paytm, name@ybl, name@oksbi</p>
                    </div>
                  )}

                  {/* Card form */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand-cyan dark:focus:ring-brand-cyan"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand-cyan dark:focus:ring-brand-cyan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand-cyan dark:focus:ring-brand-cyan"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking form */}
                  {paymentMethod === "netbanking" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Bank</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {BANKS.map((bank) => (
                          <button
                            key={bank.code}
                            type="button"
                            onClick={() => { setBankCode(bank.code); setError(""); }}
                            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                              bankCode === bank.code
                                ? "border-brand-indigo bg-brand-indigo/10 font-semibold text-brand-indigo dark:border-cyan-400 dark:bg-cyan-900/30 dark:text-cyan-400"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {bank.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePay}
                      className="w-full rounded-lg bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:brightness-110"
                    >
                      Pay ₹{selectedPlan.price}
                    </button>
                    <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">This is a simulated payment for demo purposes</p>
                  </div>
                </div>
              )}

              {/* Step 3: Processing */}
              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={40} className="animate-spin text-brand-indigo dark:text-brand-cyan" />
                  <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">Processing your payment...</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Please do not close this window</p>
                </div>
              )}

              {/* Step 4: Success */}
              {step === "success" && purchaseResult && (
                <div className="flex flex-col items-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <CheckCircle2 size={56} className="text-emerald-500" />
                  </motion.div>
                  <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Payment Successful!</h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{purchaseResult.message}</p>

                  <div className="mt-6 w-full max-w-xs rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Credits Added</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{purchaseResult.transaction?.amount || 0}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Total Balance</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{purchaseResult.credits}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 w-full max-w-xs rounded-lg bg-gradient-to-r from-brand-indigo to-brand-cyan px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:brightness-110"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreditPurchaseModal;
