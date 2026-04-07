import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Wifi, Component } from "lucide-react";

interface VirtualCardProps {
  balance: number;
  cardNumber: string;
  storeName: string;
  managerName: string;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({ balance, cardNumber, storeName, managerName }) => {
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full max-w-md aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between group"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      }}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-colors" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full -ml-16 -mb-16 blur-3xl group-hover:bg-accent/20 transition-colors" />
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-50 group-hover:opacity-70 transition-opacity" style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 60%)" }} />

      <div className="flex justify-between items-start z-10">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Virtual Petty Cash Card</p>
          <img src="/OctaveLogo_510x.jpg" alt="Octave" className="h-4 brightness-200 contrast-200 grayscale" />
        </div>
        <div className="relative h-10 w-12 bg-amber-400/20 rounded-md backdrop-blur-sm border border-amber-400/30 overflow-hidden">
             <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-1 opacity-40">
                {[...Array(9)].map((_, i) => <div key={i} className="bg-amber-400 rounded-[1px]" />)}
             </div>
        </div>
      </div>

      <div className="z-10 space-y-4">
        <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-tight">Available Balance</p>
            <p className="text-3xl font-bold text-white tracking-tight">
                ₹{balance.toLocaleString('en-IN')}
            </p>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <p className="text-xl font-mono text-white tracking-widest">
              {cardNumber || "4232 4532 7654 8901"}
            </p>
            <Wifi className="h-4 w-4 text-slate-400 transform rotate-90" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end z-10">
        <div>
          <p className="text-[8px] uppercase text-slate-500 font-bold mb-0.5">Card Holder</p>
          <p className="text-sm font-medium text-slate-200 uppercase tracking-wider">{managerName}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] uppercase text-slate-500 font-bold mb-0.5">Store</p>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{storeName}</p>
        </div>
      </div>
    </motion.div>
  );
};
