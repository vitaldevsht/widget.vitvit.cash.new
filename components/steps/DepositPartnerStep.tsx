import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  HTG_TO_USDC_RATE,
  SERVICE_FEE_PERCENT,
  NETWORK_FEE_USD,
} from "../../constants";
import { AppStep, Translations } from "../../types";
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

interface DepositStepProps {
  t: Translations;
  amount: number;
  profile?: PartnerProfile;
}

type StageStatus = "idle" | "processing" | "complete" | "failed";

const StageRow = ({
  t,
  label,
  status,
}: {
  t: Translations;
  label: string;
  status: StageStatus;
}) => {
  const icon =
    status === "complete" ? (
      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
    ) : status === "failed" ? (
      <XCircle size={16} className="text-red-500 shrink-0" />
    ) : status === "processing" ? (
      <Loader2 size={16} className="text-emerald-500 shrink-0 animate-spin" />
    ) : (
      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
    );
  const statusText =
    status === "complete"
      ? t.partnerDeposit.stageComplete
      : status === "failed"
        ? t.partnerDeposit.stageFailed
        : status === "processing"
          ? t.partnerDeposit.stageProcessing
          : t.partnerDeposit.stagePending;
  const statusColor =
    status === "complete"
      ? "text-emerald-600"
      : status === "failed"
        ? "text-red-500"
        : status === "processing"
          ? "text-emerald-600"
          : "text-slate-400";
  const labelColor = status === "idle" ? "text-slate-400" : "text-slate-700";
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className={`text-xs font-medium truncate ${labelColor}`}>
          {label}
        </span>
      </div>
      <span className={`text-[11px] font-semibold ${statusColor}`}>
        {statusText}
      </span>
    </div>
  );
};

const DepositStep = ({ t, amount, profile }: DepositStepProps) => {
  const router = useRouter();
  const {
    userId,
    phone: storePhone,
    inputCurrency,
    setStep,
    orderId,
    setOrderId,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<StageStatus>("idle");
  const [forexStatus, setForexStatus] = useState<StageStatus>("idle");
  const [amountInput, setAmountInput] = useState<string>(
    amount > 0 ? String(amount) : "",
  );
  const [sendToExternal, setSendToExternal] = useState<boolean>(
    Boolean(profile?.external_address),
  );
  // Platform "BUY USDC" rate (HTGV -> USDC): how many HTGV per 1 USDC when buying.
  // Falls back to the static constant until the API responds.
  const [htgToUsdcRate, setHtgToUsdcRate] =
    useState<number>(HTG_TO_USDC_RATE);
  const forexTriggeredRef = useRef(false);
  const pollStartRef = useRef<number | null>(null);
  const MAX_POLL_MS = 90_000;
  const POLL_INTERVAL_MS = 15_000;
  const MIN_DEPOSIT_HTG = 10;

  const goHome = () => {
    router.push(
      `/partner?user_id=${clientId}&access_token=${access_token}&external_address=${external_address}`,
    );
  };

  const currentAmount = Number(amountInput) || 0;
  const amountEditable = !loading && !polling && !failed && !succeeded;

  let amountToPayHTG = 0;
  if (inputCurrency === "HTGV") {
    amountToPayHTG = currentAmount;
  } else {
    amountToPayHTG =
      ((currentAmount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT)) *
      htgToUsdcRate;
  }
  const totalAmount = Math.ceil(amountToPayHTG);

  const clientId = profile?.clientId || userId;
  const access_token = profile?.access_token;
  const external_address = profile?.external_address;

  const partner_address = profile?.partner_address;
  const partner_fee = profile?.partner_fee;
  const partner_id = profile?.partner_id;

  const customerNumber = profile?.phone
    ? profile.phone.startsWith("509")
      ? profile.phone
      : "509" + profile.phone
    : "509" + storePhone;

  const deleteDeposit = async (depositId: string) => {
    try {
      await fetch(`/api/onramps/${depositId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to rollback deposit", depositId, e);
    }
  };

  const createPayment = async () => {
    setLoading(true);
    setError("");

    let depositId: string | undefined;

    try {
      const res = await fetch("/api/onramps/moncash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId: partner_id,
          clientId: clientId,
          customerNumber: customerNumber,
          isExchange: true,
          amount: amountInput,
          webhooks: [
            `${process.env.NEXT_PUBLIC_BASEURL}/webhooks/moncash/exchange`,
          ],
          metadata: {
            sent_to: sendToExternal ? external_address : null,
            partner_fee,
            partner_address,
          },
        }),
      });
      const responseData = await res.json();

      if (responseData.orderId) {
        const newOrderId = responseData.orderId;
        setOrderId(newOrderId);

        const url = responseData.url;
        if (url) {
          setPaymentUrl(url);
          window.open(
            url,
            "paymentPopup",
            "width=300,height=450,resizable=yes,scrollbars=yes,status=yes",
          );
        }
        setPaymentStatus("processing");
        setForexStatus("idle");
        setPolling(true);
        depositId = undefined;
      } else {
        setPolling(false);
        setOrderId(null);
        setFailed(true);
        setSucceeded(false);
      }
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!polling || !orderId) return;
    if (pollStartRef.current === null) pollStartRef.current = Date.now();

    const interval = window.setInterval(async () => {
      try {
        const elapsed = Date.now() - (pollStartRef.current ?? Date.now());
        if (elapsed >= MAX_POLL_MS) {
          setForexStatus("failed");
          setPolling(false);
          setOrderId(null);
          setFailed(true);
          pollStartRef.current = null;
          return;
        }

        const res = await fetch(
          `/api/cashcash/check-payment?orderId=${orderId}`,
        );

        if (!res.ok) return;
        const responseData = await res.json();
        const status = responseData?.data?.status;
        if (responseData.success && status === "completed") {
          setPaymentStatus("complete");
          setForexStatus("processing");
          const forexRes = await fetch("/api/exchange/get-forex", {
            method: "POST",
            body: JSON.stringify({
              orderId: orderId,
            }),
          });

          const forexData = await forexRes.json();
          const hash = forexData?.hash;
          if (hash) {
            setForexStatus("complete");
            setPolling(false);
            setOrderId(null);
            setFailed(false);
            setSucceeded(true);
            pollStartRef.current = null;
          }
        } else if (
          status === "failed" ||
          status === "cancelled" ||
          status === "canceled" ||
          status === "expired" ||
          status === "rejected"
        ) {
          setPaymentStatus("failed");
          setPolling(false);
          setOrderId(null);
          setFailed(true);
          pollStartRef.current = null;
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [polling, orderId, setStep, router]);

  useEffect(() => {
    if (!orderId || polling) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/cashcash/check-payment?orderId=${orderId}`,
        );
        if (!res.ok) {
          if (!cancelled) setOrderId(null);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const status = data?.data?.status;
        const terminal = [
          "completed",
          "failed",
          "cancelled",
          "canceled",
          "expired",
          "rejected",
        ];
        if (terminal.includes(status)) {
          setOrderId(null);
          return;
        }
        setPaymentStatus("processing");
        setForexStatus("idle");
        setPolling(true);
      } catch {
        if (!cancelled) setOrderId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/partner/user-balances?user_id=${encodeURIComponent(clientId)}`,
          {
            cache: "no-store",
            headers: access_token
              ? { Authorization: `Bearer ${access_token}` }
              : undefined,
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        // Platform buy-USDC rate (1 USDC = N HTGV). Used to size the HTGV->USDC
        // exchange shown in the quote and the final HTG charge.
        const buyUsdc = data?.rates?.find(
          (r: { label?: string; HTGV_USDC?: number }) => r?.label === "BUY USDC",
        );
        const buyRate =
          typeof buyUsdc?.HTGV_USDC === "number" && buyUsdc.HTGV_USDC > 0
            ? buyUsdc.HTGV_USDC
            : null;
        if (buyRate) setHtgToUsdcRate(buyRate);
      } catch (e) {
        console.error("Failed to load rate", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, access_token]);

  return (
    <div className="text-center  space-y-6 min-h-[70vh] flex flex-col">
      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CreditCard size={20} className="text-emerald-600" />
      </div>

      <div>
        {/* <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t.deposit.title}
        </h2> */}
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {t.deposit.subtitle}
        </p>
      </div>

      {external_address && !succeeded && (
        <button
          type="button"
          // onClick={() => setSendToExternal((v) => !v)}
          disabled={!amountEditable}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            sendToExternal
              ? "border-[#0DB7D0] bg-cyan-50 text-[#0DB7D0]"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#0DB7D0] hover:text-[#0DB7D0]"
          }`}
          aria-pressed={sendToExternal}
        >
          <span className="uppercase tracking-wider">
            {t.partnerDeposit.sendToExternal}
          </span>
          <span className="font-mono normal-case truncate max-w-[180px]">
            {sendToExternal ? external_address : t.partnerDeposit.off}
          </span>
        </button>
      )}
      {!succeeded && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left">
          <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wide">
            {t.deposit.amountToPay}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={!amountEditable}
              placeholder="0"
              className="flex-1 bg-transparent outline-none text-2xl font-bold text-slate-900 tabular-nums placeholder-slate-300 disabled:opacity-60 min-w-0"
            />
            <span className="text-xs font-bold text-slate-500 px-2 py-1 rounded bg-white border border-slate-200">
              {"HTG"}
            </span>
          </div>
          {inputCurrency !== "HTGV" && (
            <p className="mt-2 text-xs text-slate-500">
              ≈ {totalAmount.toLocaleString("en-US")} HTG
            </p>
          )}
          <p
            className={`mt-2 text-xs ${
              currentAmount > 0 && totalAmount < MIN_DEPOSIT_HTG
                ? "text-red-500"
                : "text-slate-400"
            }`}
          >
            {t.partnerDeposit.minDeposit.replace(
              "{amount}",
              MIN_DEPOSIT_HTG.toLocaleString("en-US"),
            )}
          </p>
        </div>
      )}

      {!succeeded && !failed && !polling && currentAmount > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 text-xs border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500">
              {t.partnerDeposit.exchangeRate}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              1 USDC = {htgToUsdcRate} HTG
            </span>
          </div>
          {partner_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">
                {t.partnerDeposit.partnerFee}
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {(partner_fee * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {NETWORK_FEE_USD > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">
                {t.partnerDeposit.networkFee}
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {NETWORK_FEE_USD} USDC
              </span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="text-slate-500">
              {t.partnerDeposit.youWillReceive}
            </span>
            <span className="font-bold text-emerald-600 tabular-nums">
              {(inputCurrency === "HTGV"
                ? currentAmount / htgToUsdcRate -
                  (currentAmount / htgToUsdcRate) * partner_fee
                : currentAmount
              ).toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              USDC
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 break-words">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {succeeded ? (
          <div className="bg-white rounded-lg p-6 border border-emerald-100 shadow-sm">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {t.success.title}
            </p>
            <p className="text-xs text-slate-500 mb-5">{t.success.message}</p>

            <div className="bg-slate-50 rounded-lg p-4 mb-5 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t.partnerDeposit.deposited}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {totalAmount.toLocaleString("en-US")} HTG
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t.partnerDeposit.exchangeRate}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  1 USDC = {htgToUsdcRate} HTG
                </span>
              </div>
              {partner_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t.partnerDeposit.partnerFee}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {(partner_fee * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {NETWORK_FEE_USD > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t.partnerDeposit.networkFee}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {NETWORK_FEE_USD} USDC
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">
                  {t.partnerDeposit.youReceived}
                </span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  {(inputCurrency === "HTGV"
                    ? currentAmount / htgToUsdcRate -
                      (currentAmount / htgToUsdcRate) * partner_fee
                    : currentAmount
                  ).toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                  USDC
                </span>
              </div>

              {sendToExternal && external_address && (
                <div className="border-t border-slate-200 pt-2">
                  <p className="text-slate-500 mb-1">
                    {t.partnerDeposit.sentTo}
                  </p>
                  <p className="font-mono text-[10px] text-slate-700 break-all">
                    {external_address}
                  </p>
                </div>
              )}
            </div>

            {/* <button
              onClick={goHome}
              className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99]"
            >
              {t.success.return}
            </button> */}
          </div>
        ) : failed ? (
          <div className="bg-white rounded-lg p-6 border border-red-100 shadow-sm">
            <XCircle size={36} className="text-red-500 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {t.deposit.failedTitle}
            </p>
            <p className="text-xs text-slate-500 mb-5">
              {t.deposit.failedMessage}
            </p>

            <div className="mb-5 space-y-2 text-left">
              <StageRow
                t={t}
                label={t.partnerDeposit.paymentConfirmation}
                status={paymentStatus}
              />
              <StageRow
                t={t}
                label={t.partnerDeposit.currencyExchange}
                status={forexStatus}
              />
            </div>

            {/* <button
              onClick={goHome}
              className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99]"
            >
              {t.deposit.viewBalance}
            </button> */}
          </div>
        ) : !polling ? (
          <>
            <button
              onClick={createPayment}
              disabled={
                loading || currentAmount <= 0 || totalAmount < MIN_DEPOSIT_HTG
              }
              className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? t.deposit.processing : t.deposit.buttonPay}
            </button>
            {/* <button
              onClick={goHome}
              disabled={loading}
              className="w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 py-2"
            >
              {t.deposit.viewBalance}
            </button> */}
          </>
        ) : (
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            {/* <Loader2
              size={32}
              className="animate-spin text-emerald-500 mx-auto mb-4"
            /> */}
            {/* <p className="text-sm font-medium text-slate-800 mb-1">
              {t.deposit.processing}
            </p>
            <p className="text-xs text-slate-500">{t.deposit.waiting}</p> */}

            <div className="mt-5 space-y-2 text-left">
              <StageRow
                t={t}
                label={t.partnerDeposit.paymentConfirmation}
                status={paymentStatus}
              />
              <StageRow
                t={t}
                label={t.partnerDeposit.currencyExchange}
                status={forexStatus}
              />
            </div>

            {paymentUrl && paymentStatus !== "complete" && (
              <button
                onClick={() =>
                  window.open(
                    paymentUrl,
                    "paymentPopup",
                    "width=500,height=700,resizable=yes,scrollbars=yes,status=yes",
                  )
                }
                className="mt-4 inline-flex items-center gap-1 text-emerald-600 text-sm font-medium hover:underline"
              >
                {t.partnerDeposit.payNow} <ExternalLink size={14} />
              </button>
            )}
            {paymentUrl && paymentStatus !== "complete" && (
              <button
                onClick={() => {
                  setOrderId(null);
                  setPolling(false);
                  setError("");
                  setPaymentStatus("idle");
                  setForexStatus("idle");
                }}
                className="mt-6 text-xs text-slate-300 hover:text-slate-500 block mx-auto"
              >
                {t.partnerDeposit.cancel}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
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

export default DepositStep;

// /api/partner/log-user?access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6ImpBaE1MYlFLNmU5K1hDR20iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3dqaWFkZ2twaXN2Z2hpZnhseGZsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1NzI5M2JlZC03OTE2LTRlZGQtYWQ2MS00MjIzOWQ2M2Y4YjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgwMTc3OTEyLCJpYXQiOjE3ODAxNzQzMTIsImVtYWlsIjoiNTA5MzMzMzAwMDBAdmYuY29tIiwicGhvbmUiOiI1MDkzMzMzMDAwMCIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYWRkcmVzcyI6ImEiLCJjaXR5IjoiYyIsImRlcGFydG1lbnQiOiJjIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcnN0X25hbWUiOiJ1IiwibGFzdF9uYW1lIjoiaSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzgwMTc0MzEyfV0sInNlc3Npb25faWQiOiIyNzk4ZWQ4Zi0xZjcwLTQxZmEtOGJkZi0wN2M2NDhjMDMwYjkiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.ctbbYAh6GPld0lAbNrqOuM4WYQWlS9SUmXO8CT0gGRE&external_address=0x123&init_op=deposit&amount=100
