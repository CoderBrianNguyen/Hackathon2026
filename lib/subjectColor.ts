interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const DEFAULT_SUBJECT_COLOR = "#4f46e5";

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const parseHexColor = (hex: string): RgbColor | null => {
  const normalized = hex.trim().toLowerCase();
  const fullHex = /^#[0-9a-f]{6}$/.test(normalized)
    ? normalized
    : /^#[0-9a-f]{3}$/.test(normalized)
      ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
      : null;

  if (!fullHex) return null;

  const r = Number.parseInt(fullHex.slice(1, 3), 16);
  const g = Number.parseInt(fullHex.slice(3, 5), 16);
  const b = Number.parseInt(fullHex.slice(5, 7), 16);
  return { r, g, b };
};

const toHex = ({ r, g, b }: RgbColor) =>
  `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;

const mix = (base: RgbColor, target: RgbColor, weight: number): RgbColor => ({
  r: base.r * (1 - weight) + target.r * weight,
  g: base.g * (1 - weight) + target.g * weight,
  b: base.b * (1 - weight) + target.b * weight
});

export const normalizeSubjectColor = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_SUBJECT_COLOR;
  const parsed = parseHexColor(value);
  return parsed ? toHex(parsed) : DEFAULT_SUBJECT_COLOR;
};

export const getSubjectColorTokens = (colorValue: string) => {
  const color = parseHexColor(normalizeSubjectColor(colorValue)) ?? parseHexColor(DEFAULT_SUBJECT_COLOR)!;
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 17, g: 24, b: 39 };

  return {
    tagBg: toHex(mix(color, white, 0.88)),
    tagBorder: toHex(mix(color, white, 0.7)),
    tagText: toHex(mix(color, black, 0.35)),
    sidebarHoverBg: toHex(mix(color, white, 0.92)),
    sidebarHoverText: toHex(mix(color, black, 0.28)),
    sidebarActiveBg: toHex(mix(color, white, 0.84)),
    sidebarActiveBorder: toHex(mix(color, white, 0.62)),
    sidebarActiveText: toHex(mix(color, black, 0.3)),
    badgeBg: toHex(mix(color, white, 0.89)),
    badgeText: toHex(mix(color, black, 0.3))
  };
};
