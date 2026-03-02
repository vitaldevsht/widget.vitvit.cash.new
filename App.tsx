import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Zap, Loader2 } from "lucide-react";
import { TRANSLATIONS } from "./constants";
import { Language, AppStep } from "./types";
import Sidebar from "./components/Sidebar";
import AccountMenu from "./components/AccountMenu";
import {
  QuoteStep,
  AuthPhoneStep,
  AuthEmailStep,
  VerifyGenericStep,
  KYCStep,
  WalletStep,
  DepositStep,
  SuccessStep,
} from "./components/steps";
import { useAppStore } from "./store";

const App: React.FC = () => {
  const { lang, setLang, step, setStep, phone, email, kycSessionId } =
    useAppStore();
  const t = TRANSLATIONS[lang];
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const handlePhoneVerifyComplete = () => {
    if (kycSessionId) {
      setStep(AppStep.WALLET);
    } else {
      setStep(AppStep.KYC);
    }
  };

  const verifyPhoneOtp = async (
    code: string
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/whatsapp/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${phone}`,
          code,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        return { valid: true };
      }

      return {
        valid: false,
        error: data.error?.message || "Invalid verification code",
      };
    } catch {
      return { valid: false, error: "Verification failed. Please try again." };
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const Header = () => (
    <div className="flex justify-between items-center mb-6 relative">
      <div className="flex items-center gap-4">
        {step > 1 && step < 9 && (
          <button
            onClick={goBack}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {step === 1 && (
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg tracking-tight">
            <Zap className="fill-current" size={20} />
            <span>VitVit.Cash</span>
          </div>
        )}
        {step > 1 && step < 9 && (
          <div className="text-sm font-medium text-slate-500">
            {step === 2 && t.authEmail.title}
            {step === 3 && t.verifyEmail.title}
            {step === 4 && t.authPhone.title}
            {step === 5 && t.verifyPhone.title}
            {step === 6 && t.kyc.title}
            {step === 7 && t.wallet.title}
            {step === 8 && t.deposit.title}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative group z-20">
          <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors uppercase">
            {lang}
          </button>
          <div className="absolute right-0 mt-1 w-24 bg-white rounded shadow-lg border border-slate-100 hidden group-hover:block overflow-hidden">
            {(Object.keys(TRANSLATIONS) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${
                  lang === l ? "font-bold text-emerald-600" : "text-slate-600"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Button & Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={`p-1 rounded-full transition-colors ${
              menuOpen
                ? "bg-slate-100 text-slate-900"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MoreHorizontal size={20} />
          </button>
          <AccountMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col lg:flex-row">
      {/* Left / Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8 transition-all duration-300 relative">
          <Header />

          <div className="transition-opacity duration-300">
            {step === AppStep.QUOTE && <QuoteStep t={t} />}
            {step === AppStep.AUTH_EMAIL && <AuthEmailStep t={t} />}
            {step === AppStep.VERIFY_EMAIL && (
              <VerifyGenericStep
                t={t}
                target={email}
                translations={t.verifyEmail}
                onComplete={() => setStep(AppStep.AUTH_PHONE)}
              />
            )}
            {step === AppStep.AUTH_PHONE && <AuthPhoneStep t={t} />}
            {step === AppStep.VERIFY_PHONE && (
              <VerifyGenericStep
                t={t}
                target={`+509 ${phone}`}
                translations={t.verifyPhone}
                onComplete={handlePhoneVerifyComplete}
                onVerify={verifyPhoneOtp}
              />
            )}
            {step === AppStep.KYC && <KYCStep t={t} />}
            {step === AppStep.WALLET && <WalletStep t={t} />}
            {step === AppStep.DEPOSIT && <DepositStep t={t} />}
            {step === AppStep.SUCCESS && <SuccessStep t={t} />}
          </div>
        </div>

        {/* Footer Links Mobile */}
        <div className="mt-8 flex gap-6 text-xs text-slate-400 lg:hidden">
          <a href="#">{t.common.privacy}</a>
          <a href="#">{t.common.terms}</a>
          <a href="#">{t.common.help}</a>
        </div>
      </div>
      <div className="flex-1  border-l border-slate-200 flex flex-col justify-center items-center">
        {/* Right / Sidebar Area (Desktop Only) */}
        <Sidebar t={t} />
      </div>
    </div>
  );
};

export default App;
