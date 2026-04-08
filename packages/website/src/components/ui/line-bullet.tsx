import * as React from 'react';
import { getSuiteColorVarRefs } from '@/config/theme/css-vars';
import { cn } from '@/lib/utils';
import {
  getLineBulletPreset,
  resolveLineBulletHoverModeHex,
  resolveLineBulletModeHex,
  resolveLineBulletTextModeHex,
  type LineBulletColorRole,
  type LineBulletShape,
  type LineBulletSize,
  type LineBulletTextRole,
  type LineBulletThemeId,
} from '@/lib/line-bullet-theme';

export type { LineBulletShape, LineBulletSize };

export interface LineBulletProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  text?: React.ReactNode;
  bullet?: React.ReactNode;
  theme?: LineBulletThemeId | string;
  preset?: string;
  colorRole?: LineBulletColorRole;
  textRole?: LineBulletTextRole;
  hoverColorRole?: LineBulletColorRole;
  colorOverride?: { light?: string; dark?: string };
  textOverride?: { light?: string; dark?: string };
  hoverColorOverride?: { light?: string; dark?: string };
  invertOnHover?: boolean;
  shape?: LineBulletShape;
  size?: LineBulletSize;
}

const sizeMap = {
  sm: { box: '2rem', text: '1rem' },
  md: { box: '2.5rem', text: '1.25rem' },
  lg: { box: '3rem', text: '1.5rem' },
  xl: { box: '3.5rem', text: '1.75rem' },
} as const;

function isWhiteColor(value: string) {
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return (
    normalized === '#fff' ||
    normalized === '#ffffff' ||
    normalized === 'white' ||
    normalized === 'rgb(255,255,255)'
  );
}

export function LineBullet({
  icon,
  text,
  bullet,
  theme,
  preset,
  colorRole,
  textRole,
  hoverColorRole,
  colorOverride,
  textOverride,
  hoverColorOverride,
  invertOnHover,
  shape,
  size,
  className,
  style,
  ...props
}: LineBulletProps) {
  const presetConfig = getLineBulletPreset(preset);
  const resolvedShape = shape ?? presetConfig.shape ?? 'circle';
  const resolvedSize = size ?? presetConfig.size ?? 'sm';
  const resolvedColorRole =
    colorRole ?? presetConfig.colorRole ?? 'accentColor';
  const resolvedTextRole = textRole ?? presetConfig.textRole ?? 'textColor';
  const resolvedHoverColorRole = hoverColorRole ?? presetConfig.hoverColorRole;
  const resolvedInvertOnHover =
    invertOnHover ?? presetConfig.invertOnHover ?? false;

  const colorHex = theme
    ? resolveLineBulletModeHex(theme, resolvedColorRole, colorOverride)
    : {
        ...getSuiteColorVarRefs(resolvedColorRole),
        ...colorOverride,
      };
  const textHex = theme
    ? resolveLineBulletTextModeHex(theme, resolvedTextRole, textOverride)
    : {
        ...getSuiteColorVarRefs(resolvedTextRole),
        ...textOverride,
      };
  const hoverHex = theme
    ? resolveLineBulletHoverModeHex(
        theme,
        resolvedColorRole,
        resolvedHoverColorRole,
        hoverColorOverride,
      )
    : {
        ...getSuiteColorVarRefs(resolvedHoverColorRole ?? resolvedColorRole),
        ...hoverColorOverride,
      };

  const bulletContent = icon ?? text ?? bullet;
  const s = sizeMap[resolvedSize];
  const baseBulletBg = resolvedInvertOnHover ? '#FFFFFF' : colorHex.light;
  const baseBulletFg = resolvedInvertOnHover ? '#000000' : textHex.light;
  const hoverBulletBg = resolvedInvertOnHover ? hoverHex.light : hoverHex.light;
  const hoverBulletFg = resolvedInvertOnHover ? '#FFFFFF' : textHex.light;
  const darkBaseBulletBg = resolvedInvertOnHover ? '#FFFFFF' : colorHex.dark;
  const darkBaseBulletFg = resolvedInvertOnHover
    ? '#000000'
    : (textHex.dark ??
      (isWhiteColor(darkBaseBulletBg) ? '#000000' : baseBulletFg));
  const darkHoverBulletBg = resolvedInvertOnHover
    ? hoverHex.dark
    : hoverHex.dark;
  const darkHoverBulletFg = resolvedInvertOnHover
    ? '#FFFFFF'
    : (textHex.dark ??
      (isWhiteColor(darkHoverBulletBg) ? '#000000' : hoverBulletFg));
  const bulletLabel =
    typeof bulletContent === 'string' || typeof bulletContent === 'number'
      ? String(bulletContent)
      : 'symbol';

  return (
    <div
      {...props}
      className={cn('relative', className)}
      style={{
        height: s.box,
        ...style,
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center font-bold',
          'select-none overflow-hidden',
          'font-mta',
          'cursor-pointer transition-colors duration-300 ease-out',
          resolvedShape === 'circle' && 'rounded-full',
          resolvedShape === 'triangle' &&
            '[clip-path:polygon(50%_0%,0%_100%,100%_100%)]',
          'bg-[var(--line-bullet-bg)] text-[var(--line-bullet-fg)]',
          'dark:bg-[var(--line-bullet-bg-dark)] dark:text-[var(--line-bullet-fg-dark)]',
          'hover:bg-[var(--line-bullet-bg-hover)] hover:text-[var(--line-bullet-fg-hover)]',
          'dark:hover:bg-[var(--line-bullet-bg-hover-dark)] dark:hover:text-[var(--line-bullet-fg-hover-dark)]',
        )}
        style={{
          ['--line-bullet-bg' as string]: baseBulletBg,
          ['--line-bullet-fg' as string]: isWhiteColor(baseBulletBg)
            ? '#000000'
            : baseBulletFg,
          ['--line-bullet-bg-hover' as string]: hoverBulletBg,
          ['--line-bullet-fg-hover' as string]: isWhiteColor(hoverBulletBg)
            ? '#000000'
            : hoverBulletFg,
          ['--line-bullet-bg-dark' as string]: darkBaseBulletBg,
          ['--line-bullet-fg-dark' as string]: darkBaseBulletFg,
          ['--line-bullet-bg-hover-dark' as string]: darkHoverBulletBg,
          ['--line-bullet-fg-hover-dark' as string]: darkHoverBulletFg,
          minWidth: s.box,
          height: s.box,
          fontSize: s.text,
          padding: resolvedShape === 'triangle' ? '0' : '0 0.25rem',
          transform:
            resolvedShape === 'diamond'
              ? 'rotate(45deg) scale(0.707107)'
              : undefined,
        }}
        aria-label={`Route ${bulletLabel}`}
      >
        <span
          style={{
            lineHeight: '0',
            transform:
              resolvedShape === 'diamond'
                ? 'rotate(-45deg) translateY(0.02rem)'
                : resolvedShape === 'triangle'
                  ? 'translateY(0.1rem)'
                  : undefined,
          }}
        >
          {bulletContent}
        </span>
      </div>
    </div>
  );
}
