import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Icon, type IconName } from '@/components/ui/Icon';
import { imageUrl } from '@/components/ui/Img';
import { getBreadcrumbs } from '@/lib/site-map';
import type { SitePage } from '@/types/site';

/** Inner-page hero: the page's original banner image under a brand overlay. */
export function PageHero({
  page,
  image,
  eyebrow,
  intro,
  children,
}: {
  page: SitePage;
  image: string;
  eyebrow?: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-railway-blue-950 relative isolate overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${imageUrl(image)})` }}
      />
      <div
        aria-hidden="true"
        className="from-railway-blue-950 via-railway-blue-950/85 to-railway-blue-950/30 absolute inset-0 -z-10 bg-linear-to-r"
      />
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-14 sm:pb-20">
        <Breadcrumbs trail={getBreadcrumbs(page)} inverted />
        {eyebrow && (
          <p className="text-railway-green-100 mt-8 text-sm font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1
          className={`${eyebrow ? 'mt-2' : 'mt-8'} max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl`}
        >
          {page.label}
        </h1>
        {intro && <div className="mt-5 max-w-2xl text-lg text-white/90">{intro}</div>}
        {children}
      </div>
      <TrackDivider />
    </section>
  );
}

/** Decorative rail track that closes a dark band. */
export function TrackDivider({ light = false }: { light?: boolean }) {
  return (
    <div aria-hidden="true" className={`h-3 w-full ${light ? 'bg-white' : 'bg-railway-blue-950'}`}>
      <div className="track-ties h-full w-full opacity-60" />
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  tone = 'white',
  children,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: React.ReactNode;
  tone?: 'white' | 'muted' | 'dark';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    white: 'bg-white',
    muted: 'bg-neutral-50',
    dark: 'bg-railway-blue-900 text-white',
  };
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`${tones[tone]} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        {eyebrow && (
          <p
            className={`text-sm font-semibold tracking-[0.18em] uppercase ${tone === 'dark' ? 'text-railway-green-100' : 'text-railway-green-700'}`}
          >
            {eyebrow}
          </p>
        )}
        {title && (
          <h2
            id={headingId}
            className={`mt-2 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl ${tone === 'dark' ? 'text-white' : 'text-railway-blue-900'}`}
          >
            {title}
          </h2>
        )}
        {intro && (
          <div
            className={`mt-4 max-w-3xl text-lg ${tone === 'dark' ? 'text-white/85' : 'text-neutral-600'}`}
          >
            {intro}
          </div>
        )}
        <div className={title || intro ? 'mt-10' : ''}>{children}</div>
      </div>
    </section>
  );
}

/** Labels content that belongs to the simulation scenario rather than real-world operations. */
export function ScenarioBadge({ children = 'Scenario content' }: { children?: React.ReactNode }) {
  return (
    <span className="border-notice-border/50 bg-notice-bg text-notice-text inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      <Icon name="info" className="size-3.5" />
      {children}
    </span>
  );
}

export function Callout({
  title,
  children,
  tone = 'notice',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'notice' | 'info';
}) {
  const styles =
    tone === 'notice'
      ? 'border-notice-border bg-notice-bg text-notice-text'
      : 'border-railway-blue-700/30 bg-railway-blue-100 text-railway-blue-950';
  return (
    <aside className={`rounded-xl border-l-4 p-5 ${styles}`} aria-label={title}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon name="info" className="size-5 shrink-0" />
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </aside>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  icon = 'arrow',
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost-light';
  icon?: IconName | null;
  external?: boolean;
}) {
  const styles = {
    primary: 'bg-railway-green-700 text-white hover:bg-railway-green-800 shadow-sm',
    secondary:
      'border border-railway-blue-900/20 bg-white text-railway-blue-900 hover:border-railway-blue-900/50',
    'ghost-light': 'border border-white/60 text-white hover:bg-white/10',
  };
  const className = `group inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold transition-colors ${styles[variant]}`;
  const content = (
    <>
      {children}
      {icon && (
        <Icon
          name={external ? 'external' : icon}
          className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
        />
      )}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Card with an icon or image area, used for quick links and feature lists. */
export function LinkCard({
  href,
  icon,
  title,
  children,
}: {
  href: string;
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group hover:border-railway-green-600 flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
    >
      <span className="bg-railway-green-100 text-railway-green-700 inline-flex size-12 items-center justify-center rounded-xl">
        <Icon name={icon} />
      </span>
      <span className="text-railway-blue-900 mt-4 text-lg font-semibold">{title}</span>
      <span className="mt-1 text-neutral-600">{children}</span>
      <span className="text-railway-green-700 mt-auto flex items-center gap-1 pt-4 text-sm font-semibold">
        Open
        <Icon
          name="arrow"
          className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
        />
      </span>
    </Link>
  );
}

export function OriginalPageLink({ page }: { page: SitePage }) {
  return (
    <a
      href={page.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-railway-blue-700 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
    >
      View this page on the original site
      <Icon name="external" className="size-4" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
