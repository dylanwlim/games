import type { Metadata } from "next";

import { CipherwordArchive } from "@/features/games/cipherword/CipherwordArchive";

export const metadata: Metadata = {
  title: "Cipherword Archive",
  description: "Replay past Cipherword daily semantic word puzzles without future answer spoilers.",
  alternates: {
    canonical: "/games/cipherword/archive",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CipherwordArchivePage() {
  return <CipherwordArchive />;
}
