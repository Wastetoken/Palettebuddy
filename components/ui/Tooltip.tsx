import React, { useState } from 'react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center justify-center ml-0.5 align-middle z-50"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.stopPropagation(); setShow(!show); }}
    >
      <i className="ph ph-info text-[10px] text-neutral-600 hover:text-green-400 transition-colors cursor-help opacity-70 hover:opacity-100" />
      
      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 p-2 bg-[#151515] border border-white/10 text-neutral-300 text-[9px] font-mono leading-tight rounded shadow-2xl z-[100] pointer-events-none backdrop-blur-md">
           {text}
           {/* Arrow */}
           <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#151515]"></div>
        </div>
      )}
    </div>
  );
};