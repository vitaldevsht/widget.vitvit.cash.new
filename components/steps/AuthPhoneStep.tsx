import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface AuthPhoneStepProps {
  t: Translations;
}

const AuthPhoneStep = ({ t }: AuthPhoneStepProps) => {
  const { phone, setPhone, areaCode, setAreaCode, setStep, setLastStep } =
    useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/whatsapp/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${areaCode}${phone}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send OTP");
      }

      if (data.success) {
        setStep(AppStep.VERIFY_PHONE);
        setLastStep(4);
      } else {
        throw new Error("Failed to send verification code");
      }
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
          {t.authPhone.title}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t.authPhone.subtitle}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            {t.authPhone.label}
          </label>
          <div className="flex">
            <select
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="px-3 rounded-l-lg border border-r-0 border-slate-300 bg-white text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              disabled={loading}
            >
              <option value="509">+509</option>
              <option value="1">+1</option>
            </select>
            <input
              type="tel"
              required
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder={t.authPhone.placeholder}
              className="flex-1 w-full px-4 py-3 border border-slate-300 bg-white rounded-r-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="pt-2">
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {t.authPhone.disclaimer}
        </p>
        <button
          type="submit"
          disabled={!phone || loading}
          className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? t.common.loading : t.common.continue}
        </button>
      </div>
    </form>
  );
};

export default AuthPhoneStep;
