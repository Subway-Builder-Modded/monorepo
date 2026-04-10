import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { LucideProps } from 'lucide-react';
import { cn } from '@subway-builder-modded/shared-ui';
import {
  isImageIcon,
  isLucideIcon,
  isMaskIcon,
  resolveAppIcon,
  type AppIconInput,
} from '@/lib/icons';

type AppIconProps = {
  icon?: AppIconInput;
  className?: string;
  style?: CSSProperties;
  size?: number | string;
  decorative?: boolean;
  label?: string;
  title?: string;
  lucideProps?: Omit<LucideProps, 'className' | 'style' | 'size'>;
};

function iconSizeStyle(size: number | string | undefined) {
  if (size === undefined) return undefined;
  return {
    width: size,
    height: size,
  } satisfies CSSProperties;
}

export function AppIcon({
  icon,
  className,
  style,
  size,
  decorative = true,
  label,
  title,
  lucideProps,
}: AppIconProps) {
  const resolvedIcon = resolveAppIcon(icon);
  if (!resolvedIcon) return null;
  const sizeStyle = iconSizeStyle(size);
  const ariaLabel = decorative ? undefined : label;
  const commonStyle = {
    ...sizeStyle,
    ...style,
  };
  const commonClassName = cn('inline-block size-5 align-middle', className);

  if (isMaskIcon(resolvedIcon)) {
    return (
      <span
        aria-hidden={decorative}
        aria-label={ariaLabel}
        role={decorative ? undefined : 'img'}
        title={title}
        className={cn(commonClassName, 'bg-current')}
        style={{
          WebkitMask: `url(${resolvedIcon.src}) center / contain no-repeat`,
          mask: `url(${resolvedIcon.src}) center / contain no-repeat`,
          ...commonStyle,
        }}
      />
    );
  }

  if (isImageIcon(resolvedIcon)) {
    return (
      <Image
        src={resolvedIcon.src}
        alt={decorative ? '' : (ariaLabel ?? title ?? '')}
        aria-hidden={decorative}
        width={20}
        height={20}
        title={title}
        className={cn(commonClassName, 'object-contain')}
        style={commonStyle}
      />
    );
  }

  if (!isLucideIcon(resolvedIcon)) return null;

  const Icon = resolvedIcon;
  return (
    <Icon
      aria-hidden={decorative}
      aria-label={ariaLabel}
      role={decorative ? undefined : 'img'}
      className={commonClassName}
      style={commonStyle}
      size={size}
      {...lucideProps}
    />
  );
}
