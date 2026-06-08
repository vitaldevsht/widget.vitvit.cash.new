import React, { useState, useRef } from "react";
import { Loader2, Phone, Lock, AlertCircle, ChevronDown } from "lucide-react";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface AuthPhoneStepProps {
  t: Translations;
}

const AuthPhoneStep = ({ t }: AuthPhoneStepProps) => {
  const {
    phone,
    setPhone,
    areaCode,
    setAreaCode,
    setStep,
    setLastStep,
    setAuthData,
    kycSessionId,
  } = useAppStore();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pinInputs = useRef<(HTMLInputElement | null)[]>([]);

  const pinComplete = pin.every((d) => d !== "");

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setError("");

    const next = [...pin];
    next[index] = value.substring(value.length - 1);
    setPin(next);

    if (value && index < 5) {
      pinInputs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinInputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 6 || !pinComplete) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/phone-pin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `${areaCode}${phone}`,
          pin: pin.join(""),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid phone or PIN");
      }

      setAuthData({
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        user: data.user,
      });

      setLastStep(4);
      setStep(kycSessionId ? AppStep.WALLET : AppStep.KYC);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setPin(["", "", "", "", "", ""]);
      setTimeout(() => pinInputs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="text-left">
        <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0DB7D0]/10 to-emerald-500/10 mb-3 sm:mb-4">
          <Phone size={20} className="text-[#0DB7D0]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
          {t.authPhone.title}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t.authPhone.subtitle}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Phone number */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#0DB7D0] focus-within:ring-4 focus-within:ring-[#0DB7D0]/10 transition-all">
            <div className="relative flex items-center">
              <select
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                className="appearance-none h-full pl-3 sm:pl-4 pr-7 sm:pr-8 bg-slate-50/60 text-slate-700 text-sm font-semibold outline-none cursor-pointer border-r border-slate-200 disabled:opacity-50"
                disabled={loading}
                aria-label="Country code"
              >
                <option value="509">+509</option>
                <option value="1">+1</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 sm:right-2.5 text-slate-400 pointer-events-none"
              />
            </div>
            <input
              type="tel"
              required
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder={t.authPhone.placeholder}
              className="flex-1 min-w-0 w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-white outline-none text-slate-900 placeholder-slate-400 text-base sm:text-[15px] disabled:opacity-50"
              disabled={loading}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* PIN */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700">
              {t.enterPin.label}
            </label>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400">
              <Lock size={10} />
              <span>Secure</span>
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  pinInputs.current[idx] = el;
                }}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(idx, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(idx, e)}
                disabled={loading}
                aria-label={`PIN digit ${idx + 1}`}
                className={`w-full aspect-[3/4] sm:aspect-auto h-14 border bg-white rounded-xl text-center text-xl sm:text-2xl font-semibold text-slate-900 outline-none transition-all disabled:opacity-50 ${
                  digit
                    ? "border-[#0DB7D0] bg-[#0DB7D0]/5 shadow-[0_0_0_3px_rgba(13,183,208,0.08)]"
                    : "border-slate-200 hover:border-slate-300"
                } focus:border-[#0DB7D0] focus:shadow-[0_0_0_4px_rgba(13,183,208,0.12)]`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-[shake_0.3s_ease-in-out]">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Footer */}
      <div className="pt-1 sm:pt-2">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-4 sm:mb-5 leading-relaxed">
          {t.authPhone.disclaimer}
        </p>
        <button
          type="submit"
          disabled={!phone || !pinComplete || loading}
          className="w-full bg-[#0DB7D0] hover:bg-[#0BA3BA] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0DB7D0] text-white font-semibold text-[15px] sm:text-base py-3.5 sm:py-4 rounded-xl shadow-[0_4px_14px_rgba(13,183,208,0.25)] hover:shadow-[0_6px_20px_rgba(13,183,208,0.3)] disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? t.common.loading : t.common.continue}
        </button>
      </div>
    </form>
  );
};

export default AuthPhoneStep;
