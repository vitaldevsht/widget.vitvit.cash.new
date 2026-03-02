import React from "react";
import { Check, Copy } from "lucide-react";
import { HTG_TO_USDC_RATE, SERVICE_FEE_PERCENT, NETWORK_FEE_USD } from "../../constants";
import { Translations } from "../../types";
import { useAppStore } from "../../store";

interface SuccessStepProps {
  t: Translations;
}

const SuccessStep = ({ t }: SuccessStepProps) => {
  const { amount, inputCurrency, reset } = useAppStore();

  let amountHTG = 0;
  let amountUSDC = 0;

  if (inputCurrency === "HTGV") {
    amountHTG = amount;
    amountUSDC =
      amount / HTG_TO_USDC_RATE -
      NETWORK_FEE_USD -
      (amount / HTG_TO_USDC_RATE) * SERVICE_FEE_PERCENT;
  } else {
    amountUSDC = amount;
    amountHTG =
      ((amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT)) *
      HTG_TO_USDC_RATE;
  }

  return (
    <div className="text-center py-8 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={32} className="text-emerald-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {t.success.title}
      </h2>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        {t.success.message}
      </p>

      <div className="bg-white rounded-lg p-4 mb-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-500">Amount Sent</span>
          <span className="font-semibold text-slate-900">
            ${amountHTG.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
            HTG
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mb-4">
          <span className="text-slate-500">Est. Receive</span>
          <span className="font-semibold text-emerald-600">
            ~{amountUSDC.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
            USDC
          </span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            {t.success.txId}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
            <span>8x...4k2</span>
            <Copy size={12} />
          </div>
        </div>
      </div>

      <button
        onClick={reset}
        className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline transition-all"
      >
        {t.success.return}
      </button>
    </div>
  );
};

export default SuccessStep;
