'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import type { NavItem } from '@/lib/site-map';
import { PVL_ONE_URL } from '@/content/site-map';

function isActive(pathname: string, path: string): boolean {
  const normal = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return path === '/' ? normal === '/' : normal.startsWith(path);
}

function Submenu({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  const active = isActive(pathname, item.page.path);
  return (
    <li ref={ref} className="relative">
      <div className="flex items-stretch">
        <Link
          href={item.page.path}
          aria-current={pathname === item.page.path ? 'page' : undefined}
          className={`flex min-h-11 items-center px-3 hover:underline ${active ? 'decoration-railway-green-600 font-semibold underline decoration-2 underline-offset-4' : ''}`}
        >
          {item.page.label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="hover:bg-railway-blue-700 flex min-h-11 min-w-11 items-center justify-center"
        >
          <span className="sr-only">{`${item.page.label} submenu`}</span>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={open ? 'rotate-180' : ''}
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <ul
        id={id}
        hidden={!open}
        className="bg-railway-blue-950 z-20 min-w-64 py-1 lg:absolute lg:top-full lg:left-0 lg:shadow-lg"
      >
        {item.children.map((child) => (
          <li key={child.id}>
            <Link
              href={child.path}
              aria-current={pathname === child.path ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className="hover:bg-railway-blue-700 flex min-h-11 items-center px-4 hover:underline lg:px-4"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function SiteHeader({ navigation }: { navigation: NavItem[] }) {
  const pathname = usePathname() ?? '/';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-railway-blue-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex min-h-11 items-center text-lg font-bold tracking-tight">
          SDG Railway
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={PVL_ONE_URL}
            rel="noopener noreferrer"
            target="_blank"
            className="hidden min-h-11 items-center px-3 text-sm underline-offset-4 hover:underline sm:flex"
          >
            Access PVL.ONE<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((o) => !o)}
            className="min-h-11 min-w-11 rounded border border-white/40 px-3 lg:hidden"
          >
            Menu
          </button>
        </div>
      </div>
      <nav
        id="main-navigation"
        aria-label="Main"
        className={`${menuOpen ? 'block' : 'hidden'} border-t border-white/15 lg:block`}
      >
        <ul className="mx-auto flex max-w-6xl flex-col px-2 lg:flex-row lg:flex-wrap">
          {navigation.map((item) =>
            item.children.length > 0 ? (
              <Submenu key={item.page.id} item={item} pathname={pathname} />
            ) : (
              <li key={item.page.id}>
                <Link
                  href={item.page.path}
                  aria-current={pathname === item.page.path ? 'page' : undefined}
                  className={`flex min-h-11 items-center px-3 hover:underline ${isActive(pathname, item.page.path) ? 'decoration-railway-green-600 font-semibold underline decoration-2 underline-offset-4' : ''}`}
                >
                  {item.page.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
    </header>
  );
}
