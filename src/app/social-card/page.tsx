import type { Metadata } from "next";

import SocialCard from "@/components/banner/SocialCard";

/**
 * Standalone render of the 1280×640 social card.
 *
 * Utility route — not linked from the UI and excluded from indexing.
 * Screenshot it at exactly 1280×640 to regenerate the Open Graph image:
 *
 *   npx next dev   →   http://localhost:3000/social-card
 */
export const metadata: Metadata = {
  title: "Social card",
  robots: { index: false, follow: false },
};

export default function SocialCardPage() {
  return <SocialCard />;
}
