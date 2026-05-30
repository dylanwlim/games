import { GameHub } from "@/features/games/components/GameHub";

export default function HomePage() {
  return <GameHub key="home" initialSlug="snake" view="games" />;
}
