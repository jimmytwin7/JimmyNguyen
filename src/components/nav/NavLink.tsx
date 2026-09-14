'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NavLink({ href, children, className = '', onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={[
        'transition-colors duration-200',
        isActive
          ? 'font-semibold underline underline-offset-4'
          : 'hover:underline hover:underline-offset-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        isActive
          ? { color: 'var(--color-brand-700)' }
          : undefined
      }
    >
      {children}
    </Link>
  );
}
