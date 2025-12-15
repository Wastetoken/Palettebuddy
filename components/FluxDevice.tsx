import React, { useEffect, useRef } from 'react';
import { Knob } from './ui/Knob';
import { Switch } from './ui/Switch';
import { Slider } from './ui/Slider';
import { Tooltip } from './ui/Tooltip';
import { FluxPattern } from '../utils/canvas';
import gsap from 'gsap';

interface FluxDeviceProps {
  hue: number; spectra: number; exposure: number; distortion: number;
  grain: number; fineGrain: number; 
  smudgeActive: boolean; smudgeFactor: number;
  iso: number; pattern: FluxPattern; locked: boolean;
  
  onHueChange: (v: number) => void; onSpectraChange: (v: number) => void;
  onExposureChange: (v: number) => void; onDistortionChange: (v: number) => void;
  onGrainChange: (v: number) => void; onFineGrainChange: (v: number) => void;
  onSmudgeActiveChange: (v: boolean) => void; onSmudgeFactorChange: (v: number) => void;
  onIsoChange: (v: number) => void; onPatternChange: () => void;
  onRandomize: () => void; onToggleLock: () => void;
  onExport: () => void; onSave: () => void; onShowCode: () => void;
}

export const FluxDevice: React.FC<FluxDeviceProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      gsap.to(containerRef.current, { rotationY: x, rotationX: -y, duration: 1.2, ease: 'power2.out', transformPerspective: 1200 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative group perspective-1000 w-full">
      <div ref={containerRef} className="hardware-chassis w-full rounded-xl p-4 md:p-8 z-10 hardware-texture-flux transition-transform duration-100 ease-out will-change-transform brightness-105 border-t border-orange-900/20">
        <div className="absolute top-4 left-4 screw bg-stone-800"></div>
        <div className="absolute top-4 right-4 screw bg-stone-800"></div>
        <div className="absolute bottom-4 left-4 screw bg-stone-800"></div>
        <div className="absolute bottom-4 right-4 screw bg-stone-800"></div>

        <div className="grid grid-cols-1 gap-8 h-full">
          {/* TOP: VISUALIZER */}
          <div className="flex flex-col gap-8">
            <div className="dark-panel rounded-lg p-1 relative overflow-hidden group border border-orange-500/10">
              <div className="bg-[#1a1510] absolute top-0 left-0 w-full h-4 z-10 shadow-md"></div>
              <div className="lcd-screen-flux rounded h-64 flex flex-col justify-between p-6 relative font-mono text-orange-500">
                 <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(30,20,10,0)_50%,rgba(0,0,0,0.25)_50%)]" style={{ backgroundSize: "100% 4px" }}></div>
                 <div className="flex justify-between items-start relative z-20">
                    <div className="text-xs opacity-60">
                        <div>SYS: FLUX_ENGINE_V3</div>
                        <div className="flex items-center gap-2">MODE: <span className="text-orange-300 font-bold bg-orange-900/30 px-1 rounded">{props.pattern.toUpperCase()}</span></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={props.onShowCode} className="border border-orange-500/50 px-3 py-1 text-xs hover:bg-orange-500 hover:text-black transition-colors uppercase tracking-wider blink-on-hover">[ VIEW CODE ]</button>
                        <button onClick={props.onExport} className="border border-orange-500/50 px-3 py-1 text-xs hover:bg-orange-500 hover:text-black transition-colors uppercase tracking-wider blink-on-hover">[ RENDER PNG ]</button>
                    </div>
                 </div>
                 <div className="text-center space-y-2 relative z-20 mt-4">
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Center Freq</div>
                    <div className="text-5xl md:text-7xl font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,165,0,0.3)]">{props.hue}°</div>
                 </div>
                 <div className="flex justify-between items-end relative z-20 mt-4">
                    <div className="h-12 w-48 flex items-end gap-1 opacity-70">{[...Array(12)].map((_, i) => <div key={i} className="w-full bg-orange-500/40" style={{ height: `${20 + Math.random() * 80}%`, opacity: 0.5 + Math.random() * 0.5 }}></div>)}</div>
                    <div className="text-right text-[10px] md:text-xs space-y-1 text-orange-400">
                        <div>SCALE: {props.iso}%</div>
                        <div>SPREAD: {props.spectra}%</div>
                        <div className="opacity-50">SMUDGE: {props.smudgeActive ? 'ACTIVE' : 'OFF'}</div>
                    </div>
                 </div>
              </div>
            </div>
            <div className="h-32 p-6 rounded border border-white/5 bg-black/20 flex items-center justify-center">
                 <p className="font-mono text-xs text-orange-500/60 max-w-md text-center leading-relaxed">
                    FLUX ENGINE 3.0 // <br/> <span className="text-orange-300 font-bold">{props.pattern.toUpperCase()}</span> GENERATOR<br/>
                    <span className="opacity-75">
                        {props.pattern === 'wave' && 'Linear sine oscillation with chromatic RGB phase separation.'}
                        {props.pattern === 'interference' && 'Linear moiré interference patterns from overlapping grids.'}
                        {props.pattern === 'ripple' && 'Refractive glass distortion using a cartesian noise field.'}
                        {props.pattern === 'prism' && 'Directional linear chromatic aberration shift.'}
                        {props.pattern === 'turbulence' && 'Fluid dynamics flow field displacement.'}
                        {props.pattern === 'glitch' && 'Digital signal tearing and block displacement artifacting.'}
                        {props.pattern === 'kaleido' && 'Radial multi-segment geometric mirroring symmetry.'}
                        {props.pattern === 'pixelate' && 'Low-fidelity bit depth reduction and downsampling.'}
                        {props.pattern === 'scanline' && 'CRT phosphor simulation with vertical sync banding.'}
                        {props.pattern === 'vortex' && 'Gravitational rotational distortion field.'}
                    </span>
                 </p>
            </div>
          </div>

          {/* BOTTOM: CONTROLS */}
          <div className="flex flex-col gap-6 relative">
             <div className="absolute inset-0 border border-orange-900/10 rounded-lg pointer-events-none bg-orange-950/5"></div>

             <div className="flex-1 flex flex-col items-center justify-center py-6 border-b border-orange-900/10">
                <Knob 
                    id="flux-hue" 
                    value={props.hue} 
                    min={0} max={360} fullCircle 
                    onChange={props.onHueChange} 
                    label="WAVELENGTH" 
                    disabled={props.locked}
                    info="Sets the base color frequency for the generator. Rotates through the visible light spectrum."
                />
             </div>

             <div className="grid grid-cols-2 gap-4 py-4 border-b border-orange-900/10 relative">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-orange-700/50 font-bold">OPTICS</div>
                 <Knob 
                    id="flux-spectra" 
                    value={props.spectra} 
                    min={0} max={100} 
                    onChange={props.onSpectraChange} 
                    size="sm" 
                    label="PRISM" 
                    disabled={props.locked}
                    info="Controls chromatic aberration intensity, splitting the light into RGB components."
                />
                 <Knob 
                    id="flux-distortion" 
                    value={props.distortion} 
                    min={0} max={100} 
                    onChange={props.onDistortionChange} 
                    size="sm" 
                    label="TURBULENCE" 
                    disabled={props.locked}
                    info="Warps the coordinate space, introducing chaos, twists, and fluid displacement."
                />
             </div>

             <div className="flex flex-col gap-4 py-4 border-b border-orange-900/10 relative px-2">
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase tracking-widest text-orange-700/50 font-bold">EMULSION</div>
                 <div className="grid grid-cols-2 gap-4">
                    <Knob 
                        id="flux-exposure" 
                        value={props.exposure} 
                        min={0} max={100} 
                        onChange={props.onExposureChange} 
                        size="sm" 
                        label="INTENSITY" 
                        disabled={props.locked}
                        info="Adjusts exposure and contrast. Low values burn the image (darker); high values bleach it (brighter)."
                    />
                    <Knob 
                        id="flux-iso" 
                        value={props.iso} 
                        min={0} max={100} 
                        onChange={props.onIsoChange} 
                        size="sm" 
                        label="SCALE" 
                        disabled={props.locked}
                        info="Controls the zoom level or pattern density of the generative algorithm."
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-2">
                     <Knob 
                        id="flux-grain" 
                        value={props.grain} 
                        min={0} max={100} 
                        onChange={props.onGrainChange} 
                        size="sm" 
                        label="GRAIN" 
                        disabled={props.locked}
                        info="Adds a layer of analog signal noise to texturize the output."
                    />
                     <Knob 
                        id="flux-fine-grain" 
                        value={props.fineGrain} 
                        min={0} max={100} 
                        onChange={props.onFineGrainChange} 
                        size="sm" 
                        label="FINE GRAIN" 
                        disabled={props.locked}
                        info="Adds high-frequency digital noise for sharpness and grit."
                    />
                 </div>
                 
                 <div className="w-full h-px bg-orange-900/10 my-1"></div>
                 <div className="flex items-center gap-4 px-2 bg-orange-900/5 p-3 rounded">
                     <Switch 
                        label="SMUDGE" 
                        checked={props.smudgeActive} 
                        onChange={props.onSmudgeActiveChange} 
                        disabled={props.locked} 
                        color="orange" 
                        info="Activates a blur filter to soften the generative patterns."
                    />
                     <div className="flex-1 pt-4">
                         <Slider 
                            value={props.smudgeFactor} 
                            min={0} max={100} 
                            onChange={props.onSmudgeFactorChange} 
                            label="SMUDGE FACTOR" 
                            disabled={!props.smudgeActive || props.locked} 
                            info="Controls the radius of the smudge/blur effect."
                        />
                     </div>
                 </div>
             </div>

             <div className="flex-1 flex flex-col justify-center gap-4 px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 relative group">
                        <button onClick={props.onPatternChange} disabled={props.locked} className={`push-btn-flux w-full h-12 rounded bg-stone-900 text-orange-500 font-mono text-xs tracking-wider flex items-center justify-center gap-2 hover:brightness-125 active:scale-[0.98] active:translate-y-[2px] transition-all ${props.locked ? 'opacity-50' : ''}`}>
                             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                             PATTERN: {props.pattern.toUpperCase()}
                        </button>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Cycle through the 10 available generative art algorithms." /></div>
                    </div>
                    <div className="flex gap-2 col-span-2">
                        <div className="flex-1 relative group">
                            <button onClick={props.onRandomize} disabled={props.locked} className={`push-btn-flux w-full h-12 rounded bg-stone-900 text-orange-500/80 font-mono text-xs tracking-wider flex items-center justify-center hover:brightness-125 hover:text-orange-400 active:scale-[0.98] active:translate-y-[2px] transition-all ${props.locked ? 'opacity-50' : ''}`}><i className="ph ph-shuffle text-xl"></i></button>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Randomize settings." /></div>
                        </div>
                        <div className="flex-1 relative group">
                            <button onClick={props.onSave} disabled={props.locked} className={`push-btn-flux w-full h-12 rounded bg-stone-900 text-orange-500/80 font-mono text-xs tracking-wider flex items-center justify-center hover:brightness-125 hover:text-orange-400 active:scale-[0.98] active:translate-y-[2px] transition-all ${props.locked ? 'opacity-50' : ''}`}><i className="ph ph-floppy-disk text-xl"></i></button>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Save state." /></div>
                        </div>
                    </div>
                    <div className="col-span-2 relative group">
                        <button onClick={props.onToggleLock} className="push-btn-flux w-full h-12 rounded bg-stone-900 text-orange-500 font-mono text-xs tracking-wider flex items-center justify-center gap-2 hover:brightness-125 active:scale-[0.98] active:translate-y-[2px] transition-all">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${props.locked ? 'bg-orange-500 shadow-[0_0_8px_rgba(255,165,0,0.8)]' : 'bg-orange-900'}`}></div>SAFETY LOCK
                        </button>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"><Tooltip text="Lock controls." /></div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      <style>{`
        .hardware-texture-flux { background-color: #1c1917; background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23292524' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E"); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 50px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(67, 20, 7, 0.3); }
        .lcd-screen-flux { background: #0f0a05; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); }
        .push-btn-flux { box-shadow: 0 4px 0 #0c0a09, 0 6px 6px rgba(0,0,0,0.4); }
        .push-btn-flux:active { box-shadow: 0 0 0 #0c0a09, inset 0 2px 4px rgba(0,0,0,0.4); }
      `}</style>
    </div>
  );
};