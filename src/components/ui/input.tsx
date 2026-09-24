import React from 'react';
import { cn } from '../../lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => <input ref={ref} data-slot="input" type={type} className={cn('ui-input', className)} {...props}/>);
Input.displayName = 'Input';
