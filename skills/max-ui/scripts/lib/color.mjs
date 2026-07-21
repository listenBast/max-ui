export function parseHexColor(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  const match = value.match(/^#([0-9a-f]{3,8})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  if (hex.length !== 6 && hex.length !== 8) return null;
  const alpha = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: alpha
  };
}

function linearChannel(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color) {
  return 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b);
}

export function contrastRatio(foreground, background) {
  if (!foreground || !background || foreground.a < 0.999 || background.a < 0.999) return null;
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function rgbToHsl(color) {
  if (!color) return null;
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta > 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { hue, saturation, lightness };
}

export function colorFamily(color) {
  const hsl = rgbToHsl(color);
  if (!hsl) return 'unknown';
  if (hsl.lightness < 0.04) return 'near-black';
  if (hsl.lightness > 0.94) return 'near-white';
  if (hsl.saturation < 0.08) return hsl.lightness < 0.2 ? 'near-black' : hsl.lightness > 0.88 ? 'near-white' : 'neutral';
  const hue = hsl.hue;
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 200) return 'cyan';
  if (hue < 255) return 'blue';
  if (hue < 295) return 'violet';
  if (hue < 345) return 'magenta';
  return 'red';
}
