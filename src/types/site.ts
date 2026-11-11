/** Review state shared by every content record (see docs/content-model.md). */
export type ReviewState = 'source' | 'needs-review' | 'approved' | 'proposed';

export interface SitePage {
  /** Stable identifier, never changes once published. */
  id: string;
  /** Label used in navigation, preserved from the source site. */
  label: string;
  /** Route path in the new site, with leading and trailing slash. */
  path: string;
  /** Full URL of the page on the original Google Sites website. */
  sourceUrl: string;
  /** Parent page id, or null for top-level pages. */
  parentId: string | null;
  /** Whether the page appears in the main navigation. Hidden source pages keep false until approved. */
  inNav: boolean;
  /** One-sentence description for metadata. Must not present the simulation as a real operator. */
  description: string;
  reviewState: ReviewState;
}
