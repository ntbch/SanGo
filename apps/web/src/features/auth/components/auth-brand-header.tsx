import React from 'react';
import { Link } from 'react-router-dom';

export function AuthBrandHeader(): React.ReactElement {
  return (
    <div className="flex flex-col items-center mb-6 space-y-2">
      <Link to="/" className="flex items-center gap-2 group cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
          SG
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xl font-black tracking-tight text-foreground leading-none">
            San<span className="text-primary">Go</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sports Hub
          </span>
        </div>
      </Link>
    </div>
  );
}
