export function hexToRgb(hex: string) {
  const normalizedHex = hex.replace('#', '');
  return {
    r: parseInt(normalizedHex.slice(0, 2), 16),
    g: parseInt(normalizedHex.slice(2, 4), 16),
    b: parseInt(normalizedHex.slice(4, 6), 16),
  };
}

export function hexAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixHex(firstHex: string, secondHex: string, weight: number) {
  const firstRgb = hexToRgb(firstHex);
  const secondRgb = hexToRgb(secondHex);
  const clampedWeight = Math.max(0, Math.min(1, weight));
  const toHex = (value: number) =>
    Math.round(value).toString(16).padStart(2, '0');

  const red = firstRgb.r + (secondRgb.r - firstRgb.r) * clampedWeight;
  const green = firstRgb.g + (secondRgb.g - firstRgb.g) * clampedWeight;
  const blue = firstRgb.b + (secondRgb.b - firstRgb.b) * clampedWeight;

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}
