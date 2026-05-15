/**
 * Shared types for the /architecture scroll-story system.
 *
 * Each project under /architecture/{project-id} owns its own milestones
 * array + its own illustrations dispatch map and feeds both into the
 * shared <ScrollStory/> engine. Keeping the shape here lets the engine
 * stay project-agnostic and each project file stay self-contained.
 */

export interface Milestone {
  /** Stable id, used to look up the matching illustration. */
  id: string;
  /** Small monospace eyebrow shown above the title. */
  accent: string;
  title: string;
  body: string;
  /** Background blob position as a percentage of the viewport. */
  gradient: { x: number; y: number; intensity: number };
}

export type IllustrationsById = Record<
  string,
  (p: { className?: string }) => React.ReactNode
>;
