import { cva, type VariantProps } from 'class-variance-authority';

type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link';

type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-current',
  ],
  {
    variants: {
      variant: {
        default:
          'rounded-lg border border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'rounded-lg border border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        destructive:
          'rounded-lg border border-transparent bg-[var(--uninstall-primary)] text-[var(--uninstall-foreground)] shadow-xs hover:opacity-90',
        outline:
          'rounded-lg border border-border bg-transparent text-foreground shadow-xs hover:bg-muted/40',
        ghost:
          'rounded-lg border border-transparent bg-transparent text-foreground hover:bg-muted/40',
        link: 'rounded-lg border border-transparent bg-transparent px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: ['h-10 px-4 py-2 text-sm', '[&_svg]:size-4'],
        xs: ['h-8 px-2.5 text-xs', '[&_svg]:size-3.5'],
        sm: ['h-9 px-3 text-sm', '[&_svg]:size-4'],
        md: ['h-10 px-3.5 text-sm', '[&_svg]:size-4'],
        lg: ['h-11 px-5 text-sm', '[&_svg]:size-5'],
        icon: ['size-10 p-0', '[&_svg]:size-4.5'],
        'icon-xs': ['size-8 p-0', '[&_svg]:size-3.5'],
        'icon-sm': ['size-9 p-0', '[&_svg]:size-4'],
        'icon-lg': ['size-11 p-0', '[&_svg]:size-5'],
      },
      isCircle: {
        true: 'rounded-full',
        false: null,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      isCircle: false,
    },
  },
);

type ButtonStyleProps = VariantProps<typeof buttonVariants>;

export { buttonVariants, type ButtonVariant, type ButtonSize, type ButtonStyleProps };
