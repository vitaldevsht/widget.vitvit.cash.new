import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, AppStep } from "./types";

interface AuthData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  user: {
    id: string;
    user_metadata?: {
      email_verified?: boolean;
      ip?: string;
      key_hash?: string;
    };
  } | null;
}

interface AppState {
  userId: string;
  lang: Language;
  step: AppStep;
  inputCurrency: "HTGV" | "USDC";
  amount: number;
  email: string;
  phone: string;
  areaCode: string;
  kycSessionId: string | null;
  walletAddress: string;
  orderId: string | null;
  pin: string | null;
  isLocked: boolean;
  authData: AuthData | null;

  balanceHTGV: number;
  balanceUSDC: number;
  setBalanceHTGV: (amount: number) => void;
  setBalanceUSDC: (amount: number) => void;

  lastStep: number | 1;

  setLastStep: (step: number | null) => void;

  setUserId: (id: string) => void;
  setLang: (lang: Language) => void;
  setStep: (step: AppStep) => void;
  setInputCurrency: (currency: "HTGV" | "USDC") => void;
  setAmount: (amount: number) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setAreaCode: (areaCode: string) => void;
  setKycSessionId: (id: string | null) => void;
  setWalletAddress: (address: string) => void;
  setOrderId: (id: string | null) => void;
  setPin: (pin: string | null) => void;
  setIsLocked: (locked: boolean) => void;
  setAuthData: (data: AuthData | null) => void;
  reset: () => void;
  logout: () => void;
  toggleCurrency: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userId: "",
      lang: "fr",
      step: AppStep.QUOTE,
      inputCurrency: "HTGV",
      amount: 1000,
      email: "",
      phone: "",
      areaCode: "509",
      kycSessionId: null,
      walletAddress: "",
      orderId: null,
      pin: null,
      isLocked: false,
      authData: null,
      balanceHTGV: 0,
      balanceUSDC: 0,
      setBalanceHTGV: (balanceHTGV) => set({ balanceHTGV }),
      setBalanceUSDC: (balanceUSDC) => set({ balanceUSDC }),
      lastStep: 1,

      setLastStep: (lastStep) => set({ lastStep }),
      setUserId: (userId) => set({ userId }),
      setLang: (lang) => set({ lang }),
      setStep: (step) => set({ step }),
      setInputCurrency: (inputCurrency) => set({ inputCurrency }),
      setAmount: (amount) => set({ amount }),
      setEmail: (email) => set({ email }),
      setPhone: (phone) => set({ phone }),
      setAreaCode: (areaCode) => set({ areaCode }),
      setKycSessionId: (kycSessionId) => set({ kycSessionId }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setOrderId: (orderId) => set({ orderId }),
      setPin: (pin) => set({ pin }),
      setIsLocked: (isLocked) => set({ isLocked }),
      setAuthData: (authData) => set({ authData }),
      toggleCurrency: () =>
        set((state) => {
          const newCurrency = state.inputCurrency === "HTGV" ? "USDC" : "HTGV";
          return { inputCurrency: newCurrency, amount: 0 };
        }),
      reset: () =>
        set({
          step: AppStep.QUOTE,
          amount: 1000,
          inputCurrency: "HTGV",
          orderId: null,
          // We do NOT reset email, phone, kycSessionId, userId, walletAddress, or pin
        }),
      logout: () =>
        set((state) => ({
          userId: "",
          lang: "fr",
          step: state.pin ? AppStep.ENTER_PIN : AppStep.QUOTE,
          inputCurrency: "HTGV",
          amount: 1000,
          email: "",
          phone: "",
          kycSessionId: null,
          walletAddress: "",
          orderId: null,
          pin: state.pin, // Keep the PIN
          isLocked: !!state.pin, // Lock if PIN exists
          authData: null,
        })),
    }),
    {
      name: "vitvit-storage", // unique name
      version: 1,
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted) {
          // Drop legacy client-generated fake userId so the real one (URL/session) wins.
          return { ...persisted, userId: "" };
        }
        return persisted;
      },
      partialize: (state) => ({
        // Persist these fields
        userId: state.userId,
        lang: state.lang,
        email: state.email,
        phone: state.phone,
        areaCode: state.areaCode,
        kycSessionId: state.kycSessionId,
        walletAddress: state.walletAddress,
        orderId: state.orderId,
        pin: state.pin,
        authData: state.authData,
        balanceHTGV: state.balanceHTGV,
        balanceUSDC: state.balanceUSDC,
      }),
    }
  )
);
