/* ──────────────────────────────────────────────────────────────
 *  GallerySequence — V6 Sub-PR 14.2
 *
 *  Replaces the V5 uniform 2-col image grid with a stacked
 *  editorial sequence:
 *
 *    [   lead image — full-width   ]
 *    [ small ] [ small ]
 *    [   final image — full-width   ]
 *
 *  Per spec: "large lead image, then 2 small support images side-
 *  by-side, then a final large image. Editorial rhythm, not a
 *  uniform grid."
 *
 *  Adapts to image count:
 *    1 image  → just the lead.
 *    2 images → lead + small below (full-width to avoid orphan).
 *    3 images → lead + 2 small side-by-side.
 *    4 images → lead + 2 small + final large.
 *    5+ images → lead + 2 small + final large + remaining stacked
 *                pairs (same rhythm carries through).
 *
 *  Server-renders its layout container; each image is the existing
 *  Client `GalleryItem` (hover-scale lift + Next.js Image
 *  optimisation). No new motion grammar.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.2.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 5.3 ("Gallery is a 2-col
 *             image grid with no rhythm").
 * ────────────────────────────────────────────────────────────── */

import { GalleryItem } from "./GalleryItem";

interface Props {
  images: readonly string[];
  /** Used for the `${title} screenshot N` alt text. */
  title: string;
}

export default function GallerySequence({ images, title }: Props) {
  if (images.length === 0) return null;

  const [lead, ...rest] = images;
  const small1 = rest[0];
  const small2 = rest[1];
  const final = rest[2];
  const tail = rest.slice(3);

  return (
    <div className="space-y-5">
      {/* Lead — full-width large frame. */}
      <GalleryItem src={lead} alt={`${title} screenshot 1`} />

      {/* Small pair — side-by-side on md+, stacked on mobile. */}
      {(small1 || small2) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {small1 ? (
            <GalleryItem src={small1} alt={`${title} screenshot 2`} />
          ) : null}
          {small2 ? (
            <GalleryItem src={small2} alt={`${title} screenshot 3`} />
          ) : null}
        </div>
      )}

      {/* Final — full-width large frame. */}
      {final ? (
        <GalleryItem src={final} alt={`${title} screenshot 4`} />
      ) : null}

      {/* Tail — same rhythm carries: small pairs then optional large.
          For 5+ images the rhythm extends naturally without breaking
          the editorial cadence. */}
      {tail.length > 0 && (
        <>
          {tail.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GalleryItem
                src={tail[0]}
                alt={`${title} screenshot 5`}
              />
              <GalleryItem
                src={tail[1]}
                alt={`${title} screenshot 6`}
              />
            </div>
          )}
          {tail.length === 1 ? (
            <GalleryItem
              src={tail[0]}
              alt={`${title} screenshot 5`}
            />
          ) : null}
          {tail.length >= 3
            ? tail.slice(2).map((src, i) => (
                <GalleryItem
                  key={src}
                  src={src}
                  alt={`${title} screenshot ${7 + i}`}
                />
              ))
            : null}
        </>
      )}
    </div>
  );
}
