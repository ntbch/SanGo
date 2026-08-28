import React from 'react';
import { Link } from 'react-router-dom';

export function AuthBrandHeader(): React.ReactElement {
  return (
    <div className="flex flex-col items-center mb-6 space-y-2">
      <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
        <img
          src="/favicon.svg"
          alt="SanGo Logo"
          className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
        />
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
