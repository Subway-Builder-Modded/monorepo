import * as React from 'react';
import type { MDXComponents } from 'mdx/types';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { AppIcon } from '@/components/shared/app-icon';
import { resolveAppIcon, type AppIconInput } from '@/lib/icons';

type MdxIconProps = Omit<React.ComponentProps<typeof AppIcon>, 'icon'> & {
  name?: string;
  icon?: AppIconInput;
  fallback?: React.ReactNode;
};

function warnInvalidIconName(name: string) {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[MDX Icon] Unknown icon "${name}".`);
}

export function MdxIcon({
  name,
  icon,
  fallback = <span aria-hidden="true" className="inline-block size-[1em]" />,
  className,
  style,
}: MdxIconProps) {
  const iconInput = icon ?? name;
  const resolved = resolveAppIcon(iconInput);

  if (!resolved) {
    if (typeof iconInput === 'string' && iconInput.trim()) {
      warnInvalidIconName(iconInput);
    }
    return <>{fallback}</>;
  }

  return <AppIcon icon={resolved} className={className} style={style} />;
}

export const mdxLucideComponents: MDXComponents = Object.fromEntries(
  Object.entries(LucideIcons)
    .filter(([name, component]) => /^[A-Z]/.test(name) && component)
    .map(([name, icon]) => {
      const Icon = icon as LucideIcon;

      const InlineLucideIcon = ({
        className,
        size = '1em',
        ...props
      }: LucideProps) => (
        <Icon
          aria-hidden="true"
          className={`inline-block align-[-0.125em] ${className ?? ''}`.trim()}
          size={size}
          {...props}
        />
      );

      InlineLucideIcon.displayName = `${name}Inline`;
      return [name, InlineLucideIcon];
    }),
);

export const mdxIconComponents: MDXComponents = {
  Icon: MdxIcon,
  SiteIcon: MdxIcon,
};
