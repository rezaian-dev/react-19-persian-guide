import type { Metadata } from "next";

import SocialCard from "@/components/banner/SocialCard";

/**
 * Standalone render of the 1280×640 banner.
 *
 * Utility route — not linked from the UI and excluded from indexing.
 * Screenshot it at exactly 1280×640 to regenerate the images:
 *
 *   1x → public/social-card.png            (Open Graph)
 *   3x → assets/readme/…-banner.png        (README hero, 3840×1920)
 *
 * Wait for `document.fonts.ready` and the decoded author photo before
 * capturing so the export never ships tofu or a half-loaded image.
 */
export const metadata: Metadata = {
  title: "Social card",
  robots: { index: false, follow: false },
};

export default function SocialCardPage() {
  return <SocialCard />;
}
