"use client";

import { GitHubCalendar } from "react-github-calendar";

/**
 * GitHub contribution heatmap for /about → "Shipping Consistency".
 *
 * Custom dark theme aligned with Lumina's cyan palette so the calendar
 * reads as part of the design system rather than as an external embed.
 * Five-stop ramp from near-black (no commits) → cyan peak (max activity).
 *
 * Data is fetched client-side from the upstream contributions API on
 * mount. Renders an empty grid skeleton until the response lands.
 */
const LUMINA_THEME = {
  dark: ["#0a0a0a", "#0b2541", "#0061a0", "#00a8d4", "#00d2ff"],
};

export default function GithubActivity() {
  return (
    <div className="relative overflow-x-auto">
      <GitHubCalendar
        username="emredogan-cloud"
        colorScheme="dark"
        theme={LUMINA_THEME}
        fontSize={12}
        blockSize={11}
        blockMargin={4}
        labels={{
          totalCount: "{{count}} commits in the last year",
        }}
      />
    </div>
  );
}
