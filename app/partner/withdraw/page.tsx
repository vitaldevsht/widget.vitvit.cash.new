"use client";

import WithdrawPartnerStep from "@/components/steps/WithdrawPartnerStep";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LogOut } from "lucide-react";
import { TRANSLATIONS } from "@/constants";
import { Language } from "@/types";
import { useAppStore } from "@/store";
import { AuthPhoneStep } from "@/components/steps";

const WithdrawContent = () => {
  const router = useRouter();
  const { lang, setLang, authData, setPhone, setAreaCode, logout } =
    useAppStore();
  const t = TRANSLATIONS[lang];
  const searchParams = useSearchParams();

  const amountParam = searchParams.get("amount");
  const amount = Number(amountParam);
  const validAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  const urlAccessToken = searchParams.get("access_token") || "";
  const accessToken = urlAccessToken || authData?.accessToken || "";

  const profilePhone = searchParams.get("phone") || "";

  useEffect(() => {
    if (!profilePhone) return;
    const digits = profilePhone.replace(/\D/g, "");
    if (digits.startsWith("509")) {
      setAreaCode("509");
      setPhone(digits.slice(3));
    } else if (digits.startsWith("1") && digits.length === 11) {
      setAreaCode("1");
      setPhone(digits.slice(1));
    } else {
      setPhone(digits);
    }
  }, [profilePhone, setPhone, setAreaCode]);

  const profile = {
    clientId: searchParams.get("clientId") || searchParams.get("userId") || "",
    phone: profilePhone,
    email: searchParams.get("email") || "",
    first_name: searchParams.get("first_name") || "",
    last_name: searchParams.get("last_name") || "",
    partner_id: searchParams.get("partner_id") || "",
    access_token: accessToken,
    external_address: searchParams.get("external_address") || "",
    partner_address: searchParams.get("partner_address") || "",
    partner_fee: parseFloat(searchParams.get("partner_fee")) || 0,
    withdraw_fee: parseFloat(searchParams.get("withdraw_fee")) || 0,
    account_number: searchParams.get("account_number") || "",
    account_name: searchParams.get("account_name") || "",
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col lg:flex-row">
      {/* Left / Main Content Area */}
      <div className="flex-1 flex flex-col  items-center  lg:p-8">
        <div className="w-full max-w-[440px] lg:bg-white p-6 sm:p-8 transition-all duration-300 relative">
          {accessToken && (
            <div className="flex justify-end items-center gap-2 mb-4">
              <div className="relative group z-20">
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors uppercase"
                >
                  {lang}
                </button>
                <div className="absolute right-0 top-full pt-1 w-24 hidden group-hover:block">
                  <div className="bg-white rounded shadow-lg border border-slate-100 overflow-hidden">
                    {(Object.keys(TRANSLATIONS) as Language[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${
                          lang === l
                            ? "font-bold text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/partner/session", {
                      method: "DELETE",
                      credentials: "include",
                      cache: "no-store",
                    });
                  } catch (e) {
                    console.error("Failed to clear server session", e);
                  }
                  try {
                    sessionStorage.removeItem("partner.access_token");
                    sessionStorage.removeItem("partner.external_address");
                  } catch {}
                  try {
                    localStorage.removeItem("vitvit-storage");
                  } catch {}
                  logout();
                  location.reload();
                }}
                className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          {accessToken ? (
            <WithdrawPartnerStep t={t} amount={validAmount} profile={profile} />
          ) : (
            <AuthPhoneStep t={t} />
          )}
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
    <WithdrawContent />
  </Suspense>
);

export default App;
