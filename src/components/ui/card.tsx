import React from 'react';
import { cn } from '../../lib/utils';
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div data-slot="card" className={cn('ui-card', className)} {...props}/>; }
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div data-slot="card-header" className={cn('ui-card-header', className)} {...props}/>; }
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 data-slot="card-title" className={cn('ui-card-title', className)} {...props}/>; }
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p data-slot="card-description" className={cn('muted', className)} {...props}/>; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div data-slot="card-content" className={cn('ui-card-content', className)} {...props}/>; }
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div data-slot="card-footer" className={cn('ui-card-footer', className)} {...props}/>; }
