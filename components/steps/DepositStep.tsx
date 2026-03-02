import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Zap,
  Send,
  Building2,
  ChevronRight,
  Copy,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Wallet,
} from "lucide-react";
import {
  HTG_TO_USDC_RATE,
  SERVICE_FEE_PERCENT,
  NETWORK_FEE_USD,
} from "../../constants";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

type PaymentMethod =
  | "moncash_instant"
  | "moncash_transfer"
  | "natcash_transfer"
  | "bank_deposit"
  | null;

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  instant?: boolean;
}

const MONCASH_NUMBER = "509 1234 5678";
const NATCASH_NUMBER = "509 8765 4321";
const BANK_ACCOUNTS = [
  {
    bankName: "Sogebank",
    accountName: "VitVit S.A.",
    accountNumber: "1234567890",
    reference: "VITVIT",
  },
  {
    bankName: "Unibank",
    accountName: "VitVit S.A.",
    accountNumber: "0987654321",
    reference: "VITVIT",
  },
];

interface DepositStepProps {
  t: Translations;
}

const DepositStep = ({ t }: DepositStepProps) => {
  const { userId, phone, amount, inputCurrency, setStep, orderId, setOrderId } =
    useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProofImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const paymentOptions: PaymentOption[] = [
    {
      id: "moncash_instant",
      name: t.deposit.moncashInstant || "Moncash Instant",
      description:
        t.deposit.moncashInstantDesc || "Pay instantly via Moncash API",
      icon: <Zap size={20} className="text-orange-500" />,
      instant: true,
    },
    {
      id: "moncash_transfer",
      name: t.deposit.moncashTransfer || "Moncash Transfer",
      description:
        t.deposit.moncashTransferDesc || "Send to our Moncash number",
      icon: <Send size={20} className="text-orange-500" />,
    },
    {
      id: "natcash_transfer",
      name: t.deposit.natcashTransfer || "Natcash Transfer",
      description:
        t.deposit.natcashTransferDesc || "Send to our Natcash number",
      icon: <Send size={20} className="text-green-500" />,
    },
    {
      id: "bank_deposit",
      name: t.deposit.bankDeposit || "Bank Deposit",
      description: t.deposit.bankDepositDesc || "Transfer to our bank account",
      icon: <Building2 size={20} className="text-blue-500" />,
    },
  ];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments where Clipboard API is blocked
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  let amountToPayHTG = 0;
  if (inputCurrency === "HTGV") {
    amountToPayHTG = amount;
  } else {
    amountToPayHTG =
      ((amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT)) *
      HTG_TO_USDC_RATE;
  }
  const finalAmount = Math.ceil(amountToPayHTG);

  const createPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cashcash/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "sandbox",
          clientId: userId,
          customerNumber: "509" + phone,
          amount: finalAmount,
          webhooks: [],
          metadata: {},
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.details || errData.error || "Payment API failed"
        );
      }

      const responseData = await res.json();

      if (responseData.success && responseData.data) {
        const newOrderId =
          responseData.data.order_id || responseData.data.orderId;
        setOrderId(newOrderId);

        const url = responseData.data.url || responseData.data.payment_uri;
        if (url) {
          setPaymentUrl(url);
          window.open(
            url,
            "paymentPopup",
            "width=300,height=450,resizable=yes,scrollbars=yes,status=yes"
          );
        }
        setPolling(true);
      } else {
        throw new Error("Failed to create payment: Invalid response");
      }
    } catch (e: any) {
      console.error("Deposit API failed", e);
      setError(e.message || t.deposit.error);
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
            `/api/cashcash/check-payment?orderId=${orderId}`
          );
          if (!res.ok) return;

          const responseData = await res.json();
          if (
            responseData.success &&
            responseData.data.status === "completed"
          ) {
            setPolling(false);
            setStep(AppStep.SUCCESS);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, orderId, setStep]);

  useEffect(() => {
    if (orderId && !polling) {
      setPolling(true);
    }
  }, []);

  const renderPaymentMethodSelection = () => (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 text-left">
        {t.deposit.selectPaymentMethod || "Select payment method"}
      </p>
      {paymentOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => setSelectedMethod(option.id)}
          className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
            selectedMethod === option.id
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            {option.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{option.name}</p>
              {option.instant && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  {t.deposit.instant || "Instant"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{option.description}</p>
          </div>
          <ChevronRight
            size={20}
            className={`text-slate-400 ${
              selectedMethod === option.id ? "text-emerald-500" : ""
            }`}
          />
        </button>
      ))}
    </div>
  );

  const renderMoncashInstant = () => (
    <div className="space-y-4">
      {!polling ? (
        <button
          onClick={createPayment}
          disabled={loading}
          className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-70 text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? t.deposit.processing : t.deposit.buttonPay}
        </button>
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
                  "width=500,height=700,resizable=yes,scrollbars=yes,status=yes"
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
  );

  const renderTransferDetails = (type: "moncash" | "natcash") => {
    const number = type === "moncash" ? MONCASH_NUMBER : NATCASH_NUMBER;
    const color = type === "moncash" ? "orange" : "green";

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
            {(t.deposit.sendTo || "Send {amount} HTG to:").replace(
              "{amount}",
              finalAmount.toLocaleString("en-US")
            )}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-slate-900">{number}</p>
            <button
              onClick={() =>
                copyToClipboard(number.replace(/\s/g, ""), "number")
              }
              className={`p-2 rounded-lg hover:bg-${color}-100 transition-colors`}
            >
              {copiedField === "number" ? (
                <Check size={18} className="text-emerald-500" />
              ) : (
                <Copy size={18} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>
        {/* Proof Image Upload */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 text-left">
            {t.deposit.uploadProof || "Upload proof of payment"}{" "}
            <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-slate-500 text-left">
            {t.deposit.uploadProofDesc ||
              "Please upload a screenshot or photo of your transfer receipt"}
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {!proofImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2"
            >
              <Upload size={24} className="text-slate-400" />
              <span className="text-sm text-slate-600">
                {t.deposit.uploadProof || "Upload proof of payment"}
              </span>
            </button>
          ) : (
            <div className="relative">
              <img
                src={proofImage}
                alt="Proof of payment"
                className="w-full h-48 object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                <ImageIcon size={12} />
                <span>{t.deposit.removeImage || "Click X to remove"}</span>
              </div>
            </div>
          )}

          {!proofImage && (
            <p className="text-xs text-amber-600 text-left">
              {t.deposit.proofRequired ||
                "Proof of payment is required to continue"}
            </p>
          )}
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Important:</strong>{" "}
            {(
              t.deposit.importantTransfer ||
              "After sending, your payment will be verified within 5-15 minutes. Use your phone number ({phone}) as the reference."
            ).replace("{phone}", phone)}
          </p>
        </div>

        <button
          onClick={() => setStep(AppStep.SUCCESS)}
          className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
        >
          {t.deposit.sentPayment || "I've sent the payment"}
        </button>
      </div>
    );
  };

  const renderBankDeposit = () => (
    <div className="space-y-4">
      {/* <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
          {t.deposit.amountToTransfer || "Amount to Transfer"}
        </p>
        <p className="text-lg font-bold text-slate-900">
          {finalAmount.toLocaleString("en-US")} HTG
        </p>
      </div> */}

      <p className="text-sm font-medium text-slate-700 text-left">
        {t.deposit.chooseBankAccount ||
          "Choose one of the following bank accounts:"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {BANK_ACCOUNTS.map((bank, index) => (
          <div
            key={bank.bankName}
            className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-blue-500" />
              <p className="text-xs font-semibold text-slate-900">
                {bank.bankName}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                {/* <span className="text-xs text-slate-600">
                  {t.deposit.accountName || "Account Name"}
                </span> */}
                <span className="text-xs font-medium text-slate-900">
                  {bank.accountName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                {/* <span className="text-xs text-slate-600">
                  {t.deposit.accountNumber || "Account Number"}
                 
                </span> */}
                {/* <Wallet size={15} className="text-slate-900" /> */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-900">
                    {bank.accountNumber}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(bank.accountNumber, `account-${index}`)
                    }
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    {copiedField === `account-${index}` ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                {/* <span className="text-xs text-slate-600">
                  {t.deposit.reference || "Reference"}
                </span> */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-900">
                    {bank.reference}-{phone}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${bank.reference}-${phone}`,
                        `ref-${index}`
                      )
                    }
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    {copiedField === `ref-${index}` ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          <strong>Important:</strong>{" "}
          {t.deposit.importantBank ||
            "Include the reference code in your transfer description. Verification may take 1-2 business days."}
        </p>
      </div>

      {/* Proof Image Upload */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700 text-left">
          {t.deposit.uploadProof || "Upload proof of payment"}{" "}
          <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-slate-500 text-left">
          {t.deposit.uploadProofDesc ||
            "Please upload a screenshot or photo of your transfer receipt"}
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {!proofImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2"
          >
            <Upload size={24} className="text-slate-400" />
            <span className="text-sm text-slate-600">
              {t.deposit.uploadProof || "Upload proof of payment"}
            </span>
          </button>
        ) : (
          <div className="relative">
            <img
              src={proofImage}
              alt="Proof of payment"
              className="w-full h-48 object-cover rounded-lg border border-slate-200"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
              <ImageIcon size={12} />
              <span>{t.deposit.removeImage || "Click X to remove"}</span>
            </div>
          </div>
        )}

        {!proofImage && (
          <p className="text-xs text-amber-600 text-left">
            {t.deposit.proofRequired ||
              "Proof of payment is required to continue"}
          </p>
        )}
      </div>

      <button
        onClick={() => setStep(AppStep.SUCCESS)}
        disabled={!proofImage}
        className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
      >
        {t.deposit.madeDeposit || "I've made the deposit"}
      </button>
    </div>
  );

  const renderSelectedMethod = () => {
    switch (selectedMethod) {
      case "moncash_instant":
        return renderMoncashInstant();
      case "moncash_transfer":
        return renderTransferDetails("moncash");
      case "natcash_transfer":
        return renderTransferDetails("natcash");
      case "bank_deposit":
        return renderBankDeposit();
      default:
        return null;
    }
  };

  return (
    <div className="text-center py-6 space-y-6">
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

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">
          {t.deposit.amountToPay}
        </p>
        <p className="text-2xl font-bold text-slate-900">
          {finalAmount.toLocaleString("en-US")} HTG
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 break-words">
          {error}
        </div>
      )}

      {!selectedMethod ? (
        renderPaymentMethodSelection()
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedMethod(null);
              setPolling(false);
              setError("");
              setProofImage(null);
            }}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto"
          >
            <ChevronRight size={16} className="rotate-180" />
            {t.deposit.changePaymentMethod || "Change payment method"}
          </button>
          {renderSelectedMethod()}
        </div>
      )}
    </div>
  );
};

export default DepositStep;
