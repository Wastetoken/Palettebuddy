import React, { useEffect, useRef } from 'react';
import { Knob } from './ui/Knob';
import { hslToHex, generatePalette } from '../utils/colors';
import gsap from 'gsap';

interface DeviceProps {
  hue: number;
  sat: number;
  lum: number;
  noise: number;
  vignette: number;
  blendMode: string;
  locked: boolean;
  onHueChange: (v: number) => void;
  onSatChange: (v: number) => void;
  onLumChange: (v: number) => void;
  onNoiseChange: (v: number) => void;
  onVignetteChange: (v: number) => void;
  onBlendModeChange: () => void;
  onRandomize: () => void;
  onToggleLock: () => void;
  onExport: () => void;
}

export const Device: React.FC<DeviceProps> = ({
  hue, sat, lum, noise, vignette, blendMode, locked,
  onHueChange, onSatChange, onLumChange,
  onNoiseChange, onVignetteChange, onBlendModeChange,
  onRandomize, onToggleLock, onExport
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hex = hslToHex(hue, sat, lum);
  const palette = generatePalette(hue, sat, lum);

  // Parallax Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      // Reduced sensitivity for subtlety
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      
      gsap.to(containerRef.current, {
        rotationY: x,
        rotationX: -y,
        duration: 1,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // LCD Waveform Animation
  const waveformBars = [10, 30, 50, 70, 50, 30, 10]; // simple visualization

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
  };

  return (
    <div className="relative group perspective-1000">
      {/* Device Chassis */}
      <div 
        ref={containerRef}
        className="hardware-chassis w-[90vw] max-w-[1000px] rounded-xl p-6 md:p-12 z-10 hardware-texture transition-transform duration-100 ease-out will-change-transform brightness-105"
      >
        {/* Screws */}
        <div className="absolute top-4 left-4 screw"></div>
        <div className="absolute top-4 right-4 screw"></div>
        <div className="absolute bottom-4 left-4 screw"></div>
        <div className="absolute bottom-4 right-4 screw"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
          
          {/* LEFT COLUMN: LCD & METRICS */}
          <div className="md:col-span-8 flex flex-col gap-8">
            
            {/* LCD Screen */}
            <div className="dark-panel rounded-lg p-1 relative overflow-hidden group border border-white/5">
              <div className="bg-[#222] absolute top-0 left-0 w-full h-4 z-10 shadow-md"></div>
              
              <div className="lcd-screen rounded h-64 flex flex-col justify-between p-6 relative font-mono text-led-active">
                 {/* Screen Scanlines Overlay */}
                 <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>
                 
                 <div className="flex justify-between items-start relative z-20">
                    <div className="text-xs opacity-60">
                        <div>INPUT: ANALOG_01</div>
                        <div>HZ: 60.00</div>
                    </div>
                    
                    <button 
                        onClick={onExport}
                        className="border border-led-active/50 px-3 py-1 text-xs hover:bg-led-active hover:text-black transition-colors uppercase tracking-wider blink-on-hover"
                    >
                        [ EXPORT SIGNAL ]
                    </button>
                 </div>
                 
                 <div className="text-center space-y-2 relative z-20 mt-4">
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Dominant Hex Value</div>
                    <div className="text-5xl md:text-7xl font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(74,255,74,0.5)]">
                        {hex}
                    </div>
                 </div>

                 <div className="flex justify-between items-end relative z-20 mt-4">
                    <div className="h-12 w-32 border border-green-900/50 relative overflow-hidden bg-black/40">
                        {waveformBars.map((h, i) => (
                            <div 
                                key={i}
                                className="absolute bottom-0 w-[10%] bg-green-500/40 animate-pulse"
                                style={{ 
                                    height: `${h + (Math.random() * 20)}%`, 
                                    left: `${i * 14}%`,
                                    animationDuration: `${0.5 + Math.random()}s`
                                }}
                            ></div>
                        ))}
                    </div>
                    <div className="text-right text-[10px] md:text-xs space-y-1">
                        <div>SAT: {Math.round(sat)}%</div>
                        <div>LUM: {Math.round(lum)}%</div>
                        <div className="opacity-50">NOISE: {Math.round(noise)}%</div>
                        <div className="opacity-50">VIGN: {Math.round(vignette)}%</div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Swatches */}
            <div className="grid grid-cols-4 gap-4 h-32">
                {Object.entries(palette).map(([key, color], index) => (
                    <div key={key} className="relative group cursor-hover" onClick={() => copyToClipboard(color)}>
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold absolute -top-5 left-1/2 -translate-x-1/2 text-shadow-white">{key}</div>
                        <div 
                            className="swatch-well w-full h-full rounded border border-white/5 transition-transform active:scale-95 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),inset_-1px_-1px_0_rgba(255,255,255,0.1)]"
                            style={{ backgroundColor: color }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-mono">COPY</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

          </div>

          {/* RIGHT COLUMN: CONTROLS */}
          <div className="md:col-span-4 flex flex-col gap-6 relative">
             <div className="absolute inset-0 border border-black/10 rounded-lg pointer-events-none bg-metal-light/5"></div>

             {/* Master Knob */}
             <div className="flex-1 flex flex-col items-center justify-center py-6 border-b border-black/10">
                <Knob 
                    id="hue-knob"
                    value={hue}
                    min={0}
                    max={360}
                    fullCircle
                    onChange={onHueChange}
                    label="CHROMATIC OSCILLATOR"
                    disabled={locked}
                />
             </div>

             {/* Secondary Knobs: Color */}
             <div className="grid grid-cols-2 gap-4 py-4 border-b border-black/10 relative">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-neutral-400 font-bold opacity-50">COLOR SIGNAL</div>
                 <Knob 
                    id="sat-knob"
                    value={sat}
                    min={0}
                    max={100}
                    onChange={onSatChange}
                    size="sm"
                    label="SATURATION"
                    disabled={locked}
                 />
                 <Knob 
                    id="lum-knob"
                    value={lum}
                    min={0}
                    max={100}
                    onChange={onLumChange}
                    size="sm"
                    label="LUMINANCE"
                    disabled={locked}
                 />
             </div>

             {/* Texture Knobs */}
             <div className="grid grid-cols-2 gap-4 py-4 border-b border-black/10 relative">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-neutral-400 font-bold opacity-50">TEXTURE MATRIX</div>
                 <Knob 
                    id="noise-knob"
                    value={noise}
                    min={0}
                    max={100}
                    onChange={onNoiseChange}
                    size="sm"
                    label="NOISE GRAIN"
                    disabled={locked}
                 />
                 <Knob 
                    id="vignette-knob"
                    value={vignette}
                    min={0}
                    max={100}
                    onChange={onVignetteChange}
                    size="sm"
                    label="VIGNETTE"
                    disabled={locked}
                 />
             </div>

             {/* Buttons & Switches */}
             <div className="flex-1 flex flex-col justify-center gap-4 px-4 pb-4">
                
                {/* Blend Mode Toggle */}
                <div className="flex justify-between items-center gap-2">
                    <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold w-12 text-right">BLEND</div>
                    <button 
                        onClick={onBlendModeChange}
                        disabled={locked}
                        className={`push-btn w-full h-10 rounded bg-neutral-800 text-white font-mono text-[10px] tracking-wider flex items-center justify-center cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_3px_0_#000,0_4px_4px_rgba(0,0,0,0.4)] transition-all ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {blendMode.toUpperCase()}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                         <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold text-center">RAND</div>
                         <button 
                             onClick={onRandomize}
                             disabled={locked}
                             className={`push-btn w-full h-12 rounded bg-neutral-800 text-white font-mono text-xs tracking-wider flex items-center justify-center cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             <i className="ph ph-shuffle text-xl"></i>
                         </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold text-center">LOCK</div>
                        <button 
                            onClick={onToggleLock}
                            className="push-btn w-full h-12 rounded bg-neutral-800 text-white font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all"
                        >
                            <div 
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${locked ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-red-900'}`}
                            ></div>
                            ENGAGE
                        </button>
                    </div>
                </div>

             </div>

          </div>
        </div>
      </div>
      
      {/* Floor Reflection */}
      <div className="absolute -bottom-20 left-10 right-10 h-20 bg-gradient-to-b from-white/10 to-transparent blur-2xl transform skew-x-12 opacity-30 pointer-events-none"></div>
    </div>
  );
};