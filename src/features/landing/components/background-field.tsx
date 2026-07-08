// Ambient page backdrop: soft radial gradients + film grain, sitting behind
// the hero and trusted-by strip. Kept as one absolutely-positioned layer
// (rather than per-section gradients) so the glow reads as continuous light
// rather than a stack of repeated blobs.
export function BackgroundField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
      <div className="absolute inset-0 bg-[#fafafb]" />
      <div
        className="landing-brand-glow absolute -top-40 left-1/2 h-[640px] w-[900px] -translate-x-1/2 rounded-full opacity-80 blur-3xl"
      />
      <div
        className="landing-brand-glow absolute -right-32 top-24 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
      />
      <div
        className="landing-brand-glow absolute -left-40 top-96 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
      />
      <div className="noise-layer" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[#fafafb]" />
    </div>
  );
}
