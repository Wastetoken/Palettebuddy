import React, { useState, useEffect, useCallback } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Device } from './components/Device';
import { Cursor } from './components/ui/Cursor';
import { generateImage, triggerDownload, DOWNLOAD_SIZES, DownloadSize } from './utils/canvas';

gsap.registerPlugin(ScrollTrigger);

const BLEND_MODES = ['overlay', 'soft-light', 'multiply', 'screen', 'difference'];

export default function App() {
  const [hue, setHue] = useState(280);
  const [sat, setSat] = useState(50);
  const [lum, setLum] = useState(50);
  
  // Texture State
  const [noise, setNoise] = useState(5); // 0 - 100
  const [vignette, setVignette] = useState(0); // 0 - 100
  const [blendMode, setBlendMode] = useState('overlay');
  
  const [locked, setLocked] = useState(false);
  
  // Export Modal State
  const [showExport, setShowExport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smooth: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Animations on scroll
  useEffect(() => {
    gsap.utils.toArray('.reveal-text').forEach((el: any) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 80%" },
        y: 50, opacity: 0, duration: 1, ease: "power4.out"
      });
    });

    gsap.from(".preset-card", {
        scrollTrigger: { trigger: "#presets", start: "top 60%" },
        x: 100, opacity: 0, duration: 0.8, stagger: 0.1, ease: "expo.out"
    });
  }, []);

  const handleRandomize = useCallback(() => {
    setHue(Math.floor(Math.random() * 360));
    setSat(Math.floor(Math.random() * 80) + 10);
    setLum(Math.floor(Math.random() * 60) + 20);
    // Subtle randomization for texture
    setNoise(Math.floor(Math.random() * 20)); 
    setVignette(Math.floor(Math.random() * 40));
  }, []);

  const cycleBlendMode = useCallback(() => {
    const currentIndex = BLEND_MODES.indexOf(blendMode);
    const nextIndex = (currentIndex + 1) % BLEND_MODES.length;
    setBlendMode(BLEND_MODES[nextIndex]);
  }, [blendMode]);

  const handleExport = async (sizeKey: DownloadSize) => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateImage(
        hue, sat, lum, 
        noise, 
        blendMode as GlobalCompositeOperation, 
        vignette, 
        sizeKey
      );
      
      const filename = `CHROMA_H${hue}_S${sat}_L${lum}_${sizeKey}.png`;
      triggerDownload(dataUrl, filename);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const ambientColor = `hsla(${hue}, ${sat}%, 50%, 0.15)`;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-[#e5e5e5] font-sans selection:bg-green-500/30 selection:text-green-200">
      
      {/* DYNAMIC NOISE LAYER */}
      <div 
        className="fixed inset-0 z-[9000] pointer-events-none transition-all duration-300"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: noise / 100,
            mixBlendMode: blendMode as any
        }}
      ></div>

      {/* DYNAMIC VIGNETTE LAYER */}
      <div 
        className="fixed inset-0 z-[8999] pointer-events-none transition-all duration-300"
        style={{
            background: 'radial-gradient(circle, transparent 50%, black 150%)',
            opacity: vignette / 100
        }}
      ></div>

      <Cursor />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-6 md:p-8 flex justify-between items-start mix-blend-exclusion">
        <div className="font-mono font-bold text-xl md:text-2xl tracking-tighter cursor-hover group">
          CHROMA<span className="text-xs align-top opacity-50 group-hover:text-green-400 transition-colors">Status: Online</span>
        </div>
        <div className="flex gap-8 font-mono text-xs md:text-sm uppercase tracking-widest hidden md:flex">
          <a href="#about" className="hover:text-gray-400 transition-colors cursor-hover">Manual</a>
          <a href="#presets" className="hover:text-gray-400 transition-colors cursor-hover">Presets</a>
          <span className="opacity-50">V 1.0.5</span>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-20">
            {/* Ambient Light */}
            <div 
                className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 transition-colors duration-1000 ease-in-out"
                style={{ backgroundColor: ambientColor }}
            ></div>

            {/* The Main Device */}
            <div className="z-10 mt-12 md:mt-0">
                <Device 
                    hue={hue} sat={sat} lum={lum} 
                    noise={noise} vignette={vignette} blendMode={blendMode}
                    locked={locked}
                    onHueChange={setHue}
                    onSatChange={setSat}
                    onLumChange={setLum}
                    onNoiseChange={setNoise}
                    onVignetteChange={setVignette}
                    onBlendModeChange={cycleBlendMode}
                    onRandomize={handleRandomize}
                    onToggleLock={() => setLocked(!locked)}
                    onExport={() => setShowExport(true)}
                />
            </div>

             {/* Scroll Indicator */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center opacity-40 animate-bounce">
                <div className="text-[10px] font-mono uppercase mb-2">Scroll for Specs</div>
                <i className="ph ph-arrow-down text-xl"></i>
            </div>
        </section>

        {/* NARRATIVE SECTION */}
        <section id="about" className="bg-[#0f0f0f] py-32 relative overflow-hidden border-t border-white/5">
             <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div>
                    <h2 className="text-5xl md:text-8xl font-sans font-bold leading-[0.9] tracking-tighter mb-8 text-neutral-200 reveal-text">
                        Analog Feel.<br/>Digital Soul.
                    </h2>
                    <p className="text-lg md:text-xl text-neutral-400 font-mono leading-relaxed max-w-md reveal-text">
                        We wanted to bring the tactile joy of physical synthesizers to color theory. Adjust hue with heavy, resistance-damped knobs. Feel the click of the switch.
                    </p>
                    <div className="mt-12 flex gap-8 reveal-text">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl md:text-4xl font-sans font-bold">4k</span>
                            <span className="text-xs font-mono uppercase opacity-50">Resolution</span>
                        </div>
                        <div className="w-px bg-white/10 h-12"></div>
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl md:text-4xl font-sans font-bold">60fps</span>
                            <span className="text-xs font-mono uppercase opacity-50">Physics</span>
                        </div>
                    </div>
                </div>
                <div className="relative h-[400px] md:h-[600px] bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5 group perspective-card cursor-hover reveal-text">
                    <img 
                        src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2601&auto=format&fit=crop" 
                        alt="Abstract Macro Electronics" 
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <div className="font-mono text-xs text-green-500 mb-2">>> SYSTEM_READY</div>
                        <h3 className="text-2xl font-bold">Component Level Design</h3>
                    </div>
                </div>
            </div>
        </section>

        {/* PRESETS SECTION */}
        <section id="presets" className="py-32 bg-black border-t border-white/10 overflow-hidden">
            <div className="mb-16 px-6 max-w-6xl mx-auto">
                <div className="text-xs font-mono text-green-500 mb-2">/// PRESET_LIBRARY</div>
                <h2 className="text-4xl md:text-5xl font-sans font-bold">Signal Configurations</h2>
            </div>

            <div className="flex gap-8 px-6 overflow-x-auto pb-12 snap-x hide-scrollbar">
                 {[
                    { title: "Neon Tokyo", desc: "High saturation cyberpunk aesthetics.", grad: "from-purple-900 to-blue-900", hue: 280, sat: 90, lum: 60, noise: 15, vignette: 20 },
                    { title: "Mars Rover", desc: "Dusty, monochromatic rust tones.", grad: "from-orange-900 to-red-900", hue: 20, sat: 60, lum: 40, noise: 40, vignette: 50 },
                    { title: "Brutalist", desc: "Essential greyscales for architectural minimalism.", grad: "from-slate-700 to-slate-900", hue: 0, sat: 0, lum: 80, noise: 80, vignette: 0 },
                    { title: "Deep Forest", desc: "Organic tones with low luminescence.", grad: "from-emerald-900 to-teal-800", hue: 150, sat: 70, lum: 30, noise: 10, vignette: 30 },
                    { title: "Solar Flare", desc: "Intense warm tones for high-impact alerts.", grad: "from-yellow-700 to-red-600", hue: 45, sat: 100, lum: 60, noise: 5, vignette: 10 }
                 ].map((preset, i) => (
                    <button 
                        key={i}
                        onClick={() => {
                            setHue(preset.hue); setSat(preset.sat); setLum(preset.lum);
                            setNoise(preset.noise); setVignette(preset.vignette);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="preset-card flex-none w-[300px] md:w-[400px] h-[450px] md:h-[500px] bg-[#111] border border-white/10 rounded-xl p-6 relative group cursor-hover hover:border-gray-500/50 transition-colors snap-center text-left"
                    >
                        <div className={`w-full h-40 md:h-48 bg-gradient-to-br ${preset.grad} rounded mb-6 shadow-inner`}></div>
                        <h3 className="text-2xl md:text-3xl font-sans font-bold mb-2">{preset.title}</h3>
                        <p className="font-mono text-xs md:text-sm text-gray-500 mb-8 leading-relaxed">{preset.desc}</p>
                        <div className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full group-hover:bg-white group-hover:text-black transition-colors">Load Cartridge</div>
                    </button>
                 ))}
            </div>
        </section>

        {/* EXPORT MODAL */}
        {showExport && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowExport(false)}>
                <div 
                    className="bg-[#141414] border border-white/10 rounded-xl p-8 max-w-lg w-full relative hardware-chassis"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-4 right-4 text-xs font-mono cursor-pointer hover:text-white text-gray-500" onClick={() => setShowExport(false)}>[X] CLOSE</div>
                    
                    <h2 className="text-2xl font-bold font-sans mb-2 text-white">Export Signal</h2>
                    <p className="font-mono text-xs text-gray-400 mb-8">Render the current frequency visualization to high-resolution image format.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.keys(DOWNLOAD_SIZES) as DownloadSize[]).map((key) => (
                            <button
                                key={key}
                                disabled={isGenerating}
                                onClick={() => handleExport(key)}
                                className="group h-16 border border-white/10 rounded bg-black/20 hover:bg-white/5 flex flex-col items-center justify-center transition-colors cursor-hover disabled:opacity-50"
                            >
                                <span className="font-mono text-lg font-bold group-hover:text-green-400">{key}</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{DOWNLOAD_SIZES[key].label}</span>
                            </button>
                        ))}
                    </div>
                    
                    {isGenerating && (
                        <div className="mt-4 text-center font-mono text-xs text-green-500 animate-pulse">
                            /// RENDERING OUTPUT... PLEASE WAIT
                        </div>
                    )}
                </div>
            </div>
        )}

        <footer className="bg-black text-white/30 py-12 px-6 border-t border-white/5 font-mono text-xs">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    CHROMA-SYS © 2024<br/>
                    ENGINEERED IN REACT
                </div>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-white transition-colors">TWITTER</a>
                    <a href="#" className="hover:text-white transition-colors">GITHUB</a>
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
}