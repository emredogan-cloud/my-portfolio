import { Reveal } from "@/components/ui/Reveal";

const METRICS = [
  { value: "19", label: "Years Old" },
  { value: "04:30", label: "Bakery Shift Starts" },
  { value: "2 yrs", label: "Fully Self-Taught" },
] as const;

/**
 * Compact authority strip. Sits directly after the hero — no card
 * chrome, no dashboard energy. Number above small-caps label.
 * On mobile, horizontally scrollable with snap so all three stay
 * legible at any viewport.
 */
export default function MetricsRow() {
  return (
    <section className="py-10 md:py-14">
      <Reveal duration={0.7} margin="-50px">
        <div className="max-w-3xl mx-auto">
          <div
            className="
              flex md:grid md:grid-cols-3
              gap-10 md:gap-12
              overflow-x-auto md:overflow-visible
              snap-x snap-mandatory md:snap-none
              px-6 md:px-8 pb-2 md:pb-0
            "
          >
            {METRICS.map((m) => (
              <div
                key={m.label}
                className="flex-shrink-0 min-w-[140px] md:min-w-0 snap-start"
              >
                <p className="text-2xl font-semibold text-white tracking-tight">
                  {m.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500 mt-1.5">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
