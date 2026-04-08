import { Slot } from 'radix-ui';
import * as React from 'react';

import {
  buttonVariants,
  type ButtonStyleProps,
  type ButtonVariant,
} from '@sbm/shared/ui/button-variants';
import { cn } from '../../lib/utils';

type ButtonIntent =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'plain'
  | 'danger'
  | 'link';

type ButtonSize = NonNullable<ButtonStyleProps['size']>;

export interface ButtonProps
  extends React.ComponentProps<'button'>, Omit<ButtonStyleProps, 'size'> {
  asChild?: boolean;
  intent?: ButtonIntent;
  variant?: ButtonVariant;
  size?: ButtonStyleProps['size'] | ButtonSize;
}

const intentToVariant: Record<ButtonIntent, ButtonVariant> = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  plain: 'ghost',
  danger: 'destructive',
  link: 'link',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, intent, variant, size, isCircle, asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button';
    const resolvedVariant =
      variant ?? (intent ? intentToVariant[intent] : undefined);

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={resolvedVariant}
        data-size={size}
        className={cn(
          buttonVariants({ variant: resolvedVariant, size, isCircle }),
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

const buttonStyles = buttonVariants;

export { Button, buttonStyles, buttonVariants };
