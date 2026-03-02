import React, { useState, useEffect, useRef } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Translations } from "../../types";

interface VerifyGenericStepProps {
  target: string;
  onComplete: () => void;
  onVerify?: (code: string) => Promise<{ valid: boolean; error?: string }>;
  t: Translations;
  translations: {
    title: string;
    subtitle: string;
    info: string;
  };
}

const VerifyGenericStep = ({
  target,
  onComplete,
  onVerify,
  t,
  translations,
}: VerifyGenericStepProps) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0]?.focus();
  }, []);

  const verifyCode = async (code: string) => {
    if (onVerify) {
      setLoading(true);
      setError("");
      try {
        const result = await onVerify(code);
        if (result.valid) {
          onComplete();
        } else {
          setError(result.error || "Invalid code");
          setOtp(["", "", "", "", "", ""]);
          inputs.current[0]?.focus();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(onComplete, 300);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (loading) return;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (index === 5 && value && newOtp.every((d) => d !== "")) {
      if (code.endsWith(value)) {
        verifyCode(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (loading) return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {translations.title}
        </h2>
        <div className="text-slate-500 text-sm">
          {translations.subtitle}
          <div className="font-medium text-slate-800 mt-1">{target}</div>
        </div>
      </div>

      <div className="flex justify-between gap-2 sm:gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className="w-10 h-14 sm:w-12 sm:h-16 border border-slate-300 bg-white rounded-lg text-center text-2xl font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          <span>Verifying...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* <div className="bg-white p-3 rounded-md border border-slate-100 text-xs text-slate-500 flex items-start gap-2">
        <div className="mt-0.5">
          <Zap size={14} className="text-amber-500" />
        </div>
        <p>{translations.info}</p>
      </div> */}
    </div>
  );
};

export default VerifyGenericStep;
