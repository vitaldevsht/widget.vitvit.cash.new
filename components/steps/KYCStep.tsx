import React, { useState, useEffect } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { AppStep, Translations } from "../../types";
import { useAppStore } from "../../store";

interface KYCStepProps {
  t: Translations;
}

const KYCStep = ({ t }: KYCStepProps) => {
  const { kycSessionId, setKycSessionId, setStep } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [kycUrl, setKycUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const startKYC = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://genpay.solvexalabs.xyz/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_data: "vitvit_u_" + Date.now(),
          metadata: { source: "vitvit_web" },
        }),
      });

      if (!res.ok) throw new Error("API responded with error");

      const data = await res.json();
      if (data.url && data.session_id) {
        setKycSessionId(data.session_id);
        setKycUrl(data.url);
        setShowModal(true);
        setPolling(true);
      } else {
        throw new Error("Invalid response from provider");
      }
    } catch (e) {
      console.warn("KYC API failed, switching to demo mode", e);
      setKycSessionId("demo_kyc_" + Date.now());
      setPolling(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: number;
    let timeout: number;

    if (polling && kycSessionId) {
      // Stop polling after 3 minutes and allow manual retry
      timeout = window.setTimeout(() => {
        setPolling(false);
        setPollingTimedOut(true);
      }, 0.5 * 60 * 1000);

      interval = window.setInterval(async () => {
        try {
          if (kycSessionId.startsWith("demo_")) {
            setTimeout(() => {
              setPolling(false);
              setStep(AppStep.WALLET);
            }, 2000);
            return;
          }

          const res = await fetch(
            `https://genpay.solvexalabs.xyz/api/kyc?session_id=${kycSessionId}`
          );
          if (!res.ok) return;
          const data = await res.json();
          if (
            data.status === "approved" ||
            data.decision?.status === "approved"
          ) {
            setPolling(false);
            setStep(AppStep.WALLET);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, kycSessionId, setStep]);

  return (
    <>
      {/* KYC Modal */}
      {showModal && kycUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col overflow-hidden mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">{t.kyc.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={kycUrl}
                className="w-full h-full border-0"
                allow="camera; microphone"
                title="KYC Verification"
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-6 space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <ExternalLink size={28} className="text-emerald-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t.kyc.title}
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {t.kyc.subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {!polling && !pollingTimedOut ? (
          <button
            onClick={startKYC}
            disabled={loading}
            className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 disabled:opacity-70 text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? t.kyc.processing : t.kyc.buttonStart}
          </button>
        ) : pollingTimedOut ? (
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-800 mb-3">
              {t.kyc.timedOut || "Verification is taking longer than expected."}
            </p>
            {kycUrl && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full  bg-[#0DB7D0] hover:bg-[#0DB7D0]/80 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 mb-3"
              >
                <ExternalLink size={16} />
                {t.kyc.reopenLink || "Reopen KYC Link"}
              </button>
            )}
            <button
              onClick={() => {
                setPollingTimedOut(false);
                setPolling(true);
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              {t.kyc.checkAgain || "Check status again"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <Loader2
              size={32}
              className="animate-spin text-emerald-500 mx-auto mb-4"
            />
            <p className="text-sm font-medium text-slate-800 mb-1">
              {t.kyc.processing}
            </p>
            <p className="text-xs text-slate-500">{t.kyc.waiting}</p>
            <button
              onClick={() => setStep(AppStep.WALLET)}
              className="mt-6 text-xs text-slate-300 hover:text-slate-500"
            >
              (Demo: Skip)
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default KYCStep;
