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
}

interface DepositStepProps {
  t: Translations;
  amount: number;
  profile?: PartnerProfile;
}

const extractErrorMessage = (errData: any): string => {
  if (!errData || typeof errData !== "object") return "";
  const candidates = [errData.details, errData.message, errData.error];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().replace(/:\s*$/, "");
  }
  return "";
};

const friendlyPaymentError = (
  raw: string | undefined,
  t: Translations["deposit"],
) => {
  const msg = (raw || "").toLowerCase();

  if (
    msg.includes("authentication") ||
    msg.includes("unauthorized") ||
    msg.includes("token") ||
    msg.includes("auth")
  ) {
    return t.errorAuth;
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("timeout")
  ) {
    return t.errorNetwork;
  }
  if (msg.includes("amount") || msg.includes("invalid")) {
    return t.errorInvalid;
  }
  if (
    msg.includes("partner") ||
    msg.includes("customer") ||
    msg.includes("missing")
  ) {
    return t.errorMissingInfo;
  }

  return t.error;
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
  const [amountInput, setAmountInput] = useState<string>(
    amount > 0 ? String(amount) : "",
  );
  const [sendToExternal, setSendToExternal] = useState<boolean>(
    Boolean(profile?.external_address),
  );
  const forexTriggeredRef = useRef(false);

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
      HTG_TO_USDC_RATE;
  }
  const totalAmount = Math.ceil(amountToPayHTG);

  const clientId = profile?.clientId || userId;
  const access_token = profile?.access_token;
  const external_address = profile?.external_address;

  const customerNumber = profile?.phone
    ? profile.phone.startsWith("509")
      ? profile.phone
      : "509" + profile.phone
    : "509" + storePhone;

  const createDeposit = async (refNumber: string, transactionId: string) => {
    if (!profile?.partner_id) {
      throw new Error("Missing partner_id on profile");
    }
    if (!clientId) {
      throw new Error("Missing customer_id (clientId)");
    }

    const res = await fetch("/api/onramps/create-deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partner_id: profile.partner_id,
        customer_id: clientId,
        approved_by: null,
        currency: inputCurrency,
        method: "mobile_money",
        provider: "MonCash",
        amount: totalAmount,
        transaction_id: transactionId,
        ref_number: refNumber,
        images: [],
        notes: null,
        approved_date: null,
        approved_key: null,
        hash: null,
      }),
    });

    if (!res.ok) {
      let errData: any = {};
      try {
        errData = await res.json();
      } catch {
        errData = {};
      }
      throw new Error(
        extractErrorMessage(errData) || "Failed to create deposit record",
      );
    }

    return res.json();
  };

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
      const refNumber = `${Date.now()}_${Math.floor(
        Math.random() * 1_000_000_000_000,
      )}`;
      const transactionId = `TXN-${Date.now()}`;
      const orderId = `${process.env.NEXT_PUBLIC_MONCASH_TEST_LIVE}${new Date().getTime()}`;

      const res = await fetch("/api/onramps/moncash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: process.env.NEXT_PUBLIC_MONCASHIS,
          live_test: process.env.NEXT_PUBLIC_MONCASH_TEST_LIVE || "",
          clientId: clientId,
          orderId,
          customerNumber,
          amount: totalAmount,
          webhooks: [`${process.env.NEXT_PUBLIC_BASEURL}/webhooks/moncash`],
          metadata: {
            email: profile?.email,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            partner_id: profile?.partner_id,
            customer_id: clientId,
            transaction_id: transactionId,
            ref_number: refNumber,
            amount: currentAmount,
            totalAmount,
          },
        }),
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {
          errData = {};
        }
        if (depositId) {
          await deleteDeposit(depositId);
          depositId = undefined;
        }
        throw new Error(extractErrorMessage(errData) || "Payment API failed");
      }

      const responseData = await res.json();

      if (responseData.success && responseData.data) {
        const newOrderId =
          responseData.data.order_id || responseData.data.orderId;
        setOrderId(newOrderId);

        const depositResponse = await createDeposit(newOrderId, transactionId);
        depositId = depositResponse?.data?.id;

        const url = responseData.data.url || responseData.data.payment_uri;
        if (url) {
          setPaymentUrl(url);
          window.open(
            url,
            "paymentPopup",
            "width=300,height=450,resizable=yes,scrollbars=yes,status=yes",
          );
        }
        setPolling(true);
        depositId = undefined;
      } else {
        if (depositId) {
          await deleteDeposit(depositId);
          depositId = undefined;
        }
        throw new Error("Failed to create payment: Invalid response");
      }
    } catch (e: any) {
      console.error("Deposit API failed", e);
      if (depositId) {
        await deleteDeposit(depositId);
      }
      setError(friendlyPaymentError(e?.message, t.deposit));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: number;
    if (polling && orderId) {
      interval = window.setInterval(async () => {
        try {
          const res = await fetch(
            `/api/cashcash/check-payment?orderId=${orderId}`,
          );
          if (!res.ok) return;

          const responseData = await res.json();
          const status = responseData?.data?.status;
          if (responseData.success && status === "completed") {
            if (forexTriggeredRef.current) return;
            forexTriggeredRef.current = true;
            setTimeout(async () => {
              const res = await fetch("/api/exchange/forex", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  // ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                  user_id: clientId,
                  token_1: "HTGV",
                  token_2: "USDC",
                  amount: amount,
                  sent_to: sendToExternal ? external_address : null,
                }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(
                  data?.details ||
                    data?.error ||
                    `Request failed (${res.status})`,
                );
              } else {
                setPolling(false);
                setSucceeded(true);
              }
            }, 5000);
          } else if (
            status === "failed" ||
            status === "cancelled" ||
            status === "canceled" ||
            status === "expired" ||
            status === "rejected"
          ) {
            setPolling(false);
            setOrderId(null);
            setFailed(true);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, orderId, setStep, router]);

  useEffect(() => {
    if (orderId && !polling) {
      setPolling(true);
    }
  }, []);

  return (
    <div className="text-center py-6 space-y-6 min-h-[70vh] flex flex-col">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CreditCard size={28} className="text-emerald-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t.deposit.title}
        </h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {t.deposit.subtitle}
        </p>
      </div>

      {external_address && !succeeded && (
        <button
          type="button"
          onClick={() => setSendToExternal((v) => !v)}
          disabled={!amountEditable}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            sendToExternal
              ? "border-[#0DB7D0] bg-cyan-50 text-[#0DB7D0]"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#0DB7D0] hover:text-[#0DB7D0]"
          }`}
          aria-pressed={sendToExternal}
        >
          <span className="uppercase tracking-wider">Send to external</span>
          <span className="font-mono normal-case truncate max-w-[180px]">
            {sendToExternal ? external_address : "off"}
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
                <span className="text-slate-500">Deposited</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {totalAmount.toLocaleString("en-US")} HTG
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exchange rate</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  1 USDC = {HTG_TO_USDC_RATE} HTG
                </span>
              </div>
              {SERVICE_FEE_PERCENT > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Service fee</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {(SERVICE_FEE_PERCENT * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {NETWORK_FEE_USD > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Network fee</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {NETWORK_FEE_USD} USDC
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">You received</span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  {(inputCurrency === "HTGV"
                    ? currentAmount / HTG_TO_USDC_RATE
                    : currentAmount
                  ).toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                  USDC
                </span>
              </div>
              {sendToExternal && external_address && (
                <div className="border-t border-slate-200 pt-2">
                  <p className="text-slate-500 mb-1">Sent to</p>
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
            <button
              onClick={goHome}
              className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99]"
            >
              {t.deposit.viewBalance}
            </button>
          </div>
        ) : !polling ? (
          <>
            <button
              onClick={createPayment}
              disabled={loading || currentAmount <= 0}
              className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? t.deposit.processing : t.deposit.buttonPay}
            </button>
            <button
              onClick={goHome}
              disabled={loading}
              className="w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 py-2"
            >
              {t.deposit.viewBalance}
            </button>
          </>
        ) : (
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <Loader2
              size={32}
              className="animate-spin text-emerald-500 mx-auto mb-4"
            />
            <p className="text-sm font-medium text-slate-800 mb-1">
              {t.deposit.processing}
            </p>
            <p className="text-xs text-slate-500">{t.deposit.waiting}</p>

            {paymentUrl && (
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
                Pay Now <ExternalLink size={14} />
              </button>
            )}

            <button
              onClick={() => {
                setOrderId(null);
                setPolling(false);
                setError("");
              }}
              className="mt-6 text-xs text-slate-300 hover:text-slate-500 block mx-auto"
            >
              Cancel
            </button>
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
