import React, { useState, useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import { Translations, AppStep } from "../../types";
import { useAppStore } from "../../store";

interface EnterPinStepProps {
  t: Translations;
}

const EnterPinStep = ({ t }: EnterPinStepProps) => {
  const { pin, setStep, setIsLocked, setPin } = useAppStore();
  const [enteredPin, setEnteredPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setError("");

    const newPin = [...enteredPin];
    newPin[index] = value.substring(value.length - 1);
    setEnteredPin(newPin);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Check if all digits are entered
    if (index === 5 && value && newPin.every((d) => d !== "")) {
      const code = newPin.join("");
      if (code === pin) {
        setIsLocked(false);
        setStep(AppStep.QUOTE);
      } else {
        setError(t.enterPin.error);
        setEnteredPin(["", "", "", "", "", ""]);
        setTimeout(() => inputs.current[0]?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !enteredPin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleForgotPin = () => {
    // Reset PIN and go to quote step
    setPin(null);
    setIsLocked(false);
    setStep(AppStep.QUOTE);
  };

  return (
    <div className="space-y-6">
      <div className="text-left mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          {t.enterPin.title}
        </h2>
        <p className="text-slate-500 text-sm text-center">{t.enterPin.subtitle}</p>
      </div>

      <div className="flex justify-between gap-2 sm:gap-3">
        {enteredPin.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-10 h-14 sm:w-12 sm:h-16 border border-slate-300 bg-white rounded-lg text-center text-2xl font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
        ))}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <div className="text-center">
        <button
          onClick={handleForgotPin}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {t.enterPin.forgot}
        </button>
      </div>
    </div>
  );
};

export default EnterPinStep;
