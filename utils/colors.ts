export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export const generatePalette = (h: number, s: number, l: number) => {
  return {
    base: `hsl(${h}, ${s}%, ${l}%)`,
    genA: `hsl(${(h + 30) % 360}, ${s}%, ${Math.max(10, l - 20)}%)`, // Analogous Darker
    genB: `hsl(${(h + 180) % 360}, ${Math.max(0, s - 20)}%, ${Math.min(90, l + 20)}%)`, // Complementary Desaturated
    accent: `hsl(${(h - 30) % 360}, 100%, 60%)`, // Split Analogous Vivid
  };
};