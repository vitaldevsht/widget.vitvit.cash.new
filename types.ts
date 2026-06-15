export type Language = "en" | "fr" | "ht";

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
    timedOut: string;
    reopenLink: string;
    checkAgain: string;
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
    errorAuth: string;
    errorNetwork: string;
    errorInvalid: string;
    errorMissingInfo: string;
    failedTitle: string;
    failedMessage: string;
    goHome: string;
    viewBalance: string;
    amountToPay: string;
    selectPaymentMethod: string;
    instant: string;
    moncashInstant: string;
    moncashInstantDesc: string;
    moncashTransfer: string;
    moncashTransferDesc: string;
    natcashTransfer: string;
    natcashTransferDesc: string;
    bankDeposit: string;
    bankDepositDesc: string;
    changePaymentMethod: string;
    sendTo: string;
    importantTransfer: string;
    sentPayment: string;
    amountToTransfer: string;
    chooseBankAccount: string;
    accountName: string;
    accountNumber: string;
    reference: string;
    importantBank: string;
    madeDeposit: string;
    uploadProof: string;
    uploadProofDesc: string;
    removeImage: string;
    proofRequired: string;
  };
  partnerDeposit: {
    sendToExternal: string;
    off: string;
    stageComplete: string;
    stageFailed: string;
    stageProcessing: string;
    stagePending: string;
    paymentConfirmation: string;
    currencyExchange: string;
    deposited: string;
    exchangeRate: string;
    partnerFee: string;
    networkFee: string;
    youReceived: string;
    youWillReceive: string;
    sentTo: string;
    payNow: string;
    cancel: string;
    minDeposit: string;
  };
  partnerWithdraw: {
    title: string;
    subtitle: string;
    amountToWithdraw: string;
    minWithdraw: string;
    exchangeRate: string;
    partnerFee: string;
    withdrawFee: string;
    youWillReceive: string;
    sendCode: string;
    sending: string;
    codeSentTitle: string;
    codeSentMessage: string;
    verify: string;
    verifying: string;
    invalidCode: string;
    successTitle: string;
    successMessage: string;
    failedTitle: string;
    failedMessage: string;
    withdrawn: string;
    cancel: string;
    back: string;
    resend: string;
    availableBalance: string;
    useMax: string;
    insufficientBalance: string;
    swapping: string;
    willAutoConvert: string;
    swapFailed: string;
    insufficientCombined: string;
    processingNotice: string;
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
  setPin: {
    title: string;
    subtitle: string;
    label: string;
    confirmLabel: string;
    info: string;
    mismatch: string;
  };
  enterPin: {
    title: string;
    subtitle: string;
    label: string;
    forgot: string;
    error: string;
  };
}

export enum AppStep {
  QUOTE = 1,
  AUTH_EMAIL = 2,
  VERIFY_EMAIL = 3,
  AUTH_PHONE = 4,
  VERIFY_PHONE = 5,
  KYC = 6,
  WALLET = 7,
  DEPOSIT = 8,
  SUCCESS = 9,
  SET_PIN = 10,
  ENTER_PIN = 11,
}
