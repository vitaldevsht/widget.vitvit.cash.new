import React, { useState, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Loader2 } from "lucide-react";
import { SERVICE_FEE_PERCENT, NETWORK_FEE_USD } from "../../constants";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface QuoteRates {
  buyUsdc: number; // HTGV per USDC when buying
  sellUsdc: number; // HTGV per USDC when selling
}

interface QuoteStepProps {
  t: Translations;
}

const QuoteStep = ({ t }: QuoteStepProps) => {
  const {
    amount,
    setAmount,
    inputCurrency,
    email,
    setLastStep,
    toggleCurrency,
    setStep,
  } = useAppStore();
  const [feesExpanded, setFeesExpanded] = useState(false);
  const [rates, setRates] = useState<QuoteRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [done, setDone] = useState<boolean | false>(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/quote");
        if (!response.ok) {
          throw new Error("Failed to fetch rates");
        }
        const data = await response.json();
        setRates({
          buyUsdc: data.rates.buyUsdc,
          sellUsdc: data.rates.sellUsdc,
        });
      } catch (err) {
        setError("Unable to load rates. Please try again.");
        console.error("Error fetching rates:", err);
      } finally {
        setLoading(false);
        setDone(true);
      }
    };
    if (!done) {
      fetchRates();
    }
  }, [done]);

  // Use different rates based on direction:
  // - BUY USDC (HTG -> USDC): use buyUsdc rate (HTGV_USDC: 131.15)
  // - SELL USDC (USDC -> HTGV): use sellUsdc rate (USDC_HTGV: 134.3)
  const buyRate = rates?.buyUsdc ?? 131.15;
  const sellRate = rates?.sellUsdc ?? 134.3;

  // When inputCurrency is HTGV, user is paying HTGV to buy USDC
  // When inputCurrency is USDC, user is paying USDC to get HTGV (selling USDC)
  const currentRate = inputCurrency === "HTGV" ? buyRate : sellRate;

  const formatUSD = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formatCrypto = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

  let displayPayHTG = 0;
  let displayReceiveUSDC = 0;
  let serviceFee = 0;
  let networkFee = 0;
  let totalFee = 0;

  if (inputCurrency === "HTGV") {
    // User pays HTGV, receives USDC (buying USDC)
    displayPayHTG = amount;
    const rawUSDC = amount / buyRate;
    serviceFee = rawUSDC * SERVICE_FEE_PERCENT;
    networkFee = NETWORK_FEE_USD;
    totalFee = serviceFee + networkFee;
    displayReceiveUSDC = Math.max(0, rawUSDC - totalFee);
  } else {
    // User pays USDC, receives HTGV (selling USDC)
    displayReceiveUSDC = amount;
    const totalUSDCNeeded =
      (amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT);
    displayPayHTG = totalUSDCNeeded * sellRate;

    serviceFee = totalUSDCNeeded * SERVICE_FEE_PERCENT;
    networkFee = NETWORK_FEE_USD;
    totalFee = serviceFee + networkFee;
  }

  const serviceFeeHTG = serviceFee * currentRate;
  const networkFeeHTG = networkFee * currentRate;
  const totalFeeHTG = totalFee * currentRate;

  const isHTGInput = inputCurrency === "HTGV";

  if (loading) {
    return (
      <div className="space-y-6 relative flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-slate-500 text-sm">Loading rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 relative flex flex-col items-center justify-center py-12">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-emerald-500 hover:text-emerald-600 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-slate-900">
          {t.quote.buyTitle}
        </h2>
        <p className="text-slate-500 text-sm mt-1">{t.quote.buySubtitle}</p>
      </div> */}

      <div className="flex flex-col gap-2 relative">
        {/* Pay Input - Always on top */}
        <div className="relative group transition-all">
          <div className="absolute top-3 left-3 text-xs font-medium text-slate-500 uppercase tracking-wide pointer-events-none">
            {t.quote.pay}
          </div>
          <div className="flex items-center border border-emerald-500 ring-1 ring-emerald-500/20 bg-white rounded-lg px-3 pt-7 pb-3 transition-all">
            {!isHTGInput && (
              <span className="text-xl text-slate-900 font-medium mr-1">$</span>
            )}
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-3xl font-semibold text-slate-900 outline-none placeholder-slate-300 bg-transparent"
              placeholder="0"
            />
            <div
              className={`flex items-center min-w-[80px] justify-center gap-2 ml-2 px-2 py-1 rounded border ${
                isHTGInput
                  ? "bg-slate-100 border-slate-200"
                  : "bg-indigo-50 border-indigo-100"
              }`}
            >
              {!isHTGInput && (
                <img
                  src="https://izvuugwzdqjowkxpadgl.supabase.co/storage/v1/object/public/public-images/usd-coin-usdc-logo.png"
                  alt="USDC"
                  className="w-4 h-4"
                />
              )}
              {isHTGInput && (
                <img
                  src="https://izvuugwzdqjowkxpadgl.supabase.co/storage/v1/object/public/public-images/vitgoud-logo.png"
                  alt="USDC"
                  className="w-4 h-4"
                />
              )}
              <span className="text-sm font-bold text-slate-700">
                {isHTGInput ? "HTGV" : "USDC"}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 z-10">
          <button
            onClick={toggleCurrency}
            className="bg-white border border-slate-200 p-2 rounded-full shadow-sm hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-600 transition-all group"
          >
            <ArrowUpDown
              size={18}
              className="text-slate-500 group-hover:text-emerald-600"
            />
          </button>
        </div>

        {/* Receive Input - Always on bottom */}
        <div className="relative group transition-all">
          <div className="absolute top-3 left-3 text-xs font-medium text-slate-500 uppercase tracking-wide pointer-events-none">
            {t.quote.receive}
          </div>
          <div className="flex items-center border border-slate-300 bg-white rounded-lg px-3 pt-7 pb-3 transition-all">
            {isHTGInput && (
              <span className="text-xl text-slate-900 font-medium mr-1">$</span>
            )}
            <input
              type="text"
              value={
                isHTGInput
                  ? formatCrypto(displayReceiveUSDC)
                  : formatUSD(displayPayHTG)
              }
              readOnly
              className="w-full text-3xl font-semibold text-slate-900 outline-none placeholder-slate-300 bg-transparent"
              placeholder="0"
            />
            <div
              className={`flex items-center min-w-[80px] justify-center gap-2 ml-2 px-2 py-1 rounded border ${
                !isHTGInput
                  ? "bg-slate-100 border-slate-200"
                  : "bg-indigo-50 border-indigo-100"
              }`}
            >
              {isHTGInput && (
                <img
                  src="https://izvuugwzdqjowkxpadgl.supabase.co/storage/v1/object/public/public-images/usd-coin-usdc-logo.png"
                  alt="USDC"
                  className="w-4 h-4"
                />
              )}
              {!isHTGInput && (
                <img
                  src="https://izvuugwzdqjowkxpadgl.supabase.co/storage/v1/object/public/public-images/vitgoud-logo.png"
                  alt="USDC"
                  className="w-4 h-4"
                />
              )}
              <span className="text-sm font-bold text-slate-700">
                {isHTGInput ? "USDC" : "HTGV"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-center text-slate-400 px-1">
        1 USDC ≈ {currentRate.toFixed(2)} HTGV
      </div>

      {/* Fees Accordion */}
      <div className="pt-2">
        <button
          // onClick={() => setFeesExpanded(!feesExpanded)}
          className="flex items-center justify-between w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span>{t.quote.fees}</span>
            {/* <ChevronDown
              size={14}
              className={`transform transition-transform ${
                feesExpanded ? "rotate-180" : ""
              }`}
            /> */}
          </div>
          <span>${formatUSD(totalFeeHTG)} HTGV</span>
        </button>

        {feesExpanded && (
          <div className="mt-3 space-y-2 px-2 py-3 bg-white border border-slate-100 rounded text-xs text-slate-500 shadow-sm">
            <div className="flex justify-between">
              <span>Service Fee (2%)</span>
              <span>${formatUSD(serviceFeeHTG)} HTGV</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span>${formatUSD(networkFeeHTG)} HTGV</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-3 text-sm font-medium text-slate-900">
          <span>{isHTGInput ? t.quote.total : t.quote.cost}</span>
          <span>
            {/* {!isHTGInput && "$"} */}
            {formatUSD(isHTGInput ? displayReceiveUSDC : displayPayHTG)}{" "}
            {isHTGInput ? "USDC" : "HTGV"}
          </span>
        </div>
      </div>

      <button
        onClick={() => {
          // setStep(!email ? AppStep.AUTH_EMAIL : AppStep.AUTH_PHONE);
          // setLastStep(1);
          open("https://app.vitvit.cash");
        }}
        disabled={amount <= 0}
        className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
      >
        {t.common.continue}
      </button>
    </div>
  );
};

export default QuoteStep;
