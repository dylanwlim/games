import { GameHub } from "@/features/games/components/game-hub";

export default function HomePage() {
  return <GameHub key="home" initialSlug="snake" view="games" />;
}
