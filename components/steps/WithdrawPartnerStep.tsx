import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { HTG_TO_USDC_RATE } from "../../constants";
import { Translations } from "../../types";
import { useAppStore } from "../../store";

interface PartnerProfile {
  clientId?: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  partner_id?: string;
  access_token?: string;
  external_address?: string;
  partner_address?: string;
  partner_fee?: number;
}

interface WithdrawStepProps {
  t: Translations;
  amount: number;
  profile?: PartnerProfile;
}

type Phase = "amount" | "code" | "success" | "failed";

const MIN_WITHDRAW_HTG = 10;
const CODE_LENGTH = 6;

const WithdrawPartnerStep = ({ t, amount, profile }: WithdrawStepProps) => {
  const { userId, balanceHTGV, setBalanceHTGV, balanceUSDC, setBalanceUSDC } =
    useAppStore();

  const [phase, setPhase] = useState<Phase>("amount");
  const [amountInput, setAmountInput] = useState<string>(
    amount > 0 ? String(amount) : "",
  );
  const [initLoading, setInitLoading] = useState(false);
  const [execLoading, setExecLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [balanceLoading, setBalanceLoading] = useState(false);
  // Platform "SELL USDC" rate (USDC -> HTGV): how many HTGV you get per 1 USDC.
  // Falls back to the static constant until the API responds.
  const [usdcToHtgvRate, setUsdcToHtgvRate] =
    useState<number>(HTG_TO_USDC_RATE);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const clientId = profile?.clientId || userId;
  const partner_id = profile?.partner_id;
  const partner_fee = profile?.partner_fee ?? 0;
  const accessToken = profile?.access_token;
  const partner_address = profile?.partner_address;
  const currentAmount = Number(amountInput) || 0;
  // const usdcGross = currentAmount / HTG_TO_USDC_RATE;
  const usdcNet = currentAmount - currentAmount * partner_fee;
  const amountReceive = Number(usdcNet.toFixed(2));

  const loadBalances = async () => {
    if (!clientId) return null;
    try {
      const res = await fetch(
        `/api/partner/user-balances?user_id=${encodeURIComponent(clientId)}`,
        {
          cache: "no-store",
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const htgv = data?.balances?.find(
        (b: { symbol: string; amount: number }) => b.symbol === "HTGV",
      );
      const usdc = data?.balances?.find(
        (b: { symbol: string; amount: number }) => b.symbol === "USDC",
      );
      const htgvAmount = htgv?.amount ?? 0;
      const usdcAmount = usdc?.amount ?? 0;
      setBalanceHTGV(htgvAmount);
      setBalanceUSDC(usdcAmount);

      // Platform sell-USDC rate (1 USDC = N HTGV). Used to size the USDC->HTGV
      // top-up swap before a withdrawal.
      const sellUsdc = data?.rates?.find(
        (r: { label?: string; USDC_HTGV?: number }) => r?.label === "SELL USDC",
      );
      const sellRate =
        typeof sellUsdc?.USDC_HTGV === "number" && sellUsdc.USDC_HTGV > 0
          ? sellUsdc.USDC_HTGV
          : null;
      if (sellRate) setUsdcToHtgvRate(sellRate);

      return {
        htgv: htgvAmount,
        usdc: usdcAmount,
        rate: sellRate ?? usdcToHtgvRate,
      };
    } catch (e) {
      console.error("Failed to load balances", e);
      return null;
    }
  };

  useEffect(() => {
    if (phase === "code") otpInputs.current[0]?.focus();
  }, [phase]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setBalanceLoading(true);
    loadBalances().finally(() => {
      if (!cancelled) setBalanceLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, accessToken]);

  const formatHTGV = (n: number) =>
    new Intl.NumberFormat("fr-HT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  // Shortfall is the HTGV we still need beyond the current HTGV balance.
  // To buy that shortfall we need shortfallHTG / usdcToHtgvRate in USDC,
  // rounded up to 2 decimals so the swap is guaranteed to cover it.
  const shortfallHTG = Math.max(0, currentAmount - balanceHTGV);
  const usdcNeededForSwap =
    shortfallHTG > 0
      ? Math.ceil((shortfallHTG / usdcToHtgvRate) * 100) / 100
      : 0;
  const needsSwap = shortfallHTG > 0;
  const combinedAvailableHTG = balanceHTGV + balanceUSDC * usdcToHtgvRate;
  const exceedsBalance = needsSwap && usdcNeededForSwap > balanceUSDC; // even with swap, not enough

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const swapUsdcToHtgv = async (usdcAmount: number) => {
    const res = await fetch("/api/exchange/forex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: clientId,
        partner_id,
        token_1: "USDC",
        token_2: "HTGV",
        amount: usdcAmount,
      }),
    });
    const data = await res.json();
    if (!res.ok || data?.error) {
      const msg =
        typeof data?.details === "string"
          ? data.details
          : data?.error || t.partnerWithdraw.swapFailed;
      throw new Error(msg);
    }
    return data;
  };

  const initTransaction = async () => {
    if (!partner_id || !clientId) {
      setError("Missing partner or user information.");
      return;
    }
    setInitLoading(true);
    setError("");
    try {
      // If HTGV alone is not enough, top up by swapping USDC -> HTGV first,
      // using exactly the shortfall so the original `currentAmount` can be withdrawn.
      if (currentAmount > balanceHTGV) {
        if (usdcNeededForSwap > balanceUSDC) {
          setError(t.partnerWithdraw.insufficientCombined);
          return;
        }
        setSwapLoading(true);
        try {
          await swapUsdcToHtgv(usdcNeededForSwap);
        } catch (e: any) {
          setError(e?.message || t.partnerWithdraw.swapFailed);
          setSwapLoading(false);
          return;
        }

        // Balances API can return the pre-swap snapshot for a few seconds
        // after on-chain settlement, so wait before re-reading.
        await sleep(7000);

        const fresh = await loadBalances();
        setSwapLoading(false);
        const newHtgv = fresh?.htgv ?? balanceHTGV;
        if (currentAmount > newHtgv) {
          setError(t.partnerWithdraw.swapFailed);
          return;
        }
      }

      const res = await fetch("/api/partner/wallets/init-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: "TRANSFER_WITHDRAW",
          dest_identifier: "PHONE",
          user_id: clientId,
          customer_id: clientId,
          partner_id,
          amount: currentAmount,
          amount_receive: amountReceive,
          currency: "HTGV",
          method: "mobile_money",
          provider: "MonCash",
          notes: "Transfer Automatic",
          account_number: "888888888888",
          account_name: "Jean S. Beaudry",
          metadata: {
            partner_fee,
            partner_address,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(
          typeof data?.details === "string"
            ? data.details
            : data?.error || "Could not initiate withdrawal.",
        );
        return;
      }
      setOtp(Array(CODE_LENGTH).fill(""));
      setPhase("code");
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setInitLoading(false);
    }
  };

  const executeTransaction = async (code: string) => {
    if (!partner_id) {
      setError("Missing partner information.");
      return;
    }
    setExecLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/partner/wallets/execute?code=${encodeURIComponent(code)}&partner_id=${encodeURIComponent(partner_id)}`,
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(
          typeof data?.details === "string"
            ? data.details
            : data?.error || t.partnerWithdraw.invalidCode,
        );
        setOtp(Array(CODE_LENGTH).fill(""));
        otpInputs.current[0]?.focus();
        return;
      }
      setPhase("success");
    } catch (e: any) {
      setError(e?.message || "Network error");
      setOtp(Array(CODE_LENGTH).fill(""));
      otpInputs.current[0]?.focus();
    } finally {
      setExecLoading(false);
    }
  };

  const handleOtpChange = (idx: number, value: string) => {
    if (execLoading) return;
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    setError("");

    if (value && idx < CODE_LENGTH - 1) {
      otpInputs.current[idx + 1]?.focus();
    }

    const code = next.join("");
    if (idx === CODE_LENGTH - 1 && value && next.every((d) => d !== "")) {
      executeTransaction(code);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (execLoading) return;
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < CODE_LENGTH && i < text.length; i++) next[i] = text[i];
    setOtp(next);
    const fullCode = next.join("");
    if (fullCode.length === CODE_LENGTH && next.every((d) => d !== "")) {
      executeTransaction(fullCode);
    } else {
      const focusIdx = Math.min(text.length, CODE_LENGTH - 1);
      otpInputs.current[focusIdx]?.focus();
    }
  };

  const resetToAmount = () => {
    setPhase("amount");
    setError("");
    setOtp(Array(CODE_LENGTH).fill(""));
  };

  return (
    <div className="text-center space-y-6 min-h-[70vh] flex flex-col">
      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        {phase === "success" ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : phase === "failed" ? (
          <XCircle size={16} className="text-red-500" />
        ) : (
          <ArrowDownToLine size={16} className="text-emerald-600" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {phase === "success"
            ? t.partnerWithdraw.successTitle
            : phase === "failed"
              ? t.partnerWithdraw.failedTitle
              : phase === "code"
                ? t.partnerWithdraw.codeSentTitle
                : t.partnerWithdraw.title}
        </h2>
        {/* <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {phase === "success"
            ? t.partnerWithdraw.successMessage
            : phase === "failed"
              ? t.partnerWithdraw.failedMessage
              : phase === "code"
                ? t.partnerWithdraw.codeSentMessage
                : t.partnerWithdraw.subtitle}
        </p> */}
      </div>

      {phase === "amount" && (
        <>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-500 uppercase tracking-wide">
                {t.partnerWithdraw.amountToWithdraw}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                disabled={initLoading}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-2xl font-bold text-slate-900 tabular-nums placeholder-slate-300 disabled:opacity-60 min-w-0"
              />
              <span className="text-xs font-bold text-slate-500 px-2 py-1 rounded bg-white border border-slate-200">
                HTG
              </span>
            </div>
            <p
              className={`mt-2 text-xs ${
                currentAmount > 0 &&
                (currentAmount < MIN_WITHDRAW_HTG || exceedsBalance)
                  ? "text-red-500"
                  : "text-slate-400"
              }`}
            >
              {exceedsBalance && currentAmount > 0
                ? t.partnerWithdraw.insufficientCombined
                : t.partnerWithdraw.minWithdraw.replace(
                    "{amount}",
                    MIN_WITHDRAW_HTG.toLocaleString("en-US"),
                  )}
            </p>
            <div className="flex items-center justify-between mt-3 gap-2">
              <span className="text-[11px] text-slate-500">
                {t.partnerWithdraw.availableBalance}:{" "}
                <span className="font-semibold text-slate-700 tabular-nums">
                  {balanceLoading ? "…" : formatHTGV(balanceHTGV)} HTG
                </span>
                {balanceUSDC > 0 && (
                  <span className="text-slate-400">
                    {" "}
                    +{" "}
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {balanceUSDC.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  setAmountInput(
                    combinedAvailableHTG > 0
                      ? String(Math.floor(combinedAvailableHTG))
                      : "",
                  )
                }
                disabled={initLoading || combinedAvailableHTG <= 0}
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[#0DB7D0] hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.partnerWithdraw.useMax}
              </button>
            </div>
          </div>

          {currentAmount > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t.partnerWithdraw.exchangeRate}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  1 USDC = {usdcToHtgvRate} HTG
                </span>
              </div>
              {partner_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t.partnerWithdraw.partnerFee}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {(partner_fee * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">
                  {t.partnerWithdraw.youWillReceive}
                </span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  {amountReceive.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  HTG
                </span>
              </div>
            </div>
          )}

          {needsSwap && !exceedsBalance && currentAmount > 0 && (
            <div className="p-3 bg-cyan-50 text-[#0DB7D0] text-xs rounded-lg border border-cyan-100 text-left">
              {t.partnerWithdraw.willAutoConvert
                .replace(
                  "{usdc}",
                  usdcNeededForSwap.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  }),
                )
                .replace("{htg}", shortfallHTG.toLocaleString("en-US"))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 break-words">
              {error}
            </div>
          )}

          <button
            onClick={initTransaction}
            disabled={
              initLoading ||
              currentAmount <= 0 ||
              currentAmount < MIN_WITHDRAW_HTG ||
              exceedsBalance ||
              !partner_id ||
              !clientId
            }
            className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {initLoading && <Loader2 size={18} className="animate-spin" />}
            {swapLoading
              ? t.partnerWithdraw.swapping
              : initLoading
                ? t.partnerWithdraw.sending
                : t.partnerWithdraw.sendCode}
          </button>
        </>
      )}

      {phase === "code" && (
        <>
          <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={idx === 0 ? handleOtpPaste : undefined}
                disabled={execLoading}
                className="w-10 h-14 sm:w-12 sm:h-16 border border-slate-300 bg-white rounded-lg text-center text-2xl font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {execLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span>{t.partnerWithdraw.verifying}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 break-words">
              {error}
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-3 text-left text-xs border border-slate-100 flex justify-between">
            <span className="text-slate-500">
              {t.partnerWithdraw.withdrawn}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {currentAmount.toLocaleString("en-US")} HTG ·{" "}
              {amountReceive.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              HTG
            </span>
          </div>

          <button
            type="button"
            onClick={resetToAmount}
            disabled={execLoading}
            className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            {t.partnerWithdraw.resend}
          </button>
        </>
      )}

      {phase === "success" && (
        <div className="bg-white rounded-lg p-6 border border-emerald-100 shadow-sm">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {t.partnerWithdraw.successTitle}
          </p>
          <p className="text-xs text-slate-500 mb-5">
            {t.partnerWithdraw.successMessage}
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-2 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">
                {t.partnerWithdraw.withdrawn}
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {currentAmount.toLocaleString("en-US")} HTG
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {t.partnerWithdraw.exchangeRate}
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                1 USDC = {HTG_TO_USDC_RATE} HTG
              </span>
            </div>
            {partner_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t.partnerWithdraw.partnerFee}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {(partner_fee * 100).toFixed(1)}%
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-slate-500">
                {t.partnerWithdraw.youWillReceive}
              </span>
              <span className="font-bold text-emerald-600 tabular-nums">
                {amountReceive.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                HTG
              </span>
            </div>
          </div>
        </div>
      )}

      {phase === "failed" && (
        <div className="bg-white rounded-lg p-6 border border-red-100 shadow-sm">
          <XCircle size={36} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {t.partnerWithdraw.failedTitle}
          </p>
          <p className="text-xs text-slate-500 mb-5">
            {t.partnerWithdraw.failedMessage}
          </p>
          <button
            onClick={resetToAmount}
            className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99]"
          >
            {t.partnerWithdraw.back}
          </button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-center">
        <a
          href="https://www.vitvit.cash/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://app.vitvit.cash/assets/logo-v2-text.png"
            alt="VitVit.Cash"
            className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>
    </div>
  );
};

export default WithdrawPartnerStep;
