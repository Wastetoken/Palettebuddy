import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Tooltip } from './Tooltip';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label?: string;
  disabled?: boolean;
  info?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, min, max, onChange, label, disabled, info }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Calculate percentage for rendering
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    const handleInteract = useCallback((clientX: number) => {
        if (!trackRef.current || disabled) return;
        
        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const width = rect.width;
        
        let newPercent = x / width;
        newPercent = Math.max(0, Math.min(1, newPercent));
        
        const newValue = Math.round(min + newPercent * (max - min));
        onChange(newValue);
    }, [min, max, onChange, disabled]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteract(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleInteract(e.touches[0].clientX);
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleInteract(e.clientX);
            }
        };
        const handleUp = () => setIsDragging(false);

        const handleTouchMove = (e: TouchEvent) => {
             if (isDragging) {
                // e.preventDefault(); // Sometimes prevents scroll, use with caution
                handleInteract(e.touches[0].clientX);
             }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, handleInteract]);

    return (
        <div className={`flex flex-col gap-2 w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {label && (
                <div className="flex items-center gap-1">
                    <div className="text-[0.6rem] uppercase tracking-widest text-neutral-500 font-bold text-shadow-white">{label}</div>
                    {info && <Tooltip text={info} />}
                </div>
            )}
            
            <div 
                ref={trackRef}
                className="relative h-8 w-full cursor-pointer group"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Track Groove */}
                <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[#0a0a0a] rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.1)] border-b border-white/5"></div>
                
                {/* Fill Line (Subtle) */}
                <div 
                    className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-neutral-800 to-neutral-600 rounded-l-full opacity-50 pointer-events-none"
                    style={{ width: `${percentage}%` }}
                ></div>

                {/* Thumb / Fader Cap */}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-gradient-to-b from-[#444] to-[#222] rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-black transform transition-transform active:scale-95 z-10"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                >
                    {/* Grip Line on Fader */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-[#111] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"></div>
                </div>
            </div>
            
            <div className="flex justify-between font-mono text-[9px] text-neutral-600 select-none">
                <span>{min}</span>
                <span>{value}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};