import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const outline = outlineRef.current;
    if (!dot || !outline) return;

    // Center cursor initially
    gsap.set([dot, outline], { xPercent: -50, yPercent: -50 });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Direct follow for dot
      gsap.to(dot, { x: clientX, y: clientY, duration: 0 });
      
      // Laggy follow for outline
      gsap.to(outline, { x: clientX, y: clientY, duration: 0.15, ease: 'power2.out' });
    };

    const handleMouseEnter = () => {
        gsap.to(outline, { scale: 1.5, borderColor: "rgba(255,255,255,0.8)", duration: 0.2 });
        gsap.to(dot, { scale: 0.5, backgroundColor: "#4aff4a", duration: 0.2 });
    };

    const handleMouseLeave = () => {
        gsap.to(outline, { scale: 1, borderColor: "rgba(255,255,255,0.5)", duration: 0.2 });
        gsap.to(dot, { scale: 1, backgroundColor: "white", duration: 0.2 });
    };

    // Attach listeners to interactive elements dynamically
    const addHoverListeners = () => {
        const hoverables = document.querySelectorAll('.cursor-hover');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });
    };

    window.addEventListener('mousemove', handleMouseMove);
    addHoverListeners();

    // Re-attach listeners if DOM changes (simplified observation)
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div 
        ref={dotRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full z-[10000] pointer-events-none hidden md:block mix-blend-difference"
      />
      <div 
        ref={outlineRef} 
        className="fixed top-0 left-0 w-10 h-10 border border-white/50 rounded-full z-[10000] pointer-events-none hidden md:block mix-blend-difference"
      />
    </>
  );
};