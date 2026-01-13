export type Language = 'en' | 'fr' | 'ht';

export interface Translations {
  common: {
    continue: string;
    loading: string;
    back: string;
    appName: string;
    privacy: string;
    terms: string;
    help: string;
    cookieSettings: string;
    interested: string;
    getStarted: string;
  };
  quote: {
    pay: string;
    receive: string;
    buy: string;
    cost: string;
    fees: string;
    total: string;
    buyTitle: string;
    buySubtitle: string;
    exchangeRate: string;
  };
  authPhone: {
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
    disclaimer: string;
  };
  verifyPhone: {
    title: string;
    subtitle: string;
    resend: string;
    codeLabel: string;
    info: string;
  };
  authEmail: {
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
  };
  verifyEmail: {
    title: string;
    subtitle: string;
    resend: string;
    codeLabel: string;
    info: string;
  };
  kyc: {
    title: string;
    subtitle: string;
    buttonStart: string;
    processing: string;
    waiting: string;
    error: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    addressLabel: string;
    placeholder: string;
    action: string;
  };
  deposit: {
    title: string;
    subtitle: string;
    buttonPay: string;
    processing: string;
    waiting: string;
    error: string;
    amountToPay: string;
  };
  success: {
    title: string;
    message: string;
    txId: string;
    return: string;
  };
  benefits: {
    title: string;
    secureTitle: string;
    secureDesc: string;
    flexibleTitle: string;
    flexibleDesc: string;
    feesTitle: string;
    feesDesc: string;
  };
}

export enum AppStep {
  QUOTE = 1,
  AUTH_PHONE = 2,
  VERIFY_PHONE = 3,
  AUTH_EMAIL = 4,
  VERIFY_EMAIL = 5,
  KYC = 6,
  WALLET = 7,
  DEPOSIT = 8,
  SUCCESS = 9
}
