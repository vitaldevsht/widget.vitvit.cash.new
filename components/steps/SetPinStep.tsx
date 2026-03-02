import React, { useState, useRef, useEffect } from "react";
import { Shield } from "lucide-react";
import { Translations, AppStep } from "../../types";
import { useAppStore } from "../../store";

interface SetPinStepProps {
  t: Translations;
}

const SetPinStep = ({ t }: SetPinStepProps) => {
  const { setPin, setStep } = useAppStore();
  const [pin, setPinValue] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (stage === "enter" && inputs.current[0]) {
      inputs.current[0]?.focus();
    } else if (stage === "confirm" && confirmInputs.current[0]) {
      confirmInputs.current[0]?.focus();
    }
  }, [stage]);

  const handleChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    if (!/^\d*$/.test(value)) return;
    setError("");

    const currentPin = isConfirm ? [...confirmPin] : [...pin];
    currentPin[index] = value.substring(value.length - 1);

    if (isConfirm) {
      setConfirmPin(currentPin);
    } else {
      setPinValue(currentPin);
    }

    const inputRefs = isConfirm ? confirmInputs : inputs;

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are entered
    if (index === 5 && value && currentPin.every((d) => d !== "")) {
      if (!isConfirm) {
        // Move to confirm stage
        setTimeout(() => setStage("confirm"), 200);
      } else {
        // Verify PINs match
        const enteredPin = pin.join("");
        const confirmedPin = currentPin.join("");
        if (enteredPin === confirmedPin) {
          setPin(enteredPin);
          setStep(AppStep.QUOTE);
        } else {
          setError(t.setPin.mismatch);
          setConfirmPin(["", "", "", "", "", ""]);
          setTimeout(() => confirmInputs.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm: boolean = false
  ) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const inputRefs = isConfirm ? confirmInputs : inputs;

    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderPinInputs = (
    values: string[],
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    isConfirm: boolean
  ) => (
    <div className="flex justify-between gap-2 sm:gap-3">
      {values.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(idx, e, isConfirm)}
          className="w-10 h-14 sm:w-12 sm:h-16 border border-slate-300 bg-white rounded-lg text-center text-2xl font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t.setPin.title}
        </h2>
        <p className="text-slate-500 text-sm">{t.setPin.subtitle}</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {stage === "enter" ? t.setPin.label : t.setPin.confirmLabel}
        </label>
        {stage === "enter"
          ? renderPinInputs(pin, inputs, false)
          : renderPinInputs(confirmPin, confirmInputs, true)}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <div className="bg-white p-3 rounded-md border border-slate-100 text-xs text-slate-500 flex items-start gap-2">
        <div className="mt-0.5">
          <Shield size={14} className="text-emerald-500" />
        </div>
        <p>{t.setPin.info}</p>
      </div>
    </div>
  );
};

export default SetPinStep;
