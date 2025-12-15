import React from 'react';
import { playSwitch } from '../../utils/audio';
import { Tooltip } from './Tooltip';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'green' | 'orange';
  info?: string;
}

export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, disabled, color = 'green', info }) => {
  const handleClick = () => {
    if (disabled) return;
    playSwitch();
    onChange(!checked);
  };

  const ledColor = color === 'green' ? 'bg-green-500 shadow-[0_0_8px_#4ade80]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]';
  const ledOff = 'bg-red-900/50';

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center justify-center gap-1">
         <div className="text-[0.6rem] uppercase tracking-widest text-neutral-500 font-bold text-shadow-white">{label}</div>
         {info && <Tooltip text={info} />}
      </div>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative w-12 h-20 rounded-lg transition-all duration-200 shadow-xl border-t border-white/10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-[#1a1a1a]' : 'bg-[#151515]'}`}
        style={{
             boxShadow: checked 
                ? 'inset 0 10px 15px -3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)' 
                : '0 10px 15px -3px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {/* The Toggle Lever */}
        <div 
            className={`absolute left-1/2 -translate-x-1/2 w-8 h-10 rounded border border-neutral-600 bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-500 transition-all duration-200 shadow-[0_4px_6px_rgba(0,0,0,0.5)] flex items-center justify-center z-10`}
            style={{ 
                top: checked ? 'calc(100% - 2.8rem)' : '0.3rem',
            }}
        >
            {/* Grip Texture */}
            <div className="w-5 h-6 flex flex-col justify-between py-1 opacity-50">
                <div className="w-full h-[1px] bg-neutral-800"></div>
                <div className="w-full h-[1px] bg-neutral-800"></div>
                <div className="w-full h-[1px] bg-neutral-800"></div>
                <div className="w-full h-[1px] bg-neutral-800"></div>
            </div>
        </div>
        
        {/* Track/Well */}
        <div className="absolute inset-x-3 top-2 bottom-2 bg-black/40 rounded -z-0 shadow-inner"></div>

        {/* Indicator Light */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 z-0 ${checked ? ledColor : ledOff}`}></div>
      </button>
      <div className="text-[9px] font-mono text-neutral-600 font-bold">{checked ? 'ON' : 'OFF'}</div>
    </div>
  );
};