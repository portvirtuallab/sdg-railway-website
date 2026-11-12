'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PVL_ONE_URL } from '@/content/site-map';
import { asset } from '@/lib/asset';
import type { NavItem } from '@/lib/site-map';

function normalise(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function isActive(pathname: string, path: string): boolean {
  const p = normalise(pathname);
  return path === '/' ? p === '/' : p.startsWith(path);
}

const linkBase =
  'flex min-h-11 items-center rounded-md px-3 text-[0.95rem] font-medium text-railway-blue-900 transition-colors hover:bg-railway-blue-100';

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
          aria-current={normalise(pathname) === item.page.path ? 'page' : undefined}
          className={`${linkBase} pr-1 ${active ? 'text-railway-green-700' : ''}`}
        >
          {item.page.label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="text-railway-blue-900 hover:bg-railway-blue-100 flex min-h-11 min-w-11 items-center justify-center rounded-md"
        >
          <span className="sr-only">{`${item.page.label} submenu`}</span>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <ul
        id={id}
        hidden={!open}
        className="border-railway-green-600 z-30 mb-2 ml-3 border-l-2 pl-2 lg:absolute lg:top-full lg:left-0 lg:mb-0 lg:ml-0 lg:min-w-72 lg:rounded-xl lg:border lg:border-neutral-200 lg:bg-white lg:p-2 lg:shadow-xl"
      >
        {item.children.map((child) => (
          <li key={child.id}>
            <Link
              href={child.path}
              aria-current={normalise(pathname) === child.path ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`${linkBase} w-full`}
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
  // Close the mobile menu after navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  const items = navigation.filter((n) => n.page.id !== 'request-a-quotation');
  const quote = navigation.find((n) => n.page.id === 'request-a-quotation');

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center"
          aria-label="SDG Railway – home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img
            src={asset('/images/source/IMG-015.webp')}
            alt=""
            width={719}
            height={527}
            className="h-12 w-auto"
          />
        </Link>

        <nav
          id="main-navigation"
          aria-label="Main"
          className={`${menuOpen ? 'block' : 'hidden'} absolute inset-x-0 top-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-neutral-200 bg-white px-2 pb-4 shadow-lg lg:static lg:block lg:max-h-none lg:overflow-visible lg:border-0 lg:p-0 lg:shadow-none`}
        >
          <ul className="flex flex-col lg:flex-row lg:items-center lg:gap-0.5">
            {items.map((item) =>
              item.children.length > 0 ? (
                <Submenu key={item.page.id} item={item} pathname={pathname} />
              ) : (
                <li key={item.page.id}>
                  <Link
                    href={item.page.path}
                    aria-current={normalise(pathname) === item.page.path ? 'page' : undefined}
                    className={`${linkBase} ${isActive(pathname, item.page.path) ? 'text-railway-green-700' : ''}`}
                  >
                    {item.page.label}
                  </Link>
                </li>
              ),
            )}
            {quote && (
              <li className="mt-2 px-1 lg:hidden">
                <Link
                  href={quote.page.path}
                  className="bg-railway-green-700 flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold text-white"
                >
                  {quote.page.label}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={PVL_ONE_URL}
            rel="noopener noreferrer"
            target="_blank"
            className="text-railway-blue-700 hidden min-h-11 items-center gap-1 px-2 text-sm font-semibold hover:underline xl:flex"
          >
            PVL.ONE <Icon name="external" className="size-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {quote && (
            <Link
              href={quote.page.path}
              aria-current={normalise(pathname) === quote.page.path ? 'page' : undefined}
              className="bg-railway-green-700 hover:bg-railway-green-800 hidden min-h-11 items-center gap-2 rounded-lg px-4 font-semibold text-white shadow-sm transition-colors sm:flex"
            >
              <Icon name="quote" className="size-4" />
              {quote.page.label}
            </Link>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((o) => !o)}
            className="text-railway-blue-900 flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 font-semibold lg:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
