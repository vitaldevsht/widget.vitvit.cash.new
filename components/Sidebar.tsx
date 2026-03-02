import React from "react";
import { Lock, CreditCard, PieChart } from "lucide-react";
import { Translations } from "../types";

interface SidebarProps {
  t: Translations;
}

const Sidebar: React.FC<SidebarProps> = ({ t }) => {
  return (
    <div className="hidden  lg:flex flex-col justify-center max-w-md ml-12 xl:ml-24">
      <h2 className="text-2xl font-semibold text-slate-800 mb-8">
        {t.benefits.title}
      </h2>

      <div className="space-y-8">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Lock size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-800 font-medium mb-1">
              {t.benefits.secureTitle}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefits.secureDesc}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <CreditCard size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-800 font-medium mb-1">
              {t.benefits.flexibleTitle}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefits.flexibleDesc}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <PieChart size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-800 font-medium mb-1">
              {t.benefits.feesTitle}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefits.feesDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-200">
        <p className="text-slate-600 text-sm mb-2">{t.common.interested}</p>
        <a
          href="#"
          className="text-slate-900 font-medium underline text-sm hover:text-emerald-600 transition-colors"
        >
          {t.common.getStarted}
        </a>
      </div>

      <div className="mt-8 flex gap-6 text-xs text-slate-500">
        <a href="#" className="hover:underline">
          {t.common.help}
        </a>
        <a href="#" className="hover:underline">
          {t.common.terms}
        </a>
        <a href="#" className="hover:underline">
          {t.common.privacy}
        </a>
        <a href="#" className="hover:underline">
          {t.common.cookieSettings}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
