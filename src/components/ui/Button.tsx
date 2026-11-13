import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'gradient-brand text-white shadow-[0_14px_34px_-18px_rgba(56,107,255,0.9)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_44px_-18px_rgba(129,87,245,0.9)]',
  secondary:
    'border border-ink/20 bg-ink/[0.03] text-ink hover:border-clay/60 hover:bg-clay/10',
  ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
  inverse:
    'bg-ink text-bone shadow-[0_14px_34px_-20px_rgba(0,0,0,0.9)] hover:-translate-y-0.5 hover:bg-white',
  light: 'border border-ink/25 bg-ink/5 text-ink hover:border-cyan/50 hover:bg-cyan/10',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[12.5px]',
  md: 'h-11 px-5 text-[13.5px]',
  lg: 'h-13 px-7 text-[14px]',
}

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cx(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonStyles(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function ButtonLink({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const classes = buttonStyles(variant, size, className)
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={classes} {...props}>
      {children}
    </a>
  )
}
