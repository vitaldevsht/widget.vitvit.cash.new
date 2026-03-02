import React, { useEffect, useRef, useState } from "react";
import {
  Copy,
  Wallet,
  Settings,
  LogOut,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "../store";
import { AppStep } from "../types";

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountMenu = ({ isOpen, onClose }: AccountMenuProps) => {
  const { walletAddress, phone, email, logout, pin, setStep } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Account</h3>
        <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
          {email && "Verified"}
        </div>
      </div>

      {/* Wallet Section */}
      <div className="mb-6">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
          <Wallet size={12} /> Wallet
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="text-xs text-slate-500 mb-2">Total Balance</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=024"
                  className="w-5 h-5 rounded-full"
                  alt="USDC"
                />
                <span className="text-md font-bold text-slate-900">
                  0.00 USDC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                  H
                </div>
                <span className="text-md font-bold text-slate-900">
                  0.00 HTGV
                </span>
              </div>
            </div>
          </div>
          <div className="px-3 mb-3 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-400 font-medium mb-0.5">
                Solana Address
              </div>
              <div className="text-xs font-mono text-slate-600 truncate bg-white border border-slate-200 rounded px-2 py-1">
                {walletAddress || "No address linked"}
              </div>
            </div>
            {walletAddress && (
              <button
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-emerald-600 transition-all border border-transparent hover:border-slate-100"
                title="Copy Address"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      {email && (
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between hover:text-slate-600 transition-colors"
          >
            <span className="flex items-center gap-1">
              <Settings size={12} /> Settings
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                settingsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`space-y-1 overflow-hidden transition-all duration-200 ${
              settingsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="group">
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                Phone Number
              </label>
              <div className="flex items-center justify-between text-sm text-slate-700 font-medium pb-2 border-b border-slate-50 group-hover:border-slate-100 transition-colors">
                <span>{phone ? `+509 ${phone}` : "Not set"}</span>
                {phone && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <div className="flex items-center justify-between text-sm text-slate-700 font-medium pb-2 border-b border-slate-50 group-hover:border-slate-100 transition-colors">
                <span className="truncate max-w-[200px]">
                  {email || "Not set"}
                </span>
                {email && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                )}
              </div>
            </div>

            {/* PIN Section */}
            <div className="group mt-1">
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                PIN Protection
              </label>
              <div className="flex items-center justify-between text-sm text-slate-700 font-medium pb-2 border-b border-slate-50 group-hover:border-slate-100 transition-colors">
                <span>{pin ? "Enabled" : "Not set"}</span>
                {pin ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                ) : (
                  <button
                    onClick={() => {
                      setStep(AppStep.SET_PIN);
                      onClose();
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <Lock size={12} />
                    Set PIN
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="mt-1 w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold uppercase tracking-wide"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
