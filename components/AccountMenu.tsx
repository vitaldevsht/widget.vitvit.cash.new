import React, { useEffect, useRef } from "react";
import { Copy, LogOut } from "lucide-react";
import { useAppStore } from "../store";
import { clearSession } from "../lib/sessionLogout";

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountMenu = ({ isOpen, onClose }: AccountMenuProps) => {
  const { walletAddress, phone, email } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);

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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Account</h3>
        {email && (
          <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
            Verified
          </div>
        )}
      </div>

      {/* User Information */}
      <div className="space-y-4 mb-5">
        {/* Address */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Address
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 text-xs font-mono text-slate-600 truncate bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
              {walletAddress || "No address linked"}
            </div>
            {walletAddress && (
              <button
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all border border-slate-100"
                title="Copy Address"
              >
                <Copy size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Phone
          </label>
          <div className="flex items-center justify-between text-sm text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
            <span>{phone ? `+509 ${phone}` : "Not set"}</span>
            {phone && (
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={async () => {
          await clearSession();
          onClose();
        }}
        className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold uppercase tracking-wide"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  );
};

export default AccountMenu;
