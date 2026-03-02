import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface AuthEmailStepProps {
  t: Translations;
}

const AuthEmailStep = ({ t }: AuthEmailStepProps) => {
  const { email, setEmail, setStep } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/email/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Failed to send verification code");
        return;
      }

      setStep(AppStep.VERIFY_EMAIL);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t.authEmail.title}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t.authEmail.subtitle}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            {t.authEmail.label}
          </label>
          <input
            type="email"
            required
            autoFocus
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.authEmail.placeholder}
            className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={!email || loading}
          className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>{t.common.loading}</span>
            </>
          ) : (
            t.common.continue
          )}
        </button>
      </div>
    </form>
  );
};

export default AuthEmailStep;
