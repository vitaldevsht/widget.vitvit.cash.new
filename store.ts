import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, AppStep } from './types';

interface AppState {
  userId: string;
  lang: Language;
  step: AppStep;
  inputCurrency: 'HTG' | 'USDC';
  amount: number;
  email: string;
  phone: string;
  kycSessionId: string | null;
  walletAddress: string;
  orderId: string | null;

  setUserId: (id: string) => void;
  setLang: (lang: Language) => void;
  setStep: (step: AppStep) => void;
  setInputCurrency: (currency: 'HTG' | 'USDC') => void;
  setAmount: (amount: number) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setKycSessionId: (id: string | null) => void;
  setWalletAddress: (address: string) => void;
  setOrderId: (id: string | null) => void;
  reset: () => void;
  logout: () => void;
  toggleCurrency: () => void;
}

const generateUserId = () => {
    // Simple ID generation for demo purposes
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userId: generateUserId(),
      lang: 'en',
      step: AppStep.QUOTE,
      inputCurrency: 'HTG',
      amount: 13250,
      email: '',
      phone: '',
      kycSessionId: null,
      walletAddress: '',
      orderId: null,

      setUserId: (userId) => set({ userId }),
      setLang: (lang) => set({ lang }),
      setStep: (step) => set({ step }),
      setInputCurrency: (inputCurrency) => set({ inputCurrency }),
      setAmount: (amount) => set({ amount }),
      setEmail: (email) => set({ email }),
      setPhone: (phone) => set({ phone }),
      setKycSessionId: (kycSessionId) => set({ kycSessionId }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setOrderId: (orderId) => set({ orderId }),
      toggleCurrency: () => set((state) => {
        const newCurrency = state.inputCurrency === 'HTG' ? 'USDC' : 'HTG';
        return { inputCurrency: newCurrency, amount: 0 };
      }),
      reset: () => set({
        step: AppStep.QUOTE,
        amount: 13250,
        inputCurrency: 'HTG',
        orderId: null,
        // We do NOT reset email, phone, kycSessionId, userId, or walletAddress 
      }),
      logout: () => set({
        userId: generateUserId(),
        lang: 'en',
        step: AppStep.QUOTE,
        inputCurrency: 'HTG',
        amount: 13250,
        email: '',
        phone: '',
        kycSessionId: null,
        walletAddress: '',
        orderId: null
      })
    }),
    {
      name: 'vitvit-storage', // unique name
      partialize: (state) => ({ 
        // Persist these fields
        userId: state.userId,
        lang: state.lang,
        email: state.email,
        phone: state.phone,
        kycSessionId: state.kycSessionId,
        walletAddress: state.walletAddress,
        orderId: state.orderId
      }), 
    }
  )
);
