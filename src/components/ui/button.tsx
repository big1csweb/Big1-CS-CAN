import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  key?: React.Key;
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-brand-blue text-white shadow hover:bg-brand-blue/90": variant === 'default',
          "border border-white/20 bg-transparent text-slate-300 hover:text-white hover:bg-white/5": variant === 'outline',
          "hover:bg-white/5 hover:text-white text-slate-300": variant === 'ghost',
          "bg-white/10 text-white hover:bg-white/20": variant === 'secondary',
          "bg-red-500 text-white hover:bg-red-500/90": variant === 'destructive',
          "h-9 px-4 py-2": size === 'default',
          "h-8 rounded-md px-3 text-xs": size === 'sm',
          "h-10 rounded-md px-8": size === 'lg',
          "h-9 w-9": size === 'icon',
        },
        className
      )}
      {...props}
    />
  );
}
