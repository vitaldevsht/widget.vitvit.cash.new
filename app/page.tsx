"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Zap,
  Loader2,
  X,
  ExternalLinkIcon,
} from "lucide-react";
import { TRANSLATIONS } from "../constants";
import { Language, AppStep } from "../types";
import Sidebar from "../components/Sidebar";
import AccountMenu from "../components/AccountMenu";
import {
  QuoteStep,
  AuthPhoneStep,
  AuthEmailStep,
  VerifyGenericStep,
  KYCStep,
  WalletStep,
  DepositStep,
  SuccessStep,
  SetPinStep,
  EnterPinStep,
} from "../components/steps";
import { useAppStore } from "../store";

const App: React.FC = () => {
  const {
    lang,
    setLang,
    step,
    setStep,
    lastStep,
    phone,
    email,
    kycSessionId,
    setAuthData,
  } = useAppStore();
  const t = TRANSLATIONS[lang];
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setLang("ht");
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

  const goBack = () => {
    // if (step > 1) setStep(step - 1);
    setStep(1);
  };

  const Header = () => (
    <div className="flex justify-between items-center mb-6 relative">
      <div className="flex items-center gap-4">
        {step >= AppStep.AUTH_EMAIL && step <= AppStep.DEPOSIT && (
          <button
            onClick={goBack}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        )}
        {(step === AppStep.QUOTE ||
          step === AppStep.SET_PIN ||
          step === AppStep.ENTER_PIN) && (
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg tracking-tight">
            {/* <Zap className="fill-current" size={20} />
            <span>VitVit.Cash</span> */}
          </div>
        )}
        {/* {step >= AppStep.AUTH_EMAIL && step <= AppStep.DEPOSIT && (
          <div className="text-sm font-medium text-slate-500">
            {step === AppStep.AUTH_EMAIL && t.authEmail.title}
            {step === AppStep.VERIFY_EMAIL && t.verifyEmail.title}
            {step === AppStep.AUTH_PHONE && t.authPhone.title}
            {step === AppStep.VERIFY_PHONE && t.verifyPhone.title}
            {step === AppStep.KYC && t.kyc.title}
            {step === AppStep.WALLET && t.wallet.title}
            {step === AppStep.DEPOSIT && t.deposit.title}
          </div>
        )} */}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <button
          onClick={() => {
            window.open("https://8cd80508fff7.ngrok-free.app");
          }}
          className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors uppercase"
        >
          <ExternalLinkIcon size={16} />
        </button>
        <div className="relative group z-20">
          <button className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors uppercase">
            {lang}
          </button>
          <div className="absolute right-0 top-full pt-1 w-24 hidden group-hover:block">
            <div className="bg-white rounded shadow-lg border border-slate-100 overflow-hidden">
              {(Object.keys(TRANSLATIONS) as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${
                    lang === l ? "font-bold text-emerald-600" : "text-slate-600"
                  } `}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Button & Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={`p-1 cursor-pointer rounded-full transition-colors ${
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
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8 transition-all duration-300 relative">
          {/* <Header /> */}

          <div className="transition-opacity duration-300">
            {step === AppStep.QUOTE && <QuoteStep t={t} />}
            {step === AppStep.AUTH_EMAIL && <AuthEmailStep t={t} />}
            {step === AppStep.VERIFY_EMAIL && (
              <VerifyGenericStep
                t={t}
                target={email}
                translations={t.verifyEmail}
                onVerify={async (code) => {
                  const response = await fetch("/api/email/otp/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, token: code }),
                  });
                  const data = await response.json();
                  if (!response.ok || !data.valid) {
                    return {
                      valid: false,
                      error: data.error?.message || "Invalid code",
                    };
                  }
                  setAuthData({
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    refreshToken: data.refresh_token,
                    user: data.user,
                  });
                  return { valid: true };
                }}
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
              />
            )}

            {step === AppStep.KYC && <KYCStep t={t} />}
            {step === AppStep.WALLET && <WalletStep t={t} />}
            {step === AppStep.DEPOSIT && <DepositStep t={t} />}
            {step === AppStep.SUCCESS && <SuccessStep t={t} />}
            {step === AppStep.SET_PIN && <SetPinStep t={t} />}
            {step === AppStep.ENTER_PIN && <EnterPinStep t={t} />}
          </div>
        </div>

        {/* Footer Links Mobile */}
        {/* <div className="mt-8 flex gap-6 text-xs text-slate-400 lg:hidden">
          <a href="#">{t.common.privacy}</a>
          <a href="#">{t.common.terms}</a>
          <a href="#">{t.common.help}</a>
        </div> */}
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Right / Sidebar Area (Desktop Only) */}
        <Sidebar t={t} />
      </div>
    </div>
  );
};

export default App;
