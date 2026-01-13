import { Translations } from './types';

export const HTG_TO_USDC_RATE = 132.50; // Example rate
export const NETWORK_FEE_USD = 0.05; // Solana is cheap
export const SERVICE_FEE_PERCENT = 0.02; // 2%

export const API_CONFIG = {
  MONCASH_BUSINESS_ID: 'a8c3dbf5-1247-4609-a805-009edf974495',
  MONCASH_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhOGMzZGJmNS0xMjQ3LTQ2MDktYTgwNS0wMDllZGY5NzQ0OTUiLCJlbWFpbCI6InNhdXZlbmVsMjAxM0BnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2ODMxODE5NywiZXhwIjoxNzk5ODU0MTk3fQ.o3QeJA38vgY2B1D6LoZ6OUFpPJ-DT7i93dZznCDQezA'
};

export const TRANSLATIONS: Record<string, Translations> = {
  en: {
    common: {
      continue: "Continue",
      loading: "Processing...",
      back: "Back",
      appName: "VitVit.Cash",
      privacy: "Privacy",
      terms: "Terms",
      help: "Help",
      cookieSettings: "Cookie Settings",
      interested: "Interested in adding this to your site?",
      getStarted: "Get started"
    },
    quote: {
      pay: "You pay",
      receive: "You receive",
      buy: "You buy",
      cost: "Total cost",
      fees: "Fees",
      total: "Total",
      buyTitle: "Buy USDC (Solana)",
      buySubtitle: "Pay with MonCash or Bank Transfer",
      exchangeRate: "Rate",
    },
    authPhone: {
      title: "What's your number?",
      subtitle: "We need your phone number to secure your account.",
      label: "Phone number (Haiti)",
      placeholder: "e.g. 3123 4567",
      disclaimer: "By continuing you agree to the Terms of Service and Privacy Policy.",
    },
    verifyPhone: {
      title: "Verify your phone",
      subtitle: "Enter the 6-digit code sent to",
      resend: "Resend code",
      codeLabel: "Secure Code",
      info: "Test mode: Enter 000000 to continue.",
    },
    authEmail: {
      title: "What's your email?",
      subtitle: "We'll send your transaction receipt here.",
      label: "Email address",
      placeholder: "name@example.com",
    },
    verifyEmail: {
      title: "Verify your email",
      subtitle: "Enter the 6-digit code sent to",
      resend: "Resend code",
      codeLabel: "Secure Code",
      info: "Test mode: Enter 000000 to continue.",
    },
    kyc: {
      title: "Verify your identity",
      subtitle: "To comply with regulations, we need to verify your ID using our secure partner.",
      buttonStart: "Start Verification",
      processing: "Starting verification session...",
      waiting: "Please complete verification in the new window. We are waiting for confirmation...",
      error: "Unable to start verification. Please try again."
    },
    wallet: {
      title: "Add a new wallet",
      subtitle: "Your purchase of USDC will be sent to this wallet.",
      addressLabel: "Solana wallet address",
      placeholder: "Paste your Solana wallet address",
      action: "Confirm Wallet",
    },
    deposit: {
      title: "Fund your account",
      subtitle: "Complete the payment to receive your USDC.",
      buttonPay: "Pay with MonCash",
      processing: "Creating payment...",
      waiting: "Waiting for payment confirmation...",
      error: "Payment creation failed. Please try again.",
      amountToPay: "Amount to pay"
    },
    success: {
      title: "Transfer Initiated!",
      message: "Your payment has been confirmed. You will receive USDC shortly.",
      txId: "Transaction ID",
      return: "Start New Transaction",
    },
    benefits: {
      title: "Instantly buy crypto",
      secureTitle: "Fast and secure",
      secureDesc: "Pay faster with MonCash or local transfers that meet the highest security standards.",
      flexibleTitle: "Flexible ways to pay",
      flexibleDesc: "Choose between MonCash, Natcom, or Bank Transfer.",
      feesTitle: "Low fees",
      feesDesc: "Save up to 50% on fees compared to traditional remittances.",
    }
  },
  fr: {
    common: {
      continue: "Continuer",
      loading: "Chargement...",
      back: "Retour",
      appName: "VitVit.Cash",
      privacy: "Confidentialité",
      terms: "Conditions",
      help: "Aide",
      cookieSettings: "Paramètres des cookies",
      interested: "Intéressé à ajouter ceci à votre site ?",
      getStarted: "Commencer"
    },
    quote: {
      pay: "Vous payez",
      receive: "Vous recevez",
      buy: "Vous achetez",
      cost: "Coût total",
      fees: "Frais",
      total: "Total",
      buyTitle: "Acheter USDC (Solana)",
      buySubtitle: "Payer avec MonCash ou virement bancaire",
      exchangeRate: "Taux",
    },
    authPhone: {
      title: "Quel est votre numéro ?",
      subtitle: "Nous avons besoin de votre numéro pour sécuriser votre compte.",
      label: "Numéro de téléphone (Haïti)",
      placeholder: "ex. 3123 4567",
      disclaimer: "En continuant, vous acceptez les Conditions et la Politique de confidentialité.",
    },
    verifyPhone: {
      title: "Vérifiez votre téléphone",
      subtitle: "Entrez le code à 6 chiffres envoyé au",
      resend: "Renvoyer le code",
      codeLabel: "Code de sécurité",
      info: "Mode test : Entrez 000000 pour continuer.",
    },
    authEmail: {
      title: "Quel est votre email ?",
      subtitle: "Nous enverrons votre reçu de transaction ici.",
      label: "Adresse email",
      placeholder: "nom@exemple.com",
    },
    verifyEmail: {
      title: "Vérifiez votre email",
      subtitle: "Entrez le code à 6 chiffres envoyé à",
      resend: "Renvoyer le code",
      codeLabel: "Code de sécurité",
      info: "Mode test : Entrez 000000 pour continuer.",
    },
    kyc: {
      title: "Vérifiez votre identité",
      subtitle: "Pour respecter la réglementation, nous devons vérifier votre identité via notre partenaire sécurisé.",
      buttonStart: "Commencer la vérification",
      processing: "Démarrage de la session...",
      waiting: "Veuillez terminer la vérification dans la nouvelle fenêtre...",
      error: "Impossible de démarrer la vérification."
    },
    wallet: {
      title: "Ajouter un portefeuille",
      subtitle: "Votre achat d'USDC sera envoyé à ce portefeuille.",
      addressLabel: "Adresse du portefeuille Solana",
      placeholder: "Collez votre adresse de portefeuille Solana",
      action: "Confirmer le portefeuille",
    },
    deposit: {
      title: "Financer votre compte",
      subtitle: "Effectuez le paiement pour recevoir vos USDC.",
      buttonPay: "Payer avec MonCash",
      processing: "Création du paiement...",
      waiting: "En attente de la confirmation du paiement...",
      error: "Échec de la création du paiement.",
      amountToPay: "Montant à payer"
    },
    success: {
      title: "Transfert initié !",
      message: "Votre paiement a été confirmé. Vous recevrez des USDC sous peu.",
      txId: "ID de transaction",
      return: "Nouvelle transaction",
    },
    benefits: {
      title: "Achetez de la crypto instantanément",
      secureTitle: "Rapide et sécurisé",
      secureDesc: "Payez plus rapidement avec MonCash ou des virements locaux répondant aux normes de sécurité les plus élevées.",
      flexibleTitle: "Moyens de paiement flexibles",
      flexibleDesc: "Choisissez entre MonCash, Natcom ou virement bancaire.",
      feesTitle: "Frais réduits",
      feesDesc: "Économisez jusqu'à 50 % sur les frais par rapport aux envois de fonds traditionnels.",
    }
  },
  ht: {
    common: {
      continue: "Kontinye",
      loading: "Ap chaje...",
      back: "Retounen",
      appName: "VitVit.Cash",
      privacy: "Vi prive",
      terms: "Kondisyon",
      help: "Èd",
      cookieSettings: "Paramèt Cookie",
      interested: "Enterese ajoute sa a nan sit ou a?",
      getStarted: "Kòmanse"
    },
    quote: {
      pay: "Ou peye",
      receive: "Ou resevwa",
      buy: "Ou achte",
      cost: "Pri total",
      fees: "Frè",
      total: "Total",
      buyTitle: "Achte USDC (Solana)",
      buySubtitle: "Peye ak MonCash oswa Transfè Labank",
      exchangeRate: "To Echanj",
    },
    authPhone: {
      title: "Ki nimewo telefòn ou?",
      subtitle: "Nou bezwen nimewo ou pou sekirize kont ou.",
      label: "Nimewo telefòn (Ayiti)",
      placeholder: "egz. 3123 4567",
      disclaimer: "Lè ou kontinye, ou dakò ak Kondisyon Sèvis ak Règleman sou Vi Prive.",
    },
    verifyPhone: {
      title: "Verifye telefòn ou",
      subtitle: "Antre kòd 6 chif nou voye nan",
      resend: "Voye kòd ankò",
      codeLabel: "Kòd Sekirite",
      info: "Mòd tès: Antre 000000 pou kontinye.",
    },
    authEmail: {
      title: "Ki imèl ou?",
      subtitle: "Nou pral voye resi tranzaksyon ou isit la.",
      label: "Adrès imèl",
      placeholder: "non@egzanp.com",
    },
    verifyEmail: {
      title: "Verifye imèl ou",
      subtitle: "Antre kòd 6 chif nou voye nan",
      resend: "Voye kòd ankò",
      codeLabel: "Kòd Sekirite",
      info: "Mòd tès: Antre 000000 pou kontinye.",
    },
    kyc: {
      title: "Verifye idantite w",
      subtitle: "Pou respekte lalwa, nou dwe verifye idantite w ak patnè sekirize nou an.",
      buttonStart: "Kòmanse Verifikasyon",
      processing: "Ap kòmanse sesyon...",
      waiting: "Tanpri konplete verifikasyon an nan nouvo fenèt la...",
      error: "Pa ka kòmanse verifikasyon an."
    },
    wallet: {
      title: "Ajoute yon nouvo valèt",
      subtitle: "Achte USDC ou a ap voye nan valèt sa a.",
      addressLabel: "Adrès valèt Solana",
      placeholder: "Kole adrès valèt Solana ou a",
      action: "Konfime Valèt",
    },
    deposit: {
      title: "Depoze Lajan",
      subtitle: "Ranpli peman an pou resevwa USDC ou a.",
      buttonPay: "Peye ak MonCash",
      processing: "Kreye peman...",
      waiting: "N ap tann konfimasyon peman an...",
      error: "Nou pa t 'kapab kreye peman an. Eseye ankò.",
      amountToPay: "Montant pou peye"
    },
    success: {
      title: "Transfè Lanse!",
      message: "Peman ou konfime. Ou pral resevwa USDC talè.",
      txId: "ID Tranzaksyon",
      return: "Kòmanse Nouvo Tranzaksyon",
    },
    benefits: {
      title: "Achte kripto touswit",
      secureTitle: "Vit epi an sekirite",
      secureDesc: "Peye pi vit ak MonCash oswa transfè lokal ki satisfè estanda sekirite ki pi wo yo.",
      flexibleTitle: "Fason fleksib pou peye",
      flexibleDesc: "Chwazi ant MonCash, Natcom, oswa Transfè Labank.",
      feesTitle: "Frè ki ba",
      feesDesc: "Ekonomize jiska 50% sou frè konpare ak transfè lajan tradisyonèl yo.",
    }
  }
};
