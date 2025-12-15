

export const DOWNLOAD_SIZES = {
  '4K': { width: 3840, height: 2160, label: '4K WALLPAPER' },
  '1080P': { width: 1920, height: 1080, label: '1080P DESKTOP' },
  'MOBILE': { width: 1080, height: 1920, label: 'MOBILE PORTRAIT' },
  'SQUARE': { width: 2048, height: 2048, label: 'INSTAGRAM SQUARE' },
};

export type DownloadSize = keyof typeof DOWNLOAD_SIZES;
export type NoiseType = 'fractalNoise' | 'turbulence';

// EXPANDED PATTERN LIST
export const FLUX_PATTERNS = [
    'wave', 
    'interference', 
    'ripple', 
    'prism', 
    'turbulence', 
    'glitch', 
    'kaleido', 
    'pixelate', 
    'scanline', 
    'vortex'
] as const;

export type FluxPattern = typeof FLUX_PATTERNS[number];

// --- SEEDED RANDOM ---
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// --- NOISE GENERATION ---
function noise(x: number, y: number, seed: number) {
    const fn = mulberry32(seed + x * 1341 + y * 7231);
    return fn() * 2 - 1; 
}

export const getNoiseSvgDataUri = (type: NoiseType, frequency: number, octaves: number) => {
  const safeFreq = Math.max(0.001, frequency);
  const safeOctaves = Math.max(1, Math.min(10, Math.floor(octaves)));
  
  const svg = `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>
    <filter id='noiseFilter'>
      <feTurbulence type='${type}' baseFrequency='${safeFreq}' numOctaves='${safeOctaves}' stitchTiles='stitch'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#noiseFilter)' opacity='1'/>
  </svg>`;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// --- CHROMA RENDERER (Legacy Support) ---
export const renderChromaFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hue: number, sat: number, lum: number,
    hueB: number, satB: number, lumB: number,
    gradientType: 'none' | 'linear' | 'radial',
    gradientAngle: number,
    noiseOpacity: number,
    fineGrainOpacity: number,
    smudgeActive: boolean,
    smudgeFactor: number,
    blendMode: string,
    vignetteIntensity: number,
    noiseImage: HTMLImageElement | null,
    fineGrainImage: HTMLImageElement | null,
    bgImage: HTMLImageElement | null
) => {
    // 1. Draw Base
    const colorA = `hsl(${hue}, ${sat}%, ${lum}%)`;
    const colorB = `hsl(${hueB}, ${satB}%, ${lumB}%)`;

    ctx.save();
    
    // Apply Smudge (Blur) filter before drawing base if active
    if (smudgeActive && smudgeFactor > 0) {
        const blurPx = (smudgeFactor / 100) * 50; // Max 50px blur
        ctx.filter = `blur(${blurPx}px)`;
    }

    if (bgImage) {
        const scale = Math.max(width / bgImage.width, height / bgImage.height);
        const x = (width / 2) - (bgImage.width / 2) * scale;
        const y = (height / 2) - (bgImage.height / 2) * scale;
        ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
        
        ctx.globalCompositeOperation = 'overlay';
        if (gradientType === 'linear') {
            ctx.fillStyle = createLinearGradient(ctx, width, height, gradientAngle, colorA, colorB);
        } else {
            ctx.fillStyle = colorA;
        }
        ctx.fillRect(0,0,width,height);
        ctx.globalCompositeOperation = 'source-over';
    } else {
        if (gradientType === 'none') {
            ctx.fillStyle = colorA;
            ctx.fillRect(0, 0, width, height);
        } else if (gradientType === 'linear') {
            ctx.fillStyle = createLinearGradient(ctx, width, height, gradientAngle, colorA, colorB);
            ctx.fillRect(0, 0, width, height);
        } else if (gradientType === 'radial') {
            const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height) / 1.5);
            grad.addColorStop(0, colorA);
            grad.addColorStop(1, colorB);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    // Reset filter so noise isn't blurred
    ctx.filter = 'none';
    ctx.restore();

    // 2. Draw Noise (Coarse)
    if (noiseOpacity > 0 && noiseImage) {
        ctx.save();
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
        ctx.globalAlpha = noiseOpacity / 100;
        const pattern = ctx.createPattern(noiseImage, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
    }
    
    // 3. Draw Fine Grain (Overlay)
    if (fineGrainOpacity > 0 && fineGrainImage) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = fineGrainOpacity / 100;
        const pattern = ctx.createPattern(fineGrainImage, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
    }

    // 4. Vignette
    if (vignetteIntensity > 0) {
        ctx.save();
        const maxRadius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2));
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, maxRadius * 1.2
        );
        const opacity = vignetteIntensity / 100;
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
};

export const generateImage = async (
  hue: number,
  sat: number,
  lum: number,
  hueB: number,
  satB: number,
  lumB: number,
  gradientType: 'none' | 'linear' | 'radial',
  gradientAngle: number,
  noiseOpacity: number,
  fineGrainOpacity: number,
  smudgeActive: boolean,
  smudgeFactor: number,
  noiseBlend: GlobalCompositeOperation,
  noiseType: NoiseType,
  noiseFrequency: number,
  noiseOctaves: number,
  vignetteIntensity: number,
  sizeKey: DownloadSize,
  bgImage?: string | null
): Promise<string> => {
  const { width, height } = DOWNLOAD_SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Load Coarse Noise
  let noiseImgObj: HTMLImageElement | null = null;
  if (noiseOpacity > 0) {
      noiseImgObj = new Image();
      await new Promise<void>((resolve, reject) => {
          if (!noiseImgObj) return resolve();
          noiseImgObj.onload = () => resolve();
          noiseImgObj.onerror = reject;
          noiseImgObj.src = getNoiseSvgDataUri(noiseType, noiseFrequency, noiseOctaves);
      });
  }

  // Load Fine Grain Noise
  let fineImgObj: HTMLImageElement | null = null;
  if (fineGrainOpacity > 0) {
      fineImgObj = new Image();
      await new Promise<void>((resolve, reject) => {
          if (!fineImgObj) return resolve();
          fineImgObj.onload = () => resolve();
          fineImgObj.onerror = reject;
          fineImgObj.src = getNoiseSvgDataUri('fractalNoise', 2.5, 4);
      });
  }

  let bgImgObj: HTMLImageElement | null = null;
  if (bgImage) {
      bgImgObj = new Image();
      await new Promise<void>((resolve) => {
           if (!bgImgObj) return resolve();
           bgImgObj.onload = () => resolve();
           bgImgObj.src = bgImage;
      });
  }

  renderChromaFrame(
      ctx, width, height, 
      hue, sat, lum, hueB, satB, lumB, 
      gradientType, gradientAngle, 
      noiseOpacity, fineGrainOpacity, 
      smudgeActive, smudgeFactor,
      noiseBlend, vignetteIntensity, 
      noiseImgObj, fineImgObj, bgImgObj
  );

  return canvas.toDataURL('image/png');
};

function createLinearGradient(ctx: CanvasRenderingContext2D, width: number, height: number, angle: number, colorA: string, colorB: string) {
    const angleRad = (angle - 90) * (Math.PI / 180);
    const halfDiagonal = Math.sqrt((width/2)**2 + (height/2)**2);
    
    const x0 = width/2 - Math.cos(angleRad) * halfDiagonal;
    const y0 = height/2 - Math.sin(angleRad) * halfDiagonal;
    const x1 = width/2 + Math.cos(angleRad) * halfDiagonal;
    const y1 = height/2 + Math.sin(angleRad) * halfDiagonal;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    return grad;
}

// ==========================================
// --- FLUX ENGINE V3 ---
// ==========================================

const drawPsychedelicField = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hue: number,
    spectra: number,
    seed: number
) => {
    const rng = mulberry32(seed);

    const angle = (rng() * 360) * (Math.PI / 180);
    const diag = Math.sqrt(width*width + height*height);
    const cx = width/2;
    const cy = height/2;
    const x0 = cx - Math.cos(angle) * diag * 0.5;
    const y0 = cy - Math.sin(angle) * diag * 0.5;
    const x1 = cx + Math.cos(angle) * diag * 0.5;
    const y1 = cy + Math.sin(angle) * diag * 0.5;

    const grd = ctx.createLinearGradient(x0, y0, x1, y1);
    const spread = 60 + (spectra / 100) * 120;
    grd.addColorStop(0, `hsl(${hue}, 100%, 40%)`);
    grd.addColorStop(0.3, `hsl(${(hue + spread) % 360}, 100%, 50%)`);
    grd.addColorStop(0.7, `hsl(${(hue - spread + 360) % 360}, 100%, 50%)`);
    grd.addColorStop(1, `hsl(${hue}, 100%, 40%)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'hard-light';
    const numOrbs = 6 + Math.floor(rng() * 4);
    for(let i=0; i<numOrbs; i++) {
        const x = rng() * width;
        const y = rng() * height;
        const r = (0.3 + rng() * 0.5) * Math.min(width, height);
        const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
        const orbHue = (hue + rng() * 180) % 360;
        blob.addColorStop(0, `hsla(${orbHue}, 100%, 60%, 0.4)`);
        blob.addColorStop(1, 'transparent');
        ctx.fillStyle = blob;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
};

// --- EFFECT RENDERERS ---

const renderLiquidWave = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number, seed: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const output = ctx.createImageData(width, height);
    const d = imageData.data; const o = output.data;
    const ampX = (distortion/100)*80; const ampY = (distortion/100)*40;
    const freqX = 0.005+(scale/100)*0.03; const freqY = 0.005+(scale/100)*0.05;
    const phase = seed*0.1; const split = Math.floor((distortion/100)*30);
    for (let y=0; y<height; y++) {
        const xShift = Math.sin(y*freqX+phase)*ampX;
        for (let x=0; x<width; x++) {
            const yShift = Math.cos(x*freqY+phase)*ampY;
            let sx = x+xShift; let sy = y+yShift;
            let rx = Math.floor(sx-split); let ry = Math.floor(sy);
            let gx = Math.floor(sx); let gy = Math.floor(sy);
            let bx = Math.floor(sx+split); let by = Math.floor(sy);
            const getIdx = (xx:number,yy:number) => {
                if(xx<0) xx=-xx; if(xx>=width) xx=width-(xx%width)-1;
                if(yy<0) yy=-yy; if(yy>=height) yy=height-(yy%height)-1;
                return (Math.floor(yy)*width+Math.floor(xx))*4;
            };
            const destIdx = (y*width+x)*4;
            o[destIdx] = d[getIdx(rx,ry)]; o[destIdx+1] = d[getIdx(gx,gy)+1];
            o[destIdx+2] = d[getIdx(bx,by)+2]; o[destIdx+3] = 255;
        }
    }
    ctx.putImageData(output, 0, 0);
};

const renderLinearPrism = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, spectra: number, seed: number) => {
    const temp = document.createElement('canvas'); temp.width=width; temp.height=height;
    temp.getContext('2d')?.drawImage(ctx.canvas,0,0);
    ctx.fillStyle='#000'; ctx.fillRect(0,0,width,height); ctx.globalCompositeOperation='screen';
    const shift=(distortion/100)*50; const base=seed*0.1;
    const rA=base; const bA=base+Math.PI+(spectra/100)*Math.PI;
    const rDx=Math.cos(rA)*shift; const rDy=Math.sin(rA)*shift;
    const bDx=Math.cos(bA)*shift; const bDy=Math.sin(bA)*shift;
    ctx.save(); ctx.translate(rDx,rDy); ctx.drawImage(temp,0,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='#f00'; ctx.fillRect(-width,-height,width*3,height*3); ctx.restore();
    ctx.globalCompositeOperation='screen'; ctx.drawImage(temp,0,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='#0f0'; ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation='screen'; ctx.save(); ctx.translate(bDx,bDy); ctx.drawImage(temp,0,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='#00f'; ctx.fillRect(-width,-height,width*3,height*3); ctx.restore();
    ctx.globalCompositeOperation='source-over';
};

const renderDataMosh = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, seed: number) => {
    const channelShift = Math.floor((distortion/100)*40);
    if (channelShift > 0) {
        const temp = document.createElement('canvas'); temp.width=width; temp.height=height;
        temp.getContext('2d')?.drawImage(ctx.canvas, 0, 0);
        ctx.globalCompositeOperation='screen'; ctx.fillStyle='black'; ctx.fillRect(0,0,width,height);
        ctx.drawImage(temp,-channelShift,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='red'; ctx.fillRect(0,0,width,height); ctx.globalCompositeOperation='screen';
        ctx.drawImage(temp,channelShift,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='blue'; ctx.fillRect(0,0,width,height); ctx.globalCompositeOperation='screen';
        ctx.drawImage(temp,0,0); ctx.globalCompositeOperation='multiply'; ctx.fillStyle='lime'; ctx.fillRect(0,0,width,height); ctx.globalCompositeOperation='source-over';
    }
    if (distortion > 5) {
        const num = 5+Math.floor((distortion/100)*30); const rng = mulberry32(seed);
        for(let i=0;i<num;i++){
            const h=5+rng()*100; const y=rng()*(height-h); const xOff=(rng()-0.5)*(width*0.4)*(distortion/80);
            const slice=ctx.getImageData(0,y,width,h);
            if(rng()>0.8){ctx.fillStyle='black';ctx.fillRect(0,y,width,h);}
            const sc=document.createElement('canvas'); sc.width=width; sc.height=h; sc.getContext('2d')?.putImageData(slice,0,0);
            ctx.drawImage(sc,xOff,y);
            if(rng()>0.9){ctx.save();ctx.globalCompositeOperation='difference';ctx.fillStyle='white';ctx.fillRect(0,y,width,h);ctx.restore();}
        }
    }
};

const renderFluidDisplacement = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number, seed: number) => {
    const imageData=ctx.getImageData(0,0,width,height); const output=ctx.createImageData(width,height);
    const d=imageData.data; const o=output.data;
    const str=(distortion/100)*150; const zoom=0.001+(scale/100)*0.005;
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            const n1=noise(x*zoom,y*zoom,seed); const n2=noise(x*zoom+100,y*zoom+100,seed);
            let sx=Math.floor(x+n1*str); let sy=Math.floor(y+n2*str);
            if(sx<0)sx=0;if(sx>=width)sx=width-1;if(sy<0)sy=0;if(sy>=height)sy=height-1;
            const si=(sy*width+sx)*4; const di=(y*width+x)*4;
            o[di]=d[si];o[di+1]=d[si+1];o[di+2]=d[si+2];o[di+3]=255;
        }
    }
    ctx.putImageData(output,0,0);
};

const renderLinearMoire = (ctx: CanvasRenderingContext2D, width: number, height: number, hue: number, distortion: number, scale: number, seed: number) => {
    ctx.globalCompositeOperation='difference';
    const den=Math.max(3,30-(scale/100)*25);
    const p1=document.createElement('canvas'); p1.width=den*2; p1.height=den*2;
    const p1c=p1.getContext('2d'); if(p1c){p1c.fillStyle=`hsl(${hue},100%,50%)`;p1c.fillRect(0,0,den,den*2);}
    const pat1=ctx.createPattern(p1,'repeat'); if(pat1){ctx.fillStyle=pat1;ctx.fillRect(0,0,width,height);}
    const off=(distortion/100)*den; const ang=(distortion/100)*0.1;
    ctx.save(); ctx.translate(width/2,height/2); ctx.rotate(ang); ctx.translate(-width/2,-height/2); ctx.translate(off,0);
    const p2=document.createElement('canvas'); p2.width=den*2; p2.height=den*2;
    const p2c=p2.getContext('2d'); if(p2c){p2c.fillStyle=`hsl(${(hue+180)%360},100%,50%)`;p2c.fillRect(0,0,den,den*2);}
    const pat2=ctx.createPattern(p2,'repeat'); if(pat2){ctx.fillStyle=pat2;ctx.fillRect(-width,-height,width*3,height*3);}
    ctx.restore(); ctx.globalCompositeOperation='source-over';
};

const renderGlassRefraction = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number, seed: number) => {
    const imageData=ctx.getImageData(0,0,width,height); const output=ctx.createImageData(width,height);
    const d=imageData.data; const o=output.data;
    const str=(distortion/100)*50; const freq=0.005+(scale/100)*0.02; const time=seed*0.1;
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            const nX=noise(x*freq,y*freq,time); const nY=noise(x*freq+100,y*freq+100,time);
            let sx=Math.floor(x+nX*str); let sy=Math.floor(y+nY*str);
            if(sx<0)sx=0;if(sx>=width)sx=width-1;if(sy<0)sy=0;if(sy>=height)sy=height-1;
            const si=(sy*width+sx)*4; const di=(y*width+x)*4;
            o[di]=d[si];o[di+1]=d[si+1];o[di+2]=d[si+2];o[di+3]=255;
        }
    }
    ctx.putImageData(output,0,0);
};

// --- NEW RENDERERS (V2) ---

const renderKaleidoscope = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number) => {
    // 1. Capture current state
    const temp = document.createElement('canvas'); 
    temp.width = width; temp.height = height;
    temp.getContext('2d')?.drawImage(ctx.canvas, 0, 0);

    // 2. Clear and prepare kaleidoscope
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const segments = 4 + Math.floor((scale / 100) * 12);
    const angleStep = (Math.PI * 2) / segments;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);
    const rotOffset = (distortion / 100) * Math.PI;

    for (let i = 0; i < segments; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * angleStep + rotOffset);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -angleStep / 2 - 0.01, angleStep / 2 + 0.01);
        ctx.closePath();
        ctx.clip();
        
        // Mirror every other segment
        if (i % 2 === 1) {
            ctx.scale(-1, 1);
        }
        
        // Draw the source image into the wedge
        // We offset it so the center of image matches center of kaleidoscope
        ctx.rotate(-Math.PI / 2); // Orient image upwards
        ctx.translate(-cx, -cy);
        ctx.drawImage(temp, 0, 0);
        
        ctx.restore();
    }
};

const renderPixelate = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number) => {
    const blockSize = Math.max(4, 4 + ((100 - scale) / 100) * 40 + (distortion / 100) * 20);
    const w = Math.ceil(width / blockSize);
    const h = Math.ceil(height / blockSize);
    
    // Create tiny canvas
    const temp = document.createElement('canvas');
    temp.width = w; temp.height = h;
    const tCtx = temp.getContext('2d');
    
    if (tCtx) {
        tCtx.imageSmoothingEnabled = false;
        tCtx.drawImage(ctx.canvas, 0, 0, w, h);
        
        // Draw back scaled up
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(temp, 0, 0, width, height);
        ctx.imageSmoothingEnabled = true; // reset
    }
};

const renderScanline = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number) => {
    const lineSize = Math.max(2, Math.floor(2 + (scale / 100) * 6));
    const intensity = 0.2 + (distortion / 100) * 0.6;
    
    // Create scanline pattern
    const temp = document.createElement('canvas');
    temp.width = 1; temp.height = lineSize * 2;
    const tCtx = temp.getContext('2d');
    if (tCtx) {
        tCtx.fillStyle = 'rgba(0,0,0,0)';
        tCtx.fillRect(0,0,1,lineSize);
        tCtx.fillStyle = `rgba(0,0,0,${intensity})`;
        tCtx.fillRect(0, lineSize, 1, lineSize);
    }
    
    // RGB Shift (Chromatic Aberration) based on distortion
    if (distortion > 10) {
        const shift = (distortion / 100) * 10;
        const copy = document.createElement('canvas'); copy.width = width; copy.height = height;
        copy.getContext('2d')?.drawImage(ctx.canvas, 0, 0);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'black'; ctx.fillRect(0,0,width,height);
        
        ctx.drawImage(copy, -shift, 0);
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#f00'; ctx.fillRect(0,0,width,height);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(copy, 0, 0);
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#0f0'; ctx.fillRect(0,0,width,height);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(copy, shift, 0);
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#00f'; ctx.fillRect(0,0,width,height);
        
        ctx.globalCompositeOperation = 'source-over';
    }

    const pat = ctx.createPattern(temp, 'repeat');
    if (pat) {
        ctx.fillStyle = pat;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0,0,width,height);
        ctx.globalCompositeOperation = 'source-over';
    }
};

const renderVortex = (ctx: CanvasRenderingContext2D, width: number, height: number, distortion: number, scale: number) => {
    // This is a heavy pixel effect, optimized by doing it on a slightly smaller buffer if distortion is high?
    // No, keep full res for quality, but be warned of perf.
    
    // To save CPU, if distortion is low, skip
    if (distortion < 5) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const output = ctx.createImageData(width, height);
    const d = imageData.data;
    const o = output.data;
    
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2;
    const strength = (distortion / 100) * 10; // Twist amount
    const zoom = 1 - (scale / 100) * 0.5;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Only twist inside radius-ish area to save math? No, twist everything.
            // Angle change decreases with distance from center? Or increases?
            // Standard swirl: angle += strength * (1 - dist/radius)
            
            let angle = Math.atan2(dy, dx);
            const r = dist * zoom; // Zoom effect
            
            // Twist
            const delta = strength * (1 - Math.min(1, dist / radius));
            angle += delta;
            
            const sx = cx + Math.cos(angle) * r;
            const sy = cy + Math.sin(angle) * r;
            
            // Sample
            const isx = Math.floor(sx);
            const isy = Math.floor(sy);
            
            let idx = (y * width + x) * 4;
            
            if (isx >= 0 && isx < width && isy >= 0 && isy < height) {
                const sIdx = (isy * width + isx) * 4;
                o[idx] = d[sIdx];
                o[idx+1] = d[sIdx+1];
                o[idx+2] = d[sIdx+2];
                o[idx+3] = 255;
            } else {
                o[idx] = 0; o[idx+1] = 0; o[idx+2] = 0; o[idx+3] = 255;
            }
        }
    }
    ctx.putImageData(output, 0, 0);
};


export const renderFluxToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hue: number,
    spectra: number,
    exposure: number,
    distortion: number,
    scale: number,
    seed: number,
    pattern: FluxPattern,
    smudgeActive: boolean,
    smudgeFactor: number
) => {
    // 1. Generate Base Plasma Field (Source)
    drawPsychedelicField(ctx, width, height, hue, spectra, seed);

    // 2. Apply High-Fidelity Cartesian Effects
    switch (pattern) {
        case 'wave': renderLiquidWave(ctx, width, height, distortion, scale, seed); break;
        case 'prism': renderLinearPrism(ctx, width, height, distortion, spectra, seed); break;
        case 'glitch': renderDataMosh(ctx, width, height, distortion, seed); break;
        case 'turbulence': renderFluidDisplacement(ctx, width, height, distortion, scale, seed); break;
        case 'interference': renderLinearMoire(ctx, width, height, hue, distortion, scale, seed); break;
        case 'ripple': renderGlassRefraction(ctx, width, height, distortion, scale, seed); break;
        case 'kaleido': renderKaleidoscope(ctx, width, height, distortion, scale); break;
        case 'pixelate': renderPixelate(ctx, width, height, distortion, scale); break;
        case 'scanline': renderScanline(ctx, width, height, distortion, scale); break;
        case 'vortex': renderVortex(ctx, width, height, distortion, scale); break;
    }

    // 3. Apply Smudge (Blur) - Covers affected canvas
    if (smudgeActive && smudgeFactor > 0) {
        const temp = document.createElement('canvas');
        temp.width = width; temp.height = height;
        temp.getContext('2d')?.drawImage(ctx.canvas, 0, 0);
        
        ctx.save();
        const blurPx = (smudgeFactor / 100) * 40;
        ctx.filter = `blur(${blurPx}px)`;
        ctx.drawImage(temp, 0, 0);
        ctx.filter = 'none';
        ctx.restore();
    }
    
    // 4. Global Film Processing (Exposure / Grain)
    if (exposure !== 50) { 
        ctx.fillStyle = exposure > 50 ? `rgba(255,255,255, ${(exposure-50)/150})` : `rgba(0,0,0, ${(50-exposure)/100})`;
        ctx.globalCompositeOperation = exposure > 50 ? 'soft-light' : 'multiply';
        ctx.fillRect(0,0,width,height);
        ctx.globalCompositeOperation = 'source-over';
    }
};

export const generateFluxImage = async (
  hue: number,
  spectra: number,
  exposure: number,
  distortion: number,
  grain: number,
  fineGrain: number,
  scale: number,
  sizeKey: DownloadSize,
  pattern: FluxPattern,
  smudgeActive: boolean,
  smudgeFactor: number,
  seed: number = 0 
): Promise<string> => {
  const { width, height } = DOWNLOAD_SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Render Pattern
  renderFluxToCanvas(ctx, width, height, hue, spectra, exposure, distortion, scale, seed, pattern, smudgeActive, smudgeFactor);

  // 2. Apply Coarse Grain
  if (grain > 0) {
    const frequency = 0.5 + (scale / 100); 
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay'; 
        ctx.globalAlpha = (grain / 100) * 0.8; 
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height); }
        ctx.restore();
        resolve();
      };
      img.src = getNoiseSvgDataUri('fractalNoise', frequency, 3); 
    });
  }

  // 3. Apply Fine Grain
  if (fineGrain > 0) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay'; 
        ctx.globalAlpha = (fineGrain / 100) * 0.5; 
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height); }
        ctx.restore();
        resolve();
      };
      // Higher frequency noise
      img.src = getNoiseSvgDataUri('fractalNoise', 3.0, 4); 
    });
  }

  return canvas.toDataURL('image/png');
};

export const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const recordCanvas = (canvas: HTMLCanvasElement, durationMs: number = 5000): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const stream = canvas.captureStream(60); 
            let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm', videoBitsPerSecond: 8000000 };
            }
            const recorder = new MediaRecorder(stream, options);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                resolve(url);
            };
            recorder.start();
            setTimeout(() => recorder.stop(), durationMs);
        } catch (e) {
            reject(e);
        }
    });
};
