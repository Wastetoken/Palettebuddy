import React, { useEffect, useRef, useState } from 'react';
import { Knob } from './ui/Knob';
import { Switch } from './ui/Switch';
import { Slider } from './ui/Slider';
import { Tooltip } from './ui/Tooltip';
import { hslToHex, generatePalette } from '../utils/colors';
import { NoiseType } from '../utils/canvas';
import { playClick } from '../utils/audio';
import gsap from 'gsap';

interface DeviceProps {
  hue: number; sat: number; lum: number;
  hueB: number; satB: number; lumB: number;
  gradientType: 'none' | 'linear' | 'radial'; gradientAngle: number;
  noise: number; fineGrain: number;
  smudgeActive: boolean; smudgeFactor: number;
  noiseType: NoiseType; noiseFreq: number; noiseOctaves: number;
  vignette: number; blendMode: string; bgImage: string | null;
  locked: boolean; audioSync: boolean;
  
  onHueChange: (v: number) => void; onSatChange: (v: number) => void; onLumChange: (v: number) => void;
  onHueBChange: (v: number) => void; onSatBChange: (v: number) => void; onLumBChange: (v: number) => void;
  onGradientTypeChange: (v: 'none' | 'linear' | 'radial') => void; onGradientAngleChange: (v: number) => void;
  onNoiseChange: (v: number) => void; onFineGrainChange: (v: number) => void;
  onSmudgeActiveChange: (v: boolean) => void; onSmudgeFactorChange: (v: number) => void;
  onNoiseTypeChange: () => void; onNoiseFreqChange: (v: number) => void; onNoiseOctavesChange: (v: number) => void;
  onVignetteChange: (v: number) => void; onBlendModeChange: () => void;
  onRandomize: () => void; onToggleLock: () => void;
  onExport: () => void; onSave: () => void; onShowCode: () => void;
  onToggleAudio: () => void; onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onClearImage: () => void;
}

export const Device: React.FC<DeviceProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeChannel, setActiveChannel] = useState<'A' | 'B'>('A');

  const activeHue = activeChannel === 'A' ? props.hue : props.hueB;
  const activeSat = activeChannel === 'A' ? props.sat : props.satB;
  const activeLum = activeChannel === 'A' ? props.lum : props.lumB;
  const hex = hslToHex(activeHue, activeSat, activeLum);
  const palette = generatePalette(activeHue, activeSat, activeLum);
  const waveformBars = [10, 30, 50, 70, 50, 30, 10]; 

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      gsap.to(containerRef.current, { rotationY: x, rotationX: -y, duration: 1, ease: 'power2.out', transformPerspective: 1000 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative group perspective-1000 w-full">
      <div ref={containerRef} className="hardware-chassis w-full rounded-xl p-4 md:p-8 z-10 hardware-texture transition-transform duration-100 ease-out will-change-transform brightness-105">
        {/* Screws */}
        <div className="absolute top-4 left-4 screw"></div>
        <div className="absolute top-4 right-4 screw"></div>
        <div className="absolute bottom-4 left-4 screw"></div>
        <div className="absolute bottom-4 right-4 screw"></div>

        <div className="grid grid-cols-1 gap-8 h-full">
          {/* TOP: LCD & METRICS */}
          <div className="flex flex-col gap-8">
            {/* LCD Screen */}
            <div className="dark-panel rounded-lg p-1 relative overflow-hidden group border border-white/5">
              <div className="bg-[#222] absolute top-0 left-0 w-full h-4 z-10 shadow-md"></div>
              <div className="lcd-screen rounded h-64 flex flex-col justify-between p-6 relative font-mono text-led-active">
                 <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>
                 <div className="flex justify-between items-start relative z-20">
                    <div className="text-xs opacity-60">
                        <div>CHAN: {activeChannel === 'A' ? 'OSC_01 [PRI]' : 'OSC_02 [SEC]'}</div>
                        <div>MODE: {props.gradientType.toUpperCase()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={props.onShowCode} className="border border-led-active/50 px-3 py-1 text-xs hover:bg-led-active hover:text-black transition-colors uppercase tracking-wider blink-on-hover">[ VIEW CODE ]</button>
                      <button onClick={props.onExport} className="border border-led-active/50 px-3 py-1 text-xs hover:bg-led-active hover:text-black transition-colors uppercase tracking-wider blink-on-hover">[ EXPORT PNG ]</button>
                    </div>
                 </div>
                 <div className="text-center space-y-2 relative z-20 mt-4">
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-2">{activeChannel === 'A' ? 'Primary' : 'Secondary'} Hex</div>
                    <div className="text-5xl md:text-7xl font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(74,255,74,0.5)]">{hex}</div>
                 </div>
                 <div className="flex justify-between items-end relative z-20 mt-4">
                    <div className="h-12 w-32 border border-green-900/50 relative overflow-hidden bg-black/40">
                        {props.audioSync ? (
                             <div className="flex items-end justify-between h-full px-1 gap-[2px]">
                                {[...Array(10)].map((_, i) => <div key={i} className="bg-green-400 w-full animate-pulse" style={{ height: `${Math.random() * 100}%` }}></div>)}
                             </div>
                        ) : (
                            waveformBars.map((h, i) => <div key={i} className="absolute bottom-0 w-[10%] bg-green-500/40 animate-pulse" style={{ height: `${h + (Math.random() * 20)}%`, left: `${i * 14}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>)
                        )}
                    </div>
                    <div className="text-right text-[10px] md:text-xs space-y-1">
                        <div>SAT: {Math.round(activeSat)}%</div>
                        <div>LUM: {Math.round(activeLum)}%</div>
                        <div className="opacity-50">NOISE: {Math.round(props.noise)}%</div>
                        <div className="opacity-50">SMUDGE: {props.smudgeActive ? 'ON' : 'OFF'}</div>
                    </div>
                 </div>
              </div>
            </div>
            {/* Swatches */}
            <div className="grid grid-cols-4 gap-4 h-24">
                {Object.entries(palette).map(([key, color]) => (
                    <div key={key} className="relative group cursor-hover" onClick={() => { playClick(); navigator.clipboard.writeText(color); }}>
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold absolute -top-5 left-1/2 -translate-x-1/2 text-shadow-white">{key}</div>
                        <div className="swatch-well w-full h-full rounded border border-white/5 transition-transform active:scale-95 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),inset_-1px_-1px_0_rgba(255,255,255,0.1)]" style={{ backgroundColor: color }}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-mono">COPY</span></div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* BOTTOM: CONTROLS */}
          <div className="flex flex-col gap-6 relative">
             <div className="absolute inset-0 border border-black/10 rounded-lg pointer-events-none bg-metal-light/5"></div>

             {/* TOP MODULES: OSCILLATOR & TEXTURE INPUT */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 px-4">
                 {/* OSCILLATOR MODULE */}
                 <div className="inset-panel flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-500 font-bold">SIGNAL GENERATOR</div>
                        <Tooltip text="Switch between the Primary (A) and Secondary (B) color channels to edit them independently." />
                    </div>
                    <div className="flex justify-around items-center pt-2">
                         <div className="flex flex-col items-center gap-2">
                             <div className="text-[0.5rem] font-mono text-neutral-600">OSC_A</div>
                             <button 
                                onClick={() => { setActiveChannel('A'); playClick(); }} 
                                className={`physical-button w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-xs ${activeChannel === 'A' ? 'active' : ''}`}
                             >
                                A
                             </button>
                         </div>
                         <div className="w-px h-10 bg-white/5"></div>
                         <div className="flex flex-col items-center gap-2">
                             <div className="text-[0.5rem] font-mono text-neutral-600">OSC_B</div>
                             <button 
                                onClick={() => { setActiveChannel('B'); playClick(); }} 
                                className={`physical-button w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-xs ${activeChannel === 'B' ? 'active' : ''}`}
                             >
                                B
                             </button>
                         </div>
                    </div>
                 </div>

                 {/* EXTERNAL INPUT MODULE */}
                 <div className="inset-panel flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-500 font-bold">EXTERNAL INPUT</div>
                        <Tooltip text="Upload a custom background image. The gradient will overlay this image using the active blend mode." />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <input type="file" ref={fileInputRef} onChange={props.onImageUpload} className="hidden" accept="image/*"/>
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className={`physical-button flex-1 h-12 flex items-center justify-center rounded gap-2 font-mono text-[10px] uppercase tracking-wider ${props.bgImage ? 'active-orange' : ''}`}
                        >
                            {props.bgImage ? 'MEDIA LOADED' : 'INSERT MEDIA'}
                        </button>
                        {props.bgImage && (
                            <button onClick={props.onClearImage} className="physical-button w-12 h-12 flex items-center justify-center rounded text-red-500 hover:text-red-400">
                                <i className="ph ph-eject text-lg"></i>
                            </button>
                        )}
                    </div>
                 </div>
             </div>

             {/* Master Hue Knob */}
             <div className="flex-1 flex flex-col items-center justify-center py-4 border-b border-black/10">
                <Knob 
                    id="hue-knob" 
                    value={activeChannel === 'A' ? props.hue : props.hueB} 
                    min={0} max={360} fullCircle 
                    onChange={activeChannel === 'A' ? props.onHueChange : props.onHueBChange} 
                    label={`HUE ${activeChannel}`} 
                    disabled={props.locked}
                    info="Sets the primary pigment angle on the color wheel. This is the base for the color generation."
                />
             </div>

             {/* Secondary Knobs */}
             <div className="grid grid-cols-2 gap-4 py-4 border-b border-black/10 relative">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-neutral-400 font-bold opacity-50">SIGNAL MODULATION</div>
                 <Knob 
                    id="sat-knob" 
                    value={activeChannel === 'A' ? props.sat : props.satB} 
                    min={0} max={100} 
                    onChange={activeChannel === 'A' ? props.onSatChange : props.onSatBChange} 
                    size="sm" 
                    label="SATURATION" 
                    disabled={props.locked}
                    info="Controls the intensity and purity of the color. 0% is grayscale, 100% is vivid."
                />
                 <Knob 
                    id="lum-knob" 
                    value={activeChannel === 'A' ? props.lum : props.lumB} 
                    min={0} max={100} 
                    onChange={activeChannel === 'A' ? props.onLumChange : props.onLumBChange} 
                    size="sm" 
                    label="LUMINANCE" 
                    disabled={props.locked}
                    info="Adjusts the brightness. Lower values are darker; higher values are lighter and more washed out."
                />
             </div>

             {/* TEXTURE & GRAIN CONTROLS */}
             <div className="flex flex-col gap-4 py-4 border-b border-black/10 relative px-2">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-neutral-400 font-bold opacity-50">TEXTURE LAB</div>
                 
                 {/* Row 1: Gradients & Coarse Grain */}
                 <div className="grid grid-cols-2 gap-4">
                     {/* Gradient Type - Mechanical Radio Buttons */}
                     <div className="inset-panel flex flex-col justify-between">
                         <div className="flex items-center gap-1 mb-2">
                             <div className="text-[0.5rem] uppercase tracking-[0.1em] font-bold text-neutral-600">TOPOLOGY</div>
                         </div>
                         <div className="flex flex-col gap-1">
                             <button onClick={() => props.onGradientTypeChange('none')} className={`flex items-center gap-2 text-[9px] font-mono group ${props.gradientType === 'none' ? 'text-green-400' : 'text-neutral-500'}`}>
                                <div className={`w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center ${props.gradientType === 'none' ? 'bg-black' : 'bg-neutral-800'}`}>
                                    {props.gradientType === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#4ade80]"></div>}
                                </div>
                                <span>FLAT</span>
                             </button>
                             <button onClick={() => props.onGradientTypeChange('linear')} className={`flex items-center gap-2 text-[9px] font-mono group ${props.gradientType === 'linear' ? 'text-green-400' : 'text-neutral-500'}`}>
                                <div className={`w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center ${props.gradientType === 'linear' ? 'bg-black' : 'bg-neutral-800'}`}>
                                    {props.gradientType === 'linear' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#4ade80]"></div>}
                                </div>
                                <span>LINEAR</span>
                             </button>
                             <button onClick={() => props.onGradientTypeChange('radial')} className={`flex items-center gap-2 text-[9px] font-mono group ${props.gradientType === 'radial' ? 'text-green-400' : 'text-neutral-500'}`}>
                                <div className={`w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center ${props.gradientType === 'radial' ? 'bg-black' : 'bg-neutral-800'}`}>
                                    {props.gradientType === 'radial' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#4ade80]"></div>}
                                </div>
                                <span>RADIAL</span>
                             </button>
                         </div>
                     </div>
                     <Knob 
                        id="noise-knob" 
                        value={props.noise} 
                        min={0} max={100} 
                        onChange={props.onNoiseChange} 
                        size="sm" 
                        label="COARSE GRAIN" 
                        disabled={props.locked}
                        info="Adds low-frequency, chunky noise texture to the image, simulating analog signal degradation."
                    />
                 </div>

                 {/* Row 2: Fine Grain & Vignette */}
                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <Knob 
                        id="fine-grain-knob" 
                        value={props.fineGrain} 
                        min={0} max={100} 
                        onChange={props.onFineGrainChange} 
                        size="sm" 
                        label="FINE GRAIN" 
                        disabled={props.locked}
                        info="Adds a high-frequency, subtle film grain overlay for cinematic texture."
                    />
                    <Knob 
                        id="vignette-knob" 
                        value={props.vignette} 
                        min={0} max={100} 
                        onChange={props.onVignetteChange} 
                        size="sm" 
                        label="VIGNETTE" 
                        disabled={props.locked}
                        info="Darkens the edges of the frame to draw focus to the center of the composition."
                    />
                 </div>
                 
                 {/* Row 3: Smudge System */}
                 <div className="w-full h-px bg-black/5 my-1"></div>
                 <div className="flex items-center gap-4 px-2 bg-black/5 p-3 rounded">
                     <Switch 
                        label="SMUDGE" 
                        checked={props.smudgeActive} 
                        onChange={props.onSmudgeActiveChange} 
                        disabled={props.locked} 
                        info="Enables a Gaussian blur filter to soften edges and blend colors smoothly."
                    />
                     <div className="flex-1 pt-4">
                         <Slider 
                            value={props.smudgeFactor} 
                            min={0} max={100} 
                            onChange={props.onSmudgeFactorChange} 
                            label="SMUDGE FACTOR" 
                            disabled={!props.smudgeActive || props.locked} 
                            info="Controls the intensity (radius) of the blur effect."
                        />
                     </div>
                 </div>
             </div>

             {/* Buttons & Switches */}
             <div className="flex-1 flex flex-col justify-center gap-4 px-4 pb-4">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold w-12 text-right">BLEND</div>
                        <Tooltip text="Determines how the noise and grain layers blend with the base gradient colors." />
                    </div>
                    <button onClick={props.onBlendModeChange} disabled={props.locked} className={`push-btn w-full h-10 rounded bg-neutral-800 text-white font-mono text-[10px] tracking-wider flex items-center justify-center cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_3px_0_#000,0_4px_4px_rgba(0,0,0,0.4)] transition-all ${props.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>{props.blendMode.toUpperCase()}</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1 relative group">
                             <div className="flex items-center justify-center gap-1">
                                <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold text-center">RAND</div>
                             </div>
                             <button onClick={props.onRandomize} disabled={props.locked} className={`push-btn w-full h-12 rounded bg-neutral-800 text-white font-mono text-xs tracking-wider flex items-center justify-center cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all ${props.locked ? 'opacity-50 cursor-not-allowed' : ''}`}><i className="ph ph-shuffle text-xl"></i></button>
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Randomize all settings." /></div>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 relative group">
                             <div className="flex items-center justify-center gap-1">
                                <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold text-center">WRITE</div>
                             </div>
                             <button onClick={props.onSave} disabled={props.locked} className={`push-btn w-full h-12 rounded bg-neutral-800 text-white font-mono text-xs tracking-wider flex items-center justify-center cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all ${props.locked ? 'opacity-50 cursor-not-allowed' : ''}`}><i className="ph ph-floppy-disk text-xl"></i></button>
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Save current state to URL." /></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-[0.6rem] uppercase tracking-widest text-neutral-600 font-bold text-center">MODE</div>
                        <div className="flex gap-2">
                             <button onClick={props.onToggleAudio} className={`push-btn flex-1 h-12 rounded font-mono text-[10px] tracking-wider flex flex-col items-center justify-center gap-1 cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all ${props.audioSync ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-white'}`}><i className="ph ph-microphone text-lg"></i>{props.audioSync ? 'ON' : 'SYNC'}</button>
                            <button onClick={props.onToggleLock} className="push-btn flex-1 h-12 rounded bg-neutral-800 text-white font-mono text-[10px] tracking-wider flex flex-col items-center justify-center gap-1 cursor-hover hover:brightness-110 active:scale-[0.98] active:shadow-none active:translate-y-[2px] shadow-[0_4px_0_#000,0_5px_5px_rgba(0,0,0,0.4)] transition-all"><div className={`w-2 h-2 rounded-full transition-all duration-300 ${props.locked ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-red-900'}`}></div>LOCK</button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-20 left-10 right-10 h-20 bg-gradient-to-b from-white/10 to-transparent blur-2xl transform skew-x-12 opacity-30 pointer-events-none"></div>
    </div>
  );
};