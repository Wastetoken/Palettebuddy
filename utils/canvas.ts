
export const DOWNLOAD_SIZES = {
  '4K': { width: 3840, height: 2160, label: '4K WALLPAPER' },
  '1080P': { width: 1920, height: 1080, label: '1080P DESKTOP' },
  'MOBILE': { width: 1080, height: 1920, label: 'MOBILE PORTRAIT' },
  'SQUARE': { width: 2048, height: 2048, label: 'INSTAGRAM SQUARE' },
};

export type DownloadSize = keyof typeof DOWNLOAD_SIZES;

const NOISE_SVG_DATA_URI = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E";

export const generateImage = async (
  hue: number,
  sat: number,
  lum: number,
  noiseOpacity: number, // 0-100
  noiseBlend: GlobalCompositeOperation,
  vignetteIntensity: number, // 0-100
  sizeKey: DownloadSize
): Promise<string> => {
  const { width, height } = DOWNLOAD_SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Fill Background
  const hslColor = `hsl(${hue}, ${sat}%, ${lum}%)`;
  ctx.fillStyle = hslColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Noise
  if (noiseOpacity > 0) {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = noiseBlend;
        ctx.globalAlpha = noiseOpacity / 100;
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
        resolve();
      };
      img.onerror = reject;
      img.src = NOISE_SVG_DATA_URI;
    });
  }

  // 3. Draw Vignette
  if (vignetteIntensity > 0) {
    ctx.save();
    // Radial gradient from center
    // Standard vignette: transparent center to black corners
    // To match CSS: radial-gradient(circle, transparent 0%, black 150%) 
    // but adjusting for intensity.
    
    const maxRadius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2));
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, maxRadius * 1.2
    );

    // Intensity controls the opacity of the black outer edge
    const opacity = vignetteIntensity / 100;
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0)'); // Keep center clear
    gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 4. Return Data URL
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
