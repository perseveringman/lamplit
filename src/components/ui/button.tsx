import React from 'react';
import { cn } from '../../lib/utils';
// Locally owned shadcn/ui Button adaptation. The unused polymorphic Slot dependency is omitted.
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}
export function buttonVariants({ variant = 'default', size = 'default' }: Pick<ButtonProps, 'variant' | 'size'> = {}) { return cn('ui-button', `ui-button--${variant}`, size === 'default' ? 'ui-button--size-default' : `ui-button--${size}`); }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => <button type={type} data-slot="button" className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props}/>);
Button.displayName = 'Button';
