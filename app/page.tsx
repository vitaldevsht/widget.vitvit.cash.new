"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TRANSLATIONS } from "../constants";
import Sidebar from "../components/Sidebar";
import { QuoteStep } from "../components/steps";
import { useAppStore } from "../store";

const App: React.FC = () => {
  const { lang } = useAppStore();
  const t = TRANSLATIONS[lang];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col lg:flex-row">
      {/* Left / Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8 transition-all duration-300 relative">
          <div className="transition-opacity duration-300">
            <QuoteStep t={t} />
          </div>
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
