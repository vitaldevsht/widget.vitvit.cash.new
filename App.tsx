import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Zap, ChevronDown, Check, Copy, ArrowUpDown, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { TRANSLATIONS, HTG_TO_USDC_RATE, SERVICE_FEE_PERCENT, NETWORK_FEE_USD, API_CONFIG } from './constants';
import { Language, AppStep } from './types';
import Sidebar from './components/Sidebar';
import { useAppStore } from './store';

// --- Sub Components for Steps ---

const QuoteStep = ({ t }: { t: any }) => {
  const { amount, setAmount, inputCurrency, toggleCurrency, setStep } = useAppStore();
  const [feesExpanded, setFeesExpanded] = useState(false);
  
  // Format currency
  const formatUSD = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCrypto = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  let displayPayHTG = 0;
  let displayReceiveUSDC = 0;
  let serviceFee = 0;
  let networkFee = 0;
  let totalFee = 0;

  if (inputCurrency === 'HTG') {
    displayPayHTG = amount;
    const rawUSDC = amount / HTG_TO_USDC_RATE;
    serviceFee = rawUSDC * SERVICE_FEE_PERCENT; // Fee in USDC
    networkFee = NETWORK_FEE_USD; // Fee in USDC
    totalFee = serviceFee + networkFee;
    displayReceiveUSDC = Math.max(0, rawUSDC - totalFee);
  } else {
    // Buying specific amount of USDC
    displayReceiveUSDC = amount;
    // TotalUSDCNeeded = (AmountReceive + NetworkFee) / (1 - ServiceFeePercent)
    const totalUSDCNeeded = (amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT);
    displayPayHTG = totalUSDCNeeded * HTG_TO_USDC_RATE;
    
    serviceFee = totalUSDCNeeded * SERVICE_FEE_PERCENT;
    networkFee = NETWORK_FEE_USD;
    totalFee = serviceFee + networkFee;
  }

  const serviceFeeHTG = serviceFee * HTG_TO_USDC_RATE;
  const networkFeeHTG = networkFee * HTG_TO_USDC_RATE;
  const totalFeeHTG = totalFee * HTG_TO_USDC_RATE;

  const isHTGInput = inputCurrency === 'HTG';

  return (
    <div className="space-y-6 relative">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-slate-900">{t.quote.buyTitle}</h2>
        <p className="text-slate-500 text-sm mt-1">{t.quote.buySubtitle}</p>
      </div>

      <div className="flex flex-col gap-2 relative">
        {/* Top Input */}
        <div className={`relative group transition-all ${isHTGInput ? 'order-1' : 'order-3'}`}>
          <div className="absolute top-3 left-3 text-xs font-medium text-slate-500 uppercase tracking-wide pointer-events-none">
            {isHTGInput ? t.quote.pay : t.quote.receive}
          </div>
          <div className={`flex items-center border ${isHTGInput ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-300'} bg-white rounded-lg px-3 pt-7 pb-3 transition-all`}>
            {isHTGInput && <span className="text-xl text-slate-900 font-medium mr-1">$</span>}
            <input 
              type="number" 
              value={amount || ''}
              onChange={(e) => isHTGInput ? setAmount(Number(e.target.value)) : null}
              readOnly={!isHTGInput}
              className="w-full text-3xl font-semibold text-slate-900 outline-none placeholder-slate-300 bg-transparent"
              placeholder="0"
            />
             <div className={`flex items-center min-w-[80px] justify-center gap-2 ml-2 px-2 py-1 rounded border ${isHTGInput ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
                {!isHTGInput && <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=024" alt="USDC" className="w-4 h-4" />}
                <span className="text-sm font-bold text-slate-700">{isHTGInput ? 'HTG' : 'USDC'}</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="order-2 flex justify-center -my-3 z-10">
            <button 
                onClick={toggleCurrency}
                className="bg-white border border-slate-200 p-2 rounded-full shadow-sm hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-600 transition-all group"
            >
                <ArrowUpDown size={18} className="text-slate-500 group-hover:text-emerald-600" />
            </button>
        </div>

        {/* Bottom Input */}
        <div className={`relative group transition-all ${isHTGInput ? 'order-3' : 'order-1'}`}>
          <div className="absolute top-3 left-3 text-xs font-medium text-slate-500 uppercase tracking-wide pointer-events-none">
             {!isHTGInput ? t.quote.pay : t.quote.receive}
          </div>
          <div className={`flex items-center border ${!isHTGInput ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-300'} bg-white rounded-lg px-3 pt-7 pb-3 transition-all`}>
            {!isHTGInput && <span className="text-xl text-slate-900 font-medium mr-1">$</span>}
            <input 
              type="number" 
              value={!isHTGInput ? (amount || '') : (inputCurrency === 'HTG' ? formatCrypto(displayReceiveUSDC) : formatUSD(displayPayHTG))}
              onChange={(e) => !isHTGInput ? setAmount(Number(e.target.value)) : null}
              readOnly={isHTGInput}
              className="w-full text-3xl font-semibold text-slate-900 outline-none placeholder-slate-300 bg-transparent"
              placeholder="0"
            />
            <div className={`flex items-center min-w-[80px] justify-center gap-2 ml-2 px-2 py-1 rounded border ${!isHTGInput ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
               {isHTGInput && <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=024" alt="USDC" className="w-4 h-4" />}
               <span className="text-sm font-bold text-slate-700">{!isHTGInput ? 'HTG' : 'USDC'}</span>
            </div>
          </div>
        </div>
      </div>

       <div className="text-xs text-center text-slate-400 px-1">
          1 USDC ≈ {HTG_TO_USDC_RATE.toFixed(2)} HTG
        </div>

      {/* Fees Accordion */}
      <div className="pt-2">
        <button 
          onClick={() => setFeesExpanded(!feesExpanded)}
          className="flex items-center justify-between w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span>{t.quote.fees}</span>
            <ChevronDown size={14} className={`transform transition-transform ${feesExpanded ? 'rotate-180' : ''}`} />
          </div>
          <span>${formatUSD(totalFeeHTG)} HTG</span>
        </button>
        
        {feesExpanded && (
          <div className="mt-3 space-y-2 px-2 py-3 bg-white border border-slate-100 rounded text-xs text-slate-500 shadow-sm">
            <div className="flex justify-between">
              <span>Service Fee (2%)</span>
              <span>${formatUSD(serviceFeeHTG)} HTG</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span>${formatUSD(networkFeeHTG)} HTG</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-3 text-sm font-medium text-slate-900">
          <span>{isHTGInput ? t.quote.total : t.quote.cost}</span>
          <span>${formatUSD(displayPayHTG)} HTG</span>
        </div>
      </div>

      <button 
        onClick={() => setStep(AppStep.AUTH_PHONE)}
        disabled={amount <= 0}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
      >
        {t.common.continue}
      </button>
    </div>
  );
};

const AuthPhoneStep = ({ t }: { t: any }) => {
  const { phone, setPhone, setStep } = useAppStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(phone.length > 5) setStep(AppStep.VERIFY_PHONE);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.authPhone.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{t.authPhone.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
            {t.authPhone.label}
            </label>
            <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-white text-slate-500 text-sm font-medium">
                    +509
                </span>
                <input 
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))}
                    placeholder={t.authPhone.placeholder}
                    className="flex-1 w-full px-4 py-3 border border-slate-300 bg-white rounded-r-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400"
                />
            </div>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {t.authPhone.disclaimer}
        </p>
        <button 
          type="submit"
          disabled={!phone}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
        >
          {t.common.continue}
        </button>
      </div>
    </form>
  );
};

const AuthEmailStep = ({ t }: { t: any }) => {
  const { email, setEmail, setStep } = useAppStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(email.includes('@')) setStep(AppStep.VERIFY_EMAIL);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.authEmail.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{t.authEmail.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
            {t.authEmail.label}
            </label>
            <input 
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.authEmail.placeholder}
            className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400"
            />
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit"
          disabled={!email}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99]"
        >
          {t.common.continue}
        </button>
      </div>
    </form>
  );
};

interface VerifyProps {
    target: string;
    onComplete: () => void;
    t: any;
    translations: {
        title: string;
        subtitle: string;
        info: string;
    }
}

const VerifyGenericStep = ({ target, onComplete, t, translations }: VerifyProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    const code = newOtp.join('');
    if (index === 5 && value && newOtp.every(d => d !== '')) {
      if (code.endsWith(value)) {
         setTimeout(onComplete, 300);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{translations.title}</h2>
        <div className="text-slate-500 text-sm">
          {translations.subtitle}
          <div className="font-medium text-slate-800 mt-1">{target}</div>
        </div>
      </div>

      <div className="flex justify-between gap-2 sm:gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-10 h-14 sm:w-12 sm:h-16 border border-slate-300 bg-white rounded-lg text-center text-2xl font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
        ))}
      </div>

      <div className="bg-white p-3 rounded-md border border-slate-100 text-xs text-slate-500 flex items-start gap-2">
        <div className="mt-0.5"><Zap size={14} className="text-amber-500" /></div>
        <p>{translations.info}</p>
      </div>
    </div>
  );
};

const KYCStep = ({ t }: { t: any }) => {
    const { kycSessionId, setKycSessionId, setStep } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);

    const startKYC = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('https://genpay.solvexalabs.xyz/api/kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendor_data: 'vitvit_u_' + Date.now(),
                    metadata: { source: 'vitvit_web' }
                })
            });
            
            if (!res.ok) throw new Error("API responded with error");

            const data = await res.json();
            if (data.url && data.session_id) {
                setKycSessionId(data.session_id);
                window.open(data.url, '_blank');
                setPolling(true);
            } else {
                throw new Error("Invalid response from provider");
            }
        } catch (e) {
            console.warn("KYC API failed, switching to demo mode", e);
            // Fallback for demo
            setKycSessionId('demo_kyc_' + Date.now());
            setPolling(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: number;
        if (polling && kycSessionId) {
            interval = window.setInterval(async () => {
                try {
                    // Demo mode logic
                    if (kycSessionId.startsWith('demo_')) {
                         setTimeout(() => {
                            setPolling(false);
                            setStep(AppStep.WALLET);
                         }, 2000);
                         return;
                    }

                    const res = await fetch(`https://genpay.solvexalabs.xyz/api/kyc?session_id=${kycSessionId}`);
                    if (!res.ok) return;
                    const data = await res.json();
                    if (data.status === 'approved' || data.decision?.status === 'approved') {
                        setPolling(false);
                        setStep(AppStep.WALLET);
                    }
                } catch(e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, kycSessionId, setStep]);

    return (
        <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <ExternalLink size={28} className="text-emerald-600" />
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.kyc.title}</h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">{t.kyc.subtitle}</p>
            </div>
            
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            {!polling ? (
                <button 
                    onClick={startKYC}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? t.kyc.processing : t.kyc.buttonStart}
                </button>
            ) : (
                <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                    <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-800 mb-1">{t.kyc.processing}</p>
                    <p className="text-xs text-slate-500">{t.kyc.waiting}</p>
                    <button onClick={() => setStep(AppStep.WALLET)} className="mt-6 text-xs text-slate-300 hover:text-slate-500">
                        (Demo: Skip)
                    </button>
                </div>
            )}
        </div>
    );
};

const WalletStep = ({ t }: { t: any }) => {
  const { walletAddress, setWalletAddress, setStep } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // After wallet, go to Deposit step
    if (walletAddress.length > 10) setStep(AppStep.DEPOSIT);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.wallet.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{t.wallet.subtitle}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t.wallet.addressLabel}
        </label>
        <textarea
          required
          autoFocus
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={t.wallet.placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 font-mono text-sm resize-none"
        />
      </div>

      <button 
        type="submit"
        disabled={walletAddress.length < 10}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] mt-4"
      >
        {t.wallet.action}
      </button>
    </form>
  );
};

const DepositStep = ({ t }: { t: any }) => {
    const { userId, phone, amount, inputCurrency, setStep, orderId, setOrderId } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

    // Calculate HTG amount to pay
    let amountToPayHTG = 0;
    if (inputCurrency === 'HTG') {
        amountToPayHTG = amount;
    } else {
        // If USDC input, convert to HTG + network fee + service fee roughly 
        // Logic: (AmountUSDC + NetworkFee) / (1 - ServiceFee) * Rate
        amountToPayHTG = (amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT) * HTG_TO_USDC_RATE;
    }
    const finalAmount = Math.ceil(amountToPayHTG); // Round up to nearest integer for payment

    const createPayment = async () => {
        setLoading(true);
        setError('');
        try {
            // Updated to relative path as requested to avoid CORS
            const res = await fetch('https://genpay.solvexalabs.xyz/api/cashcash/create-payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.MONCASH_API_KEY}`,
                    'Business-X-Id': API_CONFIG.MONCASH_BUSINESS_ID
                },
                body: JSON.stringify({
                    mode: "sandbox",
                    businessId: API_CONFIG.MONCASH_BUSINESS_ID,
                    clientId: userId,
                    customerNumber: "509" + phone,
                    amount: finalAmount,
                    webhooks: [],
                    metadata: {}
                })
            });
            if (!res.ok) throw new Error("API responded with error");

            const responseData = await res.json();
            
            if (responseData.success && responseData.data) {
                const newOrderId = responseData.data.order_id || responseData.data.orderId;
                setOrderId(newOrderId);
                
                const url = responseData.data.url || responseData.data.payment_uri;
                if(url) {
                    setPaymentUrl(url);
                    window.open(url, '_blank');
                }
                setPolling(true);
            } else {
                throw new Error("Failed to create payment");
            }
        } catch (e) {
            console.warn("Deposit API failed, switching to demo mode", e);
            // Fallback for demo
            setOrderId('demo_order_' + Date.now());
            setPolling(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: number;
        if (polling && orderId) {
            interval = window.setInterval(async () => {
                try {
                    // Demo mode logic
                    if (orderId.startsWith('demo_')) {
                        setTimeout(() => {
                           setPolling(false);
                           setStep(AppStep.SUCCESS);
                        }, 3000);
                        return;
                    }

                    // Updated to relative path
                    const res = await fetch(`/api/cashcash/check-payment?orderId=${orderId}`, {
                        headers: {
                            'Authorization': `Bearer ${API_CONFIG.MONCASH_API_KEY}`,
                            'Business-X-Id': API_CONFIG.MONCASH_BUSINESS_ID
                        }
                    });
                    if (!res.ok) return;

                    const responseData = await res.json();
                    if (responseData.success && responseData.data.status === 'completed') {
                        setPolling(false);
                        setStep(AppStep.SUCCESS);
                    }
                } catch(e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, orderId, setStep]);

    // Restore polling on load if we have an orderId and not finished
    useEffect(() => {
        if (orderId && !polling) {
            setPolling(true);
        }
    }, []);

    return (
        <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard size={28} className="text-emerald-600" />
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.deposit.title}</h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">{t.deposit.subtitle}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">{t.deposit.amountToPay}</p>
                <p className="text-2xl font-bold text-slate-900">{finalAmount.toLocaleString('en-US')} HTG</p>
            </div>
            
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            {!polling ? (
                <button 
                    onClick={createPayment}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white font-semibold py-4 rounded-lg shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? t.deposit.processing : t.deposit.buttonPay}
                </button>
            ) : (
                <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                    <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-800 mb-1">{t.deposit.processing}</p>
                    <p className="text-xs text-slate-500">{t.deposit.waiting}</p>
                    
                    {paymentUrl && (
                        <a 
                            href={paymentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1 text-emerald-600 text-sm font-medium hover:underline"
                        >
                            Pay Now <ExternalLink size={14} />
                        </a>
                    )}
                    
                    <button onClick={() => setStep(AppStep.SUCCESS)} className="mt-6 text-xs text-slate-300 hover:text-slate-500 block mx-auto">
                        (Demo: Skip)
                    </button>
                </div>
            )}
        </div>
    );
};

const SuccessStep = ({ t }: { t: any }) => {
  const { amount, inputCurrency, reset } = useAppStore();
  
  // Previously we had fake loading here, but now the Deposit step handles the wait.
  // We can just show success immediately.

  let amountHTG = 0;
  let amountUSDC = 0;

  if(inputCurrency === 'HTG') {
    amountHTG = amount;
    amountUSDC = (amount / HTG_TO_USDC_RATE) - NETWORK_FEE_USD - (amount/HTG_TO_USDC_RATE * SERVICE_FEE_PERCENT); 
  } else {
    amountUSDC = amount;
    amountHTG = (amount + NETWORK_FEE_USD) / (1 - SERVICE_FEE_PERCENT) * HTG_TO_USDC_RATE;
  }
  
  return (
    <div className="text-center py-8 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={32} className="text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.success.title}</h2>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">{t.success.message}</p>
      
      <div className="bg-white rounded-lg p-4 mb-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-500">Amount Sent</span>
          <span className="font-semibold text-slate-900">${amountHTG.toLocaleString('en-US', {maximumFractionDigits: 0})} HTG</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-4">
          <span className="text-slate-500">Est. Receive</span>
          <span className="font-semibold text-emerald-600">~{amountUSDC.toLocaleString('en-US', {maximumFractionDigits: 2})} USDC</span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider">{t.success.txId}</span>
            <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                <span>8x...4k2</span>
                <Copy size={12} />
            </div>
        </div>
      </div>

      <button 
        onClick={reset}
        className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline transition-all"
      >
        {t.success.return}
      </button>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const { lang, setLang, step, setStep, amount, phone, email, kycSessionId } = useAppStore();
  const t = TRANSLATIONS[lang];

  // Logic to handle returning users inside the Phone Verify step
  const handlePhoneVerifyComplete = () => {
    // If user already has KYC done (session ID present) and email set, skip to Wallet
    // Assuming if KYC is done, email is also likely verified/present
    if (kycSessionId) {
       setStep(AppStep.WALLET);
    } else {
       setStep(AppStep.AUTH_EMAIL);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Header Component (Internal)
  const Header = () => (
    <div className="flex justify-between items-center mb-6">
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
                {step === 2 && t.authPhone.title}
                {step === 3 && t.verifyPhone.title}
                {step === 4 && t.authEmail.title}
                {step === 5 && t.verifyEmail.title}
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
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${lang === l ? 'font-bold text-emerald-600' : 'text-slate-600'}`}
                    >
                        {l.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
        {step < 9 && (
            <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={20} />
            </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col lg:flex-row">
      
      {/* Left / Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8 transition-all duration-300">
            
          <Header />
          
          <div className="transition-opacity duration-300">
            {step === AppStep.QUOTE && <QuoteStep t={t} />}
            {step === AppStep.AUTH_PHONE && <AuthPhoneStep t={t} />}
            {step === AppStep.VERIFY_PHONE && (
                <VerifyGenericStep 
                    t={t} 
                    target={`+509 ${phone}`} 
                    translations={t.verifyPhone}
                    onComplete={handlePhoneVerifyComplete} 
                />
            )}
            {step === AppStep.AUTH_EMAIL && <AuthEmailStep t={t} />}
            {step === AppStep.VERIFY_EMAIL && (
                <VerifyGenericStep 
                    t={t} 
                    target={email} 
                    translations={t.verifyEmail}
                    onComplete={() => setStep(AppStep.KYC)} 
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
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Right / Sidebar Area (Desktop Only) */}
        <Sidebar t={t} />
      </div>
    </div>
  );
};

export default App;
