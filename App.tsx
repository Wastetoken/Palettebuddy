import React, { useState, useEffect, useCallback, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Device } from './components/Device';
import { FluxDevice } from './components/FluxDevice';
import { Cursor } from './components/ui/Cursor';
import { generateImage, generateFluxImage, triggerDownload, renderFluxToCanvas, DOWNLOAD_SIZES, DownloadSize, getNoiseSvgDataUri, NoiseType, FluxPattern, FLUX_PATTERNS } from './utils/canvas';
import { playClick, playSnap, playSwitch } from './utils/audio';

gsap.registerPlugin(ScrollTrigger);

const BLEND_MODES = ['overlay', 'soft-light', 'multiply', 'screen', 'difference'];

type SystemMode = 'chroma' | 'flux';

const encodeSignal = (data: any) => {
  try { return btoa(JSON.stringify(data)); } catch { return ""; }
};

const decodeSignal = (str: string) => {
  try { return JSON.parse(atob(str)); } catch { return null; }
};

export default function App() {
  const [systemMode, setSystemMode] = useState<SystemMode>('chroma');

  // --- CHROMA STATE ---
  const [hue, setHue] = useState(280);
  const [sat, setSat] = useState(50);
  const [lum, setLum] = useState(50);
  const [hueB, setHueB] = useState(240);
  const [satB, setSatB] = useState(60);
  const [lumB, setLumB] = useState(30);
  const [gradientType, setGradientType] = useState<'none' | 'linear' | 'radial'>('none');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [noise, setNoise] = useState(5);
  const [fineGrain, setFineGrain] = useState(0); 
  const [smudgeActive, setSmudgeActive] = useState(false); 
  const [smudgeFactor, setSmudgeFactor] = useState(50); 
  const [vignette, setVignette] = useState(0);
  const [noiseType, setNoiseType] = useState<NoiseType>('fractalNoise');
  const [noiseFreq, setNoiseFreq] = useState(0.65);
  const [noiseOctaves, setNoiseOctaves] = useState(3);
  const [blendMode, setBlendMode] = useState('overlay');
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{w:number, h:number} | null>(null);

  // --- FLUX STATE ---
  const [fluxHue, setFluxHue] = useState(210);
  const [fluxSpectra, setFluxSpectra] = useState(50);
  const [fluxExposure, setFluxExposure] = useState(50); 
  const [fluxDistortion, setFluxDistortion] = useState(30);
  const [fluxGrain, setFluxGrain] = useState(40);
  const [fluxFineGrain, setFluxFineGrain] = useState(0); 
  const [fluxSmudgeActive, setFluxSmudgeActive] = useState(false); 
  const [fluxSmudgeFactor, setFluxSmudgeFactor] = useState(50); 
  const [fluxIso, setFluxIso] = useState(60);
  const [fluxSeed, setFluxSeed] = useState(12345);
  const [fluxPattern, setFluxPattern] = useState<FluxPattern>('wave');

  const [locked, setLocked] = useState(false);
  const [audioSync, setAudioSync] = useState(false);
  
  const [showExport, setShowExport] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [shareLabel, setShareLabel] = useState("SHARE SIGNAL");
  const [activeCanvasDims, setActiveCanvasDims] = useState<{w: number, h: number} | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(1024)); // Buffer for audio data

  // Refs for rendering
  const fluxCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const chromaRef = useRef<HTMLDivElement>(null); // Ref for Chroma Gradient Div
  
  // Persistent audio accumulator for sticky values (hue)
  const audioAccumulatorRef = useRef({
      hueOffset: 0
  });

  // --- STATE REF (For RAF Loop) ---
  // We keep a ref updated with the latest state so the Animation Frame loop can read it without needing to be re-bound
  const stateRef = useRef({
    systemMode, hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle,
    noise, fineGrain, smudgeActive, smudgeFactor, vignette, blendMode, noiseType, noiseFreq, noiseOctaves,
    fluxHue, fluxSpectra, fluxExposure, fluxDistortion, fluxGrain, fluxFineGrain, fluxSmudgeActive, fluxSmudgeFactor, fluxIso, fluxSeed, fluxPattern,
    bgImage, activeCanvasDims, audioSync
  });

  useEffect(() => {
    stateRef.current = {
        systemMode, hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle,
        noise, fineGrain, smudgeActive, smudgeFactor, vignette, blendMode, noiseType, noiseFreq, noiseOctaves,
        fluxHue, fluxSpectra, fluxExposure, fluxDistortion, fluxGrain, fluxFineGrain, fluxSmudgeActive, fluxSmudgeFactor, fluxIso, fluxSeed, fluxPattern,
        bgImage, activeCanvasDims, audioSync
    };
    
    // If we are NOT in audio sync mode and values change, force a static render update for Flux
    if (!audioSync && systemMode === 'flux') {
        requestAnimationFrame(renderStaticFlux);
    }
  }, [
    systemMode, hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle, 
    noise, fineGrain, smudgeActive, smudgeFactor, vignette, noiseType, noiseFreq, noiseOctaves, blendMode,
    fluxHue, fluxSpectra, fluxExposure, fluxDistortion, fluxGrain, fluxFineGrain, fluxSmudgeActive, fluxSmudgeFactor, fluxIso, fluxSeed, fluxPattern,
    bgImage, activeCanvasDims, audioSync
  ]);

  // --- DIMENSION CALCULATION ---
  const updateCanvasDims = useCallback(() => {
    if (!viewportRef.current) return;
    const viewport = viewportRef.current.getBoundingClientRect();
    if (viewport.width === 0 || viewport.height === 0) return;

    if (systemMode === 'chroma' && bgImage && imgDims) {
        const imgRatio = imgDims.w / imgDims.h;
        const viewRatio = viewport.width / viewport.height;
        let w, h;
        if (imgRatio > viewRatio) {
            w = viewport.width; h = viewport.width / imgRatio;
        } else {
            h = viewport.height; w = viewport.height * imgRatio;
        }
        setActiveCanvasDims({ w, h });
    } else {
        setActiveCanvasDims({ w: viewport.width, h: viewport.height });
    }
  }, [systemMode, bgImage, imgDims]);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasDims);
    updateCanvasDims();
    return () => window.removeEventListener('resize', updateCanvasDims);
  }, [updateCanvasDims]);

  // --- AUDIO SYNC SETUP ---
  const toggleAudioSync = async () => {
    if (audioSync) {
        setAudioSync(false);

        // --- BAKE AUDIO OFFSET INTO STATE ---
        // This ensures color doesn't snap back when disabling sync
        const finalOffset = audioAccumulatorRef.current.hueOffset;
        if (systemMode === 'chroma') {
            setHue(prev => (prev + finalOffset) % 360);
            setHueB(prev => (prev + finalOffset) % 360);
        } else {
            setFluxHue(prev => (prev + finalOffset) % 360);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        
        // Reset Visuals (remove temporary CSS filters)
        if (chromaRef.current) {
             chromaRef.current.style.transform = 'scale(1)';
             chromaRef.current.style.filter = 'none';
        }
        
        // Reset Accumulator now that it's baked into the state
        audioAccumulatorRef.current.hueOffset = 0;
        
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048; 
        // Lower smoothing for snappier response (was 0.85)
        analyser.smoothingTimeConstant = 0.6;
        
        audioContextRef.current = audioCtx; 
        analyserRef.current = analyser;
        
        setAudioSync(true); 
        playSwitch();
    } catch (err) { console.error(err); setAudioSync(false); }
  };

  // --- UNIFIED ANIMATION LOOP ---
  // This loop runs constantly but does efficient checks. 
  // It handles Audio Analysis + Reactivity for both engines.
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
        const state = stateRef.current;
        let bass = 0, mid = 0, high = 0, vol = 0;

        // 1. Analyze Audio if Sync is On
        if (state.audioSync && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Simple frequency bands
            const data = dataArrayRef.current;
            // Bass: ~0-60Hz (approx first 10 bins of 1024 based on 44.1kHz)
            const bassSum = data.slice(0, 10).reduce((a,b) => a+b, 0);
            bass = (bassSum / 10) / 255; // 0.0 - 1.0

            // Mid: ~200-2000Hz
            const midSum = data.slice(20, 100).reduce((a,b) => a+b, 0);
            mid = (midSum / 80) / 255;

            // High: ~2k+
            const highSum = data.slice(100, 300).reduce((a,b) => a+b, 0);
            high = (highSum / 200) / 255;
            
            vol = (bass + mid + high) / 3;

            // Update Accumulators for Sticky Effects
            // We increment the hue offset based on volume.
            // If vol is 0, offset doesn't change -> Color Sticks.
            if (vol > 0.02) {
                audioAccumulatorRef.current.hueOffset += vol * 4; // Adjust speed here
            }
        }

        // 2. Render Flux (Canvas)
        if (state.systemMode === 'flux' && fluxCanvasRef.current && state.activeCanvasDims) {
             // Only render continuous frames if audio is sync'd to save battery, 
             // otherwise the useEffect dependency handles static updates.
             if (state.audioSync) {
                 const canvas = fluxCanvasRef.current;
                 const dpr = window.devicePixelRatio || 1;
                 const { w, h } = state.activeCanvasDims;
                 const targetW = Math.floor(w * dpr);
                 const targetH = Math.floor(h * dpr);

                 if (canvas.width !== targetW || canvas.height !== targetH) {
                     canvas.width = targetW; canvas.height = targetH;
                 }

                 const ctx = canvas.getContext('2d');
                 if (ctx) {
                     ctx.setTransform(1, 0, 0, 1, 0, 0);
                     
                     // APPLY AGGRESSIVE AUDIO REACTIVITY
                     // Bass hits distortion (warping) and ISO (zoom/scale) hard
                     const dynDistortion = state.fluxDistortion + (bass * 80); 
                     const dynIso = state.fluxIso + (bass * 50);
                     
                     // Highs hit Spectra (chromatic aberration)
                     const dynSpectra = state.fluxSpectra + (high * 100);
                     
                     // Volume drives Hue Cycling accumulatively
                     // Use accumulated offset so color persists when silent
                     const accumulatedHue = (state.fluxHue + audioAccumulatorRef.current.hueOffset) % 360;

                     renderFluxToCanvas(ctx, canvas.width, canvas.height, accumulatedHue, dynSpectra, state.fluxExposure, dynDistortion, dynIso, state.fluxSeed, state.fluxPattern, state.fluxSmudgeActive, state.fluxSmudgeFactor);
                 }
             }
        }

        // 3. Render Chroma (DOM Reactivity)
        if (state.systemMode === 'chroma' && chromaRef.current) {
            if (state.audioSync) {
                // Aggressive Reactivity
                // Bass -> Scale Pulse (Kick) - Returns to 1 on silence
                const scale = 1 + (bass * 0.25); 
                
                // Mids -> Saturation (Intensity) - Returns to 100 on silence
                const saturate = 100 + (mid * 150);
                
                // Hue Rotate -> Accumulative (Sticks on silence)
                const hueRot = audioAccumulatorRef.current.hueOffset % 360;

                chromaRef.current.style.transform = `scale(${scale})`;
                // Use hue-rotate to change colors fundamentally, not just brightness
                chromaRef.current.style.filter = `hue-rotate(${hueRot}deg) saturate(${saturate}%) brightness(${1 + high * 0.5})`;
            }
        }

        animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Run once, depend on refs

  // Static Render helper for Flux (when not audio syncing)
  const renderStaticFlux = () => {
    const state = stateRef.current;
    if (state.systemMode === 'flux' && fluxCanvasRef.current && state.activeCanvasDims) {
         const canvas = fluxCanvasRef.current;
         const dpr = window.devicePixelRatio || 1;
         const { w, h } = state.activeCanvasDims;
         const targetW = Math.floor(w * dpr);
         const targetH = Math.floor(h * dpr);

         if (canvas.width !== targetW || canvas.height !== targetH) {
             canvas.width = targetW; canvas.height = targetH;
         }
         const ctx = canvas.getContext('2d');
         if (ctx) {
             ctx.setTransform(1, 0, 0, 1, 0, 0);
             renderFluxToCanvas(ctx, canvas.width, canvas.height, state.fluxHue, state.fluxSpectra, state.fluxExposure, state.fluxDistortion, state.fluxIso, state.fluxSeed, state.fluxPattern, state.fluxSmudgeActive, state.fluxSmudgeFactor);
         }
    }
  };


  // --- REST OF APP LOGIC (Url Sync, Exports, etc) ---
  // Url Sync...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signal = params.get('signal');
    if (signal) {
        const d = decodeSignal(signal);
        if (d) {
            if (d.m) setSystemMode(d.m);
            if (d.h !== undefined) setHue(d.h);
            if (d.s !== undefined) setSat(d.s);
            if (d.l !== undefined) setLum(d.l);
            if (d.hb !== undefined) setHueB(d.hb);
            if (d.sb !== undefined) setSatB(d.sb);
            if (d.lb !== undefined) setLumB(d.lb);
            if (d.gt !== undefined) setGradientType(d.gt);
            if (d.ga !== undefined) setGradientAngle(d.ga);
            if (d.n !== undefined) setNoise(d.n);
            if (d.fg !== undefined) setFineGrain(d.fg);
            if (d.sa !== undefined) setSmudgeActive(d.sa);
            if (d.sf !== undefined) setSmudgeFactor(d.sf);
            if (d.v !== undefined) setVignette(d.v);
            if (d.nt !== undefined) setNoiseType(d.nt);
            if (d.bm !== undefined) setBlendMode(d.bm);
            
            if (d.fh !== undefined) setFluxHue(d.fh);
            if (d.fs !== undefined) setFluxSpectra(d.fs);
            if (d.fe !== undefined) setFluxExposure(d.fe);
            if (d.fd !== undefined) setFluxDistortion(d.fd);
            if (d.fgr !== undefined) setFluxGrain(d.fgr);
            if (d.ffg !== undefined) setFluxFineGrain(d.ffg);
            if (d.fsa !== undefined) setFluxSmudgeActive(d.fsa);
            if (d.fsf !== undefined) setFluxSmudgeFactor(d.fsf);
            if (d.fi !== undefined) setFluxIso(d.fi);
            if (d.fseed !== undefined) setFluxSeed(d.fseed);
            if (d.fp !== undefined) setFluxPattern(d.fp);
        }
    }
  }, []);
  
  // URL Write Update
  useEffect(() => {
    const timer = setTimeout(() => {
        const payload = {
            m: systemMode,
            h: hue, s: sat, l: lum,
            hb: hueB, sb: satB, lb: lumB,
            gt: gradientType, ga: gradientAngle,
            n: noise, fg: fineGrain, sa: smudgeActive, sf: smudgeFactor, v: vignette,
            nt: noiseType, nf: noiseFreq, no: noiseOctaves, bm: blendMode,
            fh: fluxHue, fs: fluxSpectra, fe: fluxExposure,
            fd: fluxDistortion, fgr: fluxGrain, ffg: fluxFineGrain, fsa: fluxSmudgeActive, fsf: fluxSmudgeFactor,
            fi: fluxIso, fseed: fluxSeed, fp: fluxPattern
        };
        const signal = encodeSignal(payload);
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('signal', signal);
            window.history.replaceState({}, '', url.toString());
        } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [
    systemMode, hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle, 
    noise, fineGrain, smudgeActive, smudgeFactor, vignette, noiseType, noiseFreq, noiseOctaves, blendMode,
    fluxHue, fluxSpectra, fluxExposure, fluxDistortion, fluxGrain, fluxFineGrain, fluxSmudgeActive, fluxSmudgeFactor, fluxIso, fluxSeed, fluxPattern
  ]);

  // Smooth Scroll (Lenis)
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), direction: 'vertical', smooth: true });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const wrapWithSound = (fn: any, soundFn: () => void = playClick) => {
      return (...args: any[]) => { soundFn(); fn(...args); };
  };

  const handleRandomize = useCallback(() => {
    playSnap();
    if (systemMode === 'chroma') {
        setHue(Math.floor(Math.random() * 360));
        setSat(Math.floor(Math.random() * 80) + 10);
        setLum(Math.floor(Math.random() * 60) + 20);
        setHueB(Math.floor(Math.random() * 360));
        setSatB(Math.floor(Math.random() * 80) + 10);
        setLumB(Math.floor(Math.random() * 60) + 20);
        setGradientType(Math.random() > 0.6 ? (Math.random() > 0.5 ? 'linear' : 'radial') : 'none');
        setGradientAngle(Math.floor(Math.random() * 360));
        setNoise(Math.floor(Math.random() * 20)); 
        setFineGrain(Math.floor(Math.random() * 20));
        setVignette(Math.floor(Math.random() * 40));
        setNoiseFreq(0.3 + Math.random() * 1.5);
    } else {
        setFluxHue(Math.floor(Math.random() * 360));
        setFluxSpectra(Math.floor(Math.random() * 100));
        setFluxExposure(Math.floor(Math.random() * 100));
        setFluxDistortion(Math.floor(Math.random() * 100));
        setFluxGrain(Math.floor(Math.random() * 60) + 10);
        setFluxFineGrain(Math.floor(Math.random() * 30));
        setFluxIso(Math.floor(Math.random() * 100));
        setFluxSeed(Math.floor(Math.random() * 100000));
        setFluxPattern(FLUX_PATTERNS[Math.floor(Math.random() * FLUX_PATTERNS.length)]);
    }
  }, [systemMode]);

  const cycleBlendMode = useCallback(() => {
    playSwitch();
    const currentIndex = BLEND_MODES.indexOf(blendMode);
    setBlendMode(BLEND_MODES[(currentIndex + 1) % BLEND_MODES.length]);
  }, [blendMode]);

  const toggleNoiseType = useCallback(() => {
    playSwitch();
    setNoiseType(prev => prev === 'fractalNoise' ? 'turbulence' : 'fractalNoise');
  }, []);
  
  const cycleFluxPattern = useCallback(() => {
      playSwitch();
      setFluxPattern(prev => FLUX_PATTERNS[(FLUX_PATTERNS.indexOf(prev) + 1) % FLUX_PATTERNS.length]);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => { 
            if (evt.target?.result) { 
                const img = new Image();
                img.onload = () => {
                    setImgDims({w: img.width, h: img.height});
                    setBgImage(evt.target!.result as string); 
                    playSwitch(); 
                };
                img.src = evt.target!.result as string;
            } 
          };
          reader.readAsDataURL(file);
      }
  };

  const handleExport = async (sizeKey: DownloadSize) => {
    setIsGenerating(true);
    playSwitch();
    try {
      let dataUrl = '';
      if (systemMode === 'chroma') {
        dataUrl = await generateImage(
            hue, sat, lum, hueB, satB, lumB,
            gradientType, gradientAngle,
            noise, fineGrain, smudgeActive, smudgeFactor,
            blendMode as GlobalCompositeOperation, 
            noiseType, noiseFreq, noiseOctaves, vignette, sizeKey, bgImage
        );
      } else {
        dataUrl = await generateFluxImage(
            fluxHue, fluxSpectra, fluxExposure, fluxDistortion,
            fluxGrain, fluxFineGrain, fluxIso, sizeKey, fluxPattern, fluxSmudgeActive, fluxSmudgeFactor, fluxSeed
        );
      }
      triggerDownload(dataUrl, `CHROMA_${systemMode.toUpperCase()}_${Date.now()}_${sizeKey}.png`);
    } catch (e) { console.error(e); alert("Failed to generate image."); } finally { setIsGenerating(false); }
  };

  const copyCode = () => {
      // Helper to generate color name for the prompt
      const getColorName = (h: number) => {
        if (h < 15 || h >= 345) return 'Crimson Red';
        if (h < 45) return 'Amber Orange';
        if (h < 75) return 'Electric Yellow';
        if (h < 160) return 'Neon Green';
        if (h < 210) return 'Cyan Blue';
        if (h < 270) return 'Deep Purple';
        if (h < 315) return 'Magenta';
        return 'Hot Pink';
      };

      let description = "";
      
      if (systemMode === 'chroma') {
          description = `Abstract gradient texture, ${gradientType} style. Primary color ${getColorName(hue)}, Secondary color ${getColorName(hueB)}. Heavy film grain (${noise}%) and vignette. Analog aesthetic.`;
      } else {
          description = `Generative digital art, ${fluxPattern} pattern. ${fluxDistortion > 50 ? 'Heavily distorted and chaotic' : 'Smooth and fluid'}. Dominant color ${getColorName(fluxHue)}. Features chromatic aberration and CRT scanline artifacts.`;
      }

      const payload = {
        meta: {
            app: "CHROMA-SYS",
            version: "3.0",
            timestamp: new Date().toISOString(),
            prompt_suggestion: description // Provides instructions for external AIs
        },
        systemMode,
        chroma: { hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle, noise, fineGrain, smudgeActive, smudgeFactor, vignette, blendMode, noiseType, noiseFreq, noiseOctaves },
        flux: { 
            hue: fluxHue, spectra: fluxSpectra, exposure: fluxExposure, distortion: fluxDistortion, 
            grain: fluxGrain, fineGrain: fluxFineGrain, iso: fluxIso, pattern: fluxPattern,
            smudgeActive: fluxSmudgeActive, smudgeFactor: fluxSmudgeFactor,
            seed: fluxSeed
        }
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      playSwitch();
  };

  const handleShare = () => {
      playClick();
      navigator.clipboard.writeText(window.location.href);
      setShareLabel("LINK COPIED");
      setTimeout(() => setShareLabel("SHARE SIGNAL"), 2000);
  };

  const handleShowCode = () => {
      wrapWithSound(() => {
          if (audioSync) toggleAudioSync();
          setShowCode(true);
      }, playClick)();
  };

  const getGradientCSS = () => {
    if (systemMode === 'chroma') {
        const c1 = `hsl(${hue}, ${sat}%, ${lum}%)`;
        const c2 = `hsl(${hueB}, ${satB}%, ${lumB}%)`;
        if (gradientType === 'linear') return `linear-gradient(${gradientAngle}deg, ${c1}, ${c2})`;
        else if (gradientType === 'radial') return `radial-gradient(circle at center, ${c1}, ${c2})`;
        else return c1;
    } 
    return 'black'; 
  };

  const getGradientStyle = () => {
      const style: any = {};
      if (bgImage && systemMode === 'chroma') {
          style.backgroundImage = `url(${bgImage}), ${getGradientCSS()}`;
          style.backgroundBlendMode = 'overlay'; style.backgroundSize = 'cover'; style.backgroundPosition = 'center';
      } else { style.background = getGradientCSS(); }
      return style;
  };

  const noiseSvg = getNoiseSvgDataUri(systemMode === 'chroma' ? noiseType : 'turbulence', systemMode === 'chroma' ? noiseFreq : (0.5 + (fluxIso/100)*1.5), systemMode === 'chroma' ? noiseOctaves : 2);

  return (
    <div className="bg-[#050505] h-screen w-screen text-[#e5e5e5] font-sans overflow-hidden flex flex-col md:flex-row">
      <Cursor />

      {/* --- SIDEBAR: CONTROL DECK --- */}
      <div className="w-full md:w-[480px] lg:w-[540px] flex-shrink-0 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/10 shadow-2xl z-20 flex flex-col h-[40vh] md:h-full relative">
        {/* Header / Nav */}
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a] z-30 sticky top-0 shrink-0">
             <div className="font-mono font-bold text-xl tracking-tighter cursor-hover group select-none">CHROMA<span className="text-xs align-top opacity-50 group-hover:text-green-400 transition-colors">Sys</span></div>
             
             {/* Realistic Rocker Switch */}
             <div className="flex bg-[#050505] rounded-md p-1 border border-white/10 gap-0 relative shadow-inner">
                <div className={`absolute top-1 bottom-1 w-[48%] bg-neutral-700/50 rounded transition-all duration-300 ${systemMode === 'chroma' ? 'left-1' : 'left-[51%]'}`}></div>
                <button onClick={wrapWithSound(() => setSystemMode('chroma'), playSwitch)} className={`relative z-10 px-4 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${systemMode === 'chroma' ? 'bg-gradient-to-t from-neutral-200 to-white text-black shadow-lg border-b-2 border-neutral-400 transform -translate-y-[1px]' : 'text-neutral-600 hover:text-neutral-400'}`}>Chroma</button>
                <button onClick={wrapWithSound(() => setSystemMode('flux'), playSwitch)} className={`relative z-10 px-4 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${systemMode === 'flux' ? 'bg-gradient-to-t from-orange-400 to-orange-200 text-black shadow-lg border-b-2 border-orange-600 transform -translate-y-[1px]' : 'text-neutral-600 hover:text-neutral-400'}`}>Flux</button>
            </div>
            
             <button onClick={handleShare} className="hidden lg:flex items-center gap-2 px-3 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors"><i className="ph ph-share-network text-sm"></i></button>
        </header>

        {/* Scrollable Controls Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar p-6 pb-20 relative bg-neutral-900/50">
            {/* Dotted Pattern Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative z-10 flex flex-col items-center">
                 {systemMode === 'chroma' ? (
                    <Device 
                        hue={hue} sat={sat} lum={lum} hueB={hueB} satB={satB} lumB={lumB}
                        gradientType={gradientType} gradientAngle={gradientAngle}
                        noise={noise} fineGrain={fineGrain} smudgeActive={smudgeActive} smudgeFactor={smudgeFactor}
                        vignette={vignette} blendMode={blendMode}
                        noiseType={noiseType} noiseFreq={noiseFreq} noiseOctaves={noiseOctaves}
                        locked={locked} audioSync={audioSync} bgImage={bgImage}
                        onHueChange={setHue} onSatChange={setSat} onLumChange={setLum}
                        onHueBChange={setHueB} onSatBChange={setSatB} onLumBChange={setLumB}
                        onGradientTypeChange={wrapWithSound(setGradientType)} onGradientAngleChange={setGradientAngle}
                        onNoiseChange={setNoise} onFineGrainChange={setFineGrain} 
                        onSmudgeActiveChange={setSmudgeActive} onSmudgeFactorChange={setSmudgeFactor}
                        onNoiseTypeChange={toggleNoiseType} onNoiseFreqChange={setNoiseFreq} onNoiseOctavesChange={setNoiseOctaves}
                        onVignetteChange={setVignette} onBlendModeChange={cycleBlendMode}
                        onRandomize={handleRandomize} onToggleLock={wrapWithSound(() => setLocked(!locked), playSwitch)}
                        onExport={wrapWithSound(() => setShowExport(true))} onSave={wrapWithSound(() => setShowSaveModal(true))}
                        onShowCode={handleShowCode} onToggleAudio={toggleAudioSync}
                        onImageUpload={handleImageUpload} onClearImage={() => { setBgImage(null); setImgDims(null); playClick(); }}
                    />
                ) : (
                    <FluxDevice 
                        hue={fluxHue} spectra={fluxSpectra} exposure={fluxExposure}
                        distortion={fluxDistortion} grain={fluxGrain} fineGrain={fluxFineGrain}
                        smudgeActive={fluxSmudgeActive} smudgeFactor={fluxSmudgeFactor}
                        iso={fluxIso} pattern={fluxPattern} locked={locked}
                        onHueChange={setFluxHue} onSpectraChange={setFluxSpectra}
                        onExposureChange={setFluxExposure} onDistortionChange={setFluxDistortion}
                        onGrainChange={setFluxGrain} onFineGrainChange={setFluxFineGrain}
                        onSmudgeActiveChange={setFluxSmudgeActive} onSmudgeFactorChange={setFluxSmudgeFactor}
                        onIsoChange={setFluxIso} onPatternChange={cycleFluxPattern}
                        onRandomize={handleRandomize} onToggleLock={wrapWithSound(() => setLocked(!locked), playSwitch)}
                        onExport={wrapWithSound(() => setShowExport(true))} 
                        onSave={wrapWithSound(() => setShowSaveModal(true))} 
                        onShowCode={handleShowCode}
                    />
                )}
            </div>
        </div>
      </div>

      {/* --- MAIN: VIEWPORT / VISUALIZER --- */}
      <div className="flex-1 bg-black relative flex items-center justify-center p-4 md:p-8 overflow-hidden order-first md:order-last h-[60vh] md:h-full">
         <div ref={viewportRef} className="relative w-full h-full max-w-[1600px] flex items-center justify-center p-4">
             
             {/* MONITOR BEZEL FRAME */}
             <div className="monitor-bezel w-full h-full relative flex items-center justify-center p-4 md:p-6 bg-[#1a1a1a]">
                 {/* Decorative Screws */}
                 <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,1)] flex items-center justify-center border border-black"><div className="w-1.5 h-0.5 bg-neutral-900 rotate-45"></div></div>
                 <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,1)] flex items-center justify-center border border-black"><div className="w-1.5 h-0.5 bg-neutral-900 rotate-45"></div></div>
                 <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,1)] flex items-center justify-center border border-black"><div className="w-1.5 h-0.5 bg-neutral-900 rotate-45"></div></div>
                 <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,1)] flex items-center justify-center border border-black"><div className="w-1.5 h-0.5 bg-neutral-900 rotate-45"></div></div>
                 
                 {/* Branding Label */}
                 <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[0.5rem] font-mono font-bold tracking-[0.2em] text-neutral-600/50">CHROMA VISION REF-1</div>

                 {/* SCREEN GLASS */}
                 <div 
                    className="relative w-full h-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)] ring-1 ring-white/5 bg-black rounded"
                    style={{ 
                        width: activeCanvasDims?.w || '100%', 
                        height: activeCanvasDims?.h || '100%',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                 >
                    {/* --- CHROMA RENDERING LAYERS (DOM) --- */}
                    {/* We attach a REF here to manipulate styles directly for audio reactivity */}
                    <div 
                        ref={chromaRef}
                        className={`absolute inset-0 transition-opacity duration-500 origin-center will-change-transform ${systemMode === 'chroma' ? 'opacity-100' : 'opacity-0'}`} 
                    >
                        <div className="absolute inset-0" style={getGradientStyle()}></div>
                    </div>

                    {/* Noise & Vignette (Static overlays) */}
                    <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${systemMode === 'chroma' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url("${noiseSvg}")`, opacity: noise / 100, mixBlendMode: blendMode as any }}></div>
                    <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${systemMode === 'chroma' ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'radial-gradient(circle, transparent 50%, black 150%)', opacity: vignette / 100 }}></div>

                    {/* --- FLUX RENDERING LAYERS (CANVAS) --- */}
                    <canvas ref={fluxCanvasRef} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${systemMode === 'flux' ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${systemMode === 'flux' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url("${noiseSvg}")`, opacity: fluxGrain / 100, mixBlendMode: 'overlay' }}></div>
                    
                    {/* Screen Glare Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 pointer-events-none"></div>

                    {/* REC INDICATOR */}
                    {isGenerating && (<div className="absolute top-4 right-4 z-50 bg-red-600 text-white font-mono text-xs px-3 py-1 rounded animate-pulse shadow-lg flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full"></div>REC</div>)}
                 </div>
             </div>
         </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {showExport && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-[#111] border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>
                  <h2 className="font-mono text-xl font-bold mb-2 tracking-tighter">RENDER OUTPUT</h2>
                  <p className="text-xs font-mono text-neutral-500 mb-6 uppercase tracking-widest">Select target resolution</p>
                  <div className="grid grid-cols-1 gap-3">
                      {(Object.keys(DOWNLOAD_SIZES) as DownloadSize[]).map((key) => (
                          <button 
                              key={key}
                              onClick={() => { handleExport(key); setShowExport(false); }}
                              className="group flex items-center justify-between p-4 rounded border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all active:scale-[0.98]"
                          >
                              <span className="font-mono font-bold text-sm">{key}</span>
                              <span className="text-[10px] font-mono text-neutral-500 group-hover:text-white transition-colors">{DOWNLOAD_SIZES[key].label}</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => { setShowExport(false); playClick(); }} className="mt-6 w-full py-3 rounded border border-white/5 hover:bg-white/5 text-neutral-400 hover:text-white font-mono text-xs tracking-widest transition-colors">CANCEL_OPERATION</button>
              </div>
          </div>
       )}

       {/* --- CODE MODAL --- */}
       {showCode && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-[#111] border border-white/10 rounded-xl p-8 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[80vh]">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                   <div className="flex justify-between items-end mb-6">
                      <div>
                          <h2 className="font-mono text-xl font-bold tracking-tighter">SYSTEM_SIGNAL</h2>
                          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Current State Configuration</p>
                      </div>
                      <button onClick={() => { copyCode(); }} className="text-[10px] bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors font-mono">COPY JSON</button>
                   </div>
                   <div className="bg-black/50 rounded p-4 border border-white/5 overflow-auto flex-1 font-mono text-[10px] text-green-400/80 selection:bg-green-500/30">
                      <pre>{JSON.stringify({
                          mode: systemMode,
                          chroma: { hue, sat, lum, hueB, satB, lumB, gradientType, gradientAngle, noise, fineGrain, smudgeActive, smudgeFactor, vignette, blendMode, noiseType, noiseFreq, noiseOctaves },
                          flux: { 
                              hue: fluxHue, spectra: fluxSpectra, exposure: fluxExposure, distortion: fluxDistortion, 
                              grain: fluxGrain, fineGrain: fluxFineGrain, iso: fluxIso, pattern: fluxPattern,
                              smudgeActive: fluxSmudgeActive, smudgeFactor: fluxSmudgeFactor,
                              seed: fluxSeed
                          }
                      }, null, 2)}</pre>
                   </div>
                   <button onClick={() => { setShowCode(false); playClick(); }} className="mt-6 w-full py-3 rounded border border-white/5 hover:bg-white/5 text-neutral-400 hover:text-white font-mono text-xs tracking-widest transition-colors">CLOSE_TERMINAL</button>
              </div>
          </div>
       )}
    </div>
  );
}