"use client";

import DepositStep from "@/components/steps/DepositPartnerStep";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TRANSLATIONS } from "@/constants";
import { useAppStore } from "@/store";

const DepositContent = () => {
  const { lang } = useAppStore();
  const t = TRANSLATIONS[lang];
  const searchParams = useSearchParams();

  const amountParam = searchParams.get("amount");
  const amount = Number(amountParam);
  const validAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  const profile = {
    clientId: searchParams.get("clientId") || searchParams.get("userId") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    first_name: searchParams.get("first_name") || "",
    last_name: searchParams.get("last_name") || "",
    partner_id: searchParams.get("partner_id") || "",
    access_token: searchParams.get("access_token") || "",
    external_address: searchParams.get("external_address") || "",
  };

  return (
    // <div className="min-h-screen bg-[#F6F9FC]  px-10 lg:max-w-2xl mx-auto w-full max-w-[440px]">

    // </div>

    <div className="min-h-screen bg-[#F6F9FC] flex flex-col lg:flex-row">
      {/* Left / Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8">
        <div className="w-full max-w-[440px] lg:bg-white p-6 sm:p-8 transition-all duration-300 relative">
          <DepositStep t={t} amount={validAmount} profile={profile} />
        </div>

        {/* Footer Links Mobile */}
        <div className="mt-8 flex gap-6 text-xs text-slate-400 lg:hidden">
          <a href="#">{t.common.privacy}</a>
          <a href="#">{t.common.terms}</a>
          <a href="#">{t.common.help}</a>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Suspense>
    <DepositContent />
  </Suspense>
);

export default App;
