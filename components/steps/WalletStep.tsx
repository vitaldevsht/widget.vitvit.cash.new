import React from "react";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface WalletStepProps {
  t: Translations;
}

const WalletStep = ({ t }: WalletStepProps) => {
  const { walletAddress, setWalletAddress, setStep } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.length > 10) setStep(AppStep.DEPOSIT);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t.wallet.title}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t.wallet.subtitle}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t.wallet.addressLabel}
        </label>
        <textarea
          required
          autoFocus
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={t.wallet.placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 font-mono text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={walletAddress.length < 10}
        className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] mt-4"
      >
        {t.wallet.action}
      </button>
    </form>
  );
};

export default WalletStep;
