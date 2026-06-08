"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  Zap,
  Loader2,
  X,
  ExternalLinkIcon,
  Pencil,
  Check,
  Eye,
  EyeOff,
  ArrowUpDown,
} from "lucide-react";
import { TRANSLATIONS } from "../../constants";
import { Language, AppStep } from "../../types";
import Sidebar from "../../components/Sidebar";
import AccountMenu from "../../components/AccountMenu";
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
} from "../../components/steps";
import { useAppStore } from "../../store";

interface BalanceItem {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenAddress: string;
  amount: number;
}

interface RateItem {
  label: string;
  HTGV_USDC?: number;
  USDC_HTGV?: number;
  HTGV_USD?: number;
  USD_HTGV?: number;
}

interface UserBalancesResponse {
  balances: BalanceItem[];
  rates: RateItem[];
}

const PartnerContent: React.FC = () => {
  const {
    lang,
    setLang,
    step,
    setStep,
    lastStep,
    phone,
    email,
    kycSessionId,
    authData,
    setAuthData,
    userId,
    balanceHTGV,
    balanceUSDC,
    setBalanceHTGV,
    setBalanceUSDC,
    setUserId,
    setPhone,
    setEmail,
    setWalletAddress,
  } = useAppStore();
  const searchParams = useSearchParams();

  const urlAccessToken = searchParams.get("access_token") || "";
  const accessToken = urlAccessToken || authData?.accessToken || "";

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [externalAddress, setExternalAddress] = useState<string | null>(null);
  const [buyUsdcRate, setBuyUsdcRate] = useState<number | null>(null);
  const [sellUsdcRate, setSellUsdcRate] = useState<number | null>(null);
  const t = TRANSLATIONS[lang];
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [changeFrom, setChangeFrom] = useState<"HTGV" | "USDC">("HTGV");
  const [changeAmount, setChangeAmount] = useState<string>("");
  const [changeSubmitting, setChangeSubmitting] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);
  const [balancesRefreshKey, setBalancesRefreshKey] = useState(0);

  const [sent_to_addr, setSent_to_addr] = useState<string | null>(null);
  const [editingExternalAddress, setEditingExternalAddress] = useState(false);
  const [externalAddressDraft, setExternalAddressDraft] = useState<string>("");

  const EXTERNAL_ADDRESS_KEY = "partner.external_address";

  const saveExternalAddress = () => {
    const trimmed = externalAddressDraft.trim();
    if (trimmed) {
      setExternalAddress(trimmed);
      if (sent_to_addr) setSent_to_addr(trimmed);
      try {
        sessionStorage.setItem(EXTERNAL_ADDRESS_KEY, trimmed);
      } catch {}
    } else {
      setExternalAddress(null);
      setSent_to_addr(null);
      try {
        sessionStorage.removeItem(EXTERNAL_ADDRESS_KEY);
      } catch {}
    }
    setEditingExternalAddress(false);
  };

  const startEditExternalAddress = () => {
    setExternalAddressDraft(externalAddress ?? "");
    setEditingExternalAddress(true);
  };

  // Display rate (HTGV per 1 USDC) — falls back until rates load
  const displayRate = buyUsdcRate ?? sellUsdcRate ?? 131.15;

  const BALANCE_LABELS: Record<
    Language,
    {
      title: string;
      hide: string;
      show: string;
    }
  > = {
    en: {
      title: "Your balance",
      hide: "Hide",
      show: "Show",
    },
    fr: {
      title: "Votre solde",
      hide: "Masquer",
      show: "Afficher",
    },
    ht: {
      title: "Balans ou",
      hide: "Kache",
      show: "Montre",
    },
  };
  const bl = BALANCE_LABELS[lang];

  const formatHTGV = (n: number) =>
    new Intl.NumberFormat("fr-HT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const formatUSDC = (n: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const hide = (s: string) => s.replace(/[\d.,]/g, "•");

  const FORM_LABELS: Record<
    Language,
    {
      changeTitle: string;
      changeSubtitle: string;
      from: string;
      to: string;
      amount: string;
      rate: string;
      available: string;
      max: string;
      confirmChange: string;
      cancel: string;
      insufficient: string;
      externalAddress: string;
      sendToExternal: string;
      off: string;
      editAddress: string;
      saveAddress: string;
      addressPh: string;
    }
  > = {
    en: {
      changeTitle: "Exchange",
      changeSubtitle: "Convert between HTGV and USDC",
      from: "From",
      to: "To",
      amount: "Amount",
      rate: "Rate",
      available: "Available",
      max: "Max",
      confirmChange: "Confirm exchange",
      cancel: "Cancel",
      insufficient: "Insufficient balance",
      externalAddress: "External address",
      sendToExternal: "Send to external",
      off: "off",
      editAddress: "Edit",
      saveAddress: "Save",
      addressPh: "External wallet address",
    },
    fr: {
      changeTitle: "Échanger",
      changeSubtitle: "Convertir entre HTGV et USDC",
      from: "De",
      to: "Vers",
      amount: "Montant",
      rate: "Taux",
      available: "Disponible",
      max: "Max",
      confirmChange: "Confirmer l'échange",
      cancel: "Annuler",
      insufficient: "Solde insuffisant",
      externalAddress: "Adresse externe",
      sendToExternal: "Envoyer vers externe",
      off: "off",
      editAddress: "Modifier",
      saveAddress: "Enregistrer",
      addressPh: "Adresse wallet externe",
    },
    ht: {
      changeTitle: "Chanje",
      changeSubtitle: "Konvèti ant HTGV ak USDC",
      from: "Soti",
      to: "Ale",
      amount: "Montan",
      rate: "To",
      available: "Disponib",
      max: "Maks",
      confirmChange: "Konfime chanjman",
      cancel: "Anile",
      insufficient: "Pa gen ase lajan",
      externalAddress: "Adrès deyò",
      sendToExternal: "Voye nan adrès deyò",
      off: "off",
      editAddress: "Chanje",
      saveAddress: "Anrejistre",
      addressPh: "Adrès wallet deyò",
    },
  };
  const fl = FORM_LABELS[lang];

  const changeTo = changeFrom === "HTGV" ? "USDC" : "HTGV";
  const changeAmtNum = Number(changeAmount) || 0;
  // HTGV→USDC uses the BUY USDC rate; USDC→HTGV uses the SELL USDC rate.
  const buyRate = buyUsdcRate ?? displayRate;
  const sellRate = sellUsdcRate ?? displayRate;
  const changeReceive =
    changeFrom === "HTGV" ? changeAmtNum / buyRate : changeAmtNum * sellRate;
  const changeBalance = changeFrom === "HTGV" ? balanceHTGV : balanceUSDC;
  const changeInsufficient = changeAmtNum > changeBalance;
  const changeDisabled = changeAmtNum <= 0 || changeInsufficient;

  const formatAmt = (n: number, c: "HTGV" | "USDC") =>
    c === "HTGV" ? formatHTGV(n) : formatUSDC(n);

  useEffect(() => {
    setIsMounted(true);
    setStep(2);

    const EXTERNAL_ADDRESS_KEY = "partner.external_address";

    // 1. Credentials in the URL win (fresh entry from partner).
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get("user_id");
    const urlExternalAddress = params.get("external_address");

    if (urlUserId) {
      setUserId(urlUserId);
      if (urlExternalAddress) {
        setExternalAddress(urlExternalAddress);
        try {
          sessionStorage.setItem(EXTERNAL_ADDRESS_KEY, urlExternalAddress);
        } catch {}
      }
      return;
    }

    // 2. Refresh path: userId persists via the store.
    const storedExternalAddress = (() => {
      try {
        return sessionStorage.getItem(EXTERNAL_ADDRESS_KEY);
      } catch {
        return null;
      }
    })();
    if (storedExternalAddress) setExternalAddress(storedExternalAddress);
    if (userId) return;

    // 3. No URL params, no persisted userId — try the cookie session.
    (async () => {
      try {
        const res = await fetch("/api/partner/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSessionError(data?.error || "Not authenticated");
          return;
        }
        const data = await res.json();
        const u = data?.user;
        if (u?.id) setUserId(u.id);
        if (u?.phone) setPhone(String(u.phone).replace(/^\+?509/, ""));
        if (u?.email) setEmail(u.email);
      } catch (e: any) {
        console.error("Failed to load session", e);
        setSessionError(e?.message || "Failed to load session");
      }
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setBalancesLoading(true);
    setBalancesError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/partner/user-balances?user_id=${encodeURIComponent(userId)}`,
          {
            cache: "no-store",
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined,
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return;
          // throw new Error(data?.error || `Request failed (${res.status})`);
        }
        const data: UserBalancesResponse = await res.json();
        if (cancelled) return;

        const htgv = data.balances?.find((b) => b.symbol === "HTGV");
        const usdc = data.balances?.find((b) => b.symbol === "USDC");
        setBalanceHTGV(htgv?.amount ?? 0);
        setBalanceUSDC(usdc?.amount ?? 0);

        const buy = data.rates?.find((r) => r.label === "BUY USDC")?.HTGV_USDC;
        const sell = data.rates?.find(
          (r) => r.label === "SELL USDC",
        )?.USDC_HTGV;
        if (typeof buy === "number") setBuyUsdcRate(buy);
        if (typeof sell === "number") setSellUsdcRate(sell);
      } catch (e: any) {
        if (cancelled) return;
        console.error("Failed to load balances", e);
        setBalancesError(e?.message || "Failed to load balances");
      } finally {
        if (!cancelled) setBalancesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, accessToken, balancesRefreshKey, setBalanceHTGV, setBalanceUSDC]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/partner/user?user_id=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data?.phone) {
          setPhone(String(data.phone).replace(/^\+?509/, ""));
        }
        if (data?.email) setEmail(data.email);
        if (data?.wallet_address) setWalletAddress(data.wallet_address);
      } catch (e) {
        console.error("Failed to load partner user", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, setPhone, setEmail, setWalletAddress]);

  const handleConfirmChange = async () => {
    if (!userId || changeDisabled || changeSubmitting) return;
    setChangeSubmitting(true);
    setChangeError(null);
    setChangeSuccess(null);
    try {
      const res = await fetch("/api/exchange/forex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          token_1: changeFrom,
          token_2: changeTo,
          amount: changeAmtNum,
          sent_to: sent_to_addr,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || `Request failed (${res.status})`,
        );
      }
      setChangeSuccess(
        `${formatAmt(changeAmtNum, changeFrom)} ${changeFrom} → ${formatAmt(
          changeReceive,
          changeTo,
        )} ${changeTo}`,
      );
      setChangeAmount("");
      setBalancesRefreshKey((k) => k + 1);
    } catch (e: any) {
      console.error("Exchange failed", e);
      setChangeError(e?.message || "Exchange failed");
    } finally {
      setChangeSubmitting(false);
    }
  };

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
        {step === AppStep.QUOTE ||
          step === AppStep.SET_PIN ||
          step === AppStep.ENTER_PIN}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}

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
      <div className="flex-1 flex flex-col  items-center  lg:p-8">
        <div className="w-full max-w-[440px] lg:bg-white p-6 sm:p-8 transition-all duration-300 relative">
          {accessToken ? (
            <div className="flex-1 flex flex-col  items-center  lg:p-8">
              <div className="w-full max-w-[440px] lg:bg-white lg:p-8 transition-all duration-300 relative">
                <Header />

                <div className="transition-opacity duration-300 min-h-[55vh]">
                  {sessionError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {sessionError}
                    </div>
                  )}
                  {balancesError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {balancesError}
                    </div>
                  )}
                  {/* Main */}
                  <div className="space-y-5">
                    {/* Balance header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {bl.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBalanceVisible((v) => !v)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        aria-label={balanceVisible ? bl.hide : bl.show}
                      >
                        {balanceVisible ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                        <span>{balanceVisible ? bl.hide : bl.show}</span>
                      </button>
                    </div>

                    {/* Balances */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            HTGV
                          </span>
                          <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center text-[10px] font-bold">
                            G
                          </span>
                        </div>
                        <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums h-7 flex items-center">
                          {balancesLoading ? (
                            <span className="inline-block h-5 w-20 rounded bg-slate-200 animate-pulse" />
                          ) : balanceVisible ? (
                            formatHTGV(balanceHTGV)
                          ) : (
                            hide(formatHTGV(balanceHTGV))
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Gourdes
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            USDC
                          </span>
                          <span className="h-5 w-5 rounded-full bg-cyan-500/10 text-cyan-600 grid place-items-center text-[10px] font-bold">
                            $
                          </span>
                        </div>
                        <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums h-7 flex items-center">
                          {balancesLoading ? (
                            <span className="inline-block h-5 w-20 rounded bg-slate-200 animate-pulse" />
                          ) : balanceVisible ? (
                            formatUSDC(balanceUSDC)
                          ) : (
                            hide(formatUSDC(balanceUSDC))
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          USD Coin
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Change Form */}
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        {fl.changeTitle}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        1 USDC ≈ {displayRate.toFixed(2)} HTGV
                      </span>
                    </div>

                    {/* External address */}
                    {editingExternalAddress ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={externalAddressDraft}
                          onChange={(e) =>
                            setExternalAddressDraft(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveExternalAddress();
                            if (e.key === "Escape")
                              setEditingExternalAddress(false);
                          }}
                          placeholder={fl.addressPh}
                          className="flex-1 min-w-0 px-2.5 py-1.5 border border-[#0DB7D0] bg-white rounded-md outline-none focus:ring-1 focus:ring-[#0DB7D0]/30 text-[11px] text-slate-900 placeholder-slate-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={saveExternalAddress}
                          aria-label={fl.saveAddress}
                          className="p-1.5 rounded-md bg-[#0DB7D0] text-white hover:bg-[#0DB7D0]/90 transition-all"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingExternalAddress(false)}
                          aria-label={fl.cancel}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border text-[10px] font-semibold transition-all ${
                          sent_to_addr
                            ? "border-[#0DB7D0] bg-cyan-50 text-[#0DB7D0]"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            externalAddress &&
                            setSent_to_addr((curr) =>
                              curr ? null : externalAddress,
                            )
                          }
                          disabled={!externalAddress}
                          className="flex-1 flex items-center justify-between gap-2 min-w-0 disabled:cursor-default"
                        >
                          <span className="uppercase tracking-wider">
                            {fl.sendToExternal}
                          </span>
                          <span className="font-mono normal-case truncate max-w-[160px]">
                            {sent_to_addr
                              ? sent_to_addr
                              : externalAddress
                                ? externalAddress
                                : fl.off}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={startEditExternalAddress}
                          aria-label={fl.editAddress}
                          className="p-1 rounded text-slate-400 hover:text-[#0DB7D0] transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    {/* From */}
                    <div>
                      <div className="flex items-center border border-slate-300 bg-white rounded-md px-2.5 py-2 gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          {fl.from}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(e.target.value)}
                          placeholder="0"
                          className="flex-1 text-base font-semibold text-slate-900 outline-none placeholder-slate-300 bg-transparent tabular-nums min-w-0"
                        />
                        <span className="text-[11px] font-bold text-slate-700 px-1.5 py-0.5 rounded bg-slate-100">
                          {changeFrom}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5 px-0.5">
                        <span className="text-[10px] text-slate-400">
                          {fl.available}: {formatAmt(changeBalance, changeFrom)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChangeAmount(String(changeBalance))}
                          className="text-[10px] font-semibold text-[#0DB7D0] hover:underline"
                        >
                          {fl.max}
                        </button>
                      </div>
                    </div>
                    {/* Swap */}
                    <div className="flex justify-center -my-1">
                      <button
                        type="button"
                        onClick={() => {
                          setChangeFrom((c) =>
                            c === "HTGV" ? "USDC" : "HTGV",
                          );
                          setChangeAmount("");
                        }}
                        className="bg-white border border-slate-200 p-1 rounded-full shadow-sm hover:border-[#0DB7D0] hover:text-[#0DB7D0] transition-all"
                      >
                        <ArrowUpDown size={12} className="text-slate-500" />
                      </button>
                    </div>
                    {/* To */}
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-md px-2.5 py-2 gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {fl.to}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={formatAmt(changeReceive, changeTo)}
                        className="flex-1 text-base font-semibold text-slate-900 outline-none bg-transparent tabular-nums min-w-0"
                      />
                      <span className="text-[11px] font-bold text-slate-700 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {changeTo}
                      </span>
                    </div>
                    {changeInsufficient && (
                      <p className="text-[11px] text-red-500">
                        {fl.insufficient}
                      </p>
                    )}
                    {changeError && (
                      <p className="text-[11px] text-red-500 break-words">
                        {changeError}
                      </p>
                    )}
                    {changeSuccess && (
                      <p className="text-[11px] text-emerald-600 break-words">
                        {changeSuccess}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={changeDisabled || changeSubmitting}
                      onClick={handleConfirmChange}
                      className="w-full bg-[#0DB7D0] hover:bg-[#0DB7D0]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      {changeSubmitting && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {fl.confirmChange}
                    </button>
                  </div>
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

              {/* Footer Links Mobile */}
              <div className="mt-8 flex gap-6 text-xs text-slate-400 lg:hidden">
                <a href="#">{t.common.privacy}</a>
                <a href="#">{t.common.terms}</a>
                <a href="#">{t.common.help}</a>
              </div>
            </div>
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
    <PartnerContent />
  </Suspense>
);

export default App;
