import { SpotifyDailyRecap } from '@/components/spotify/SpotifyDailyRecap';
import type { SpotifyRecap } from '@/lib/spotify';

type RecapCardProps = {
  recap: SpotifyRecap;
};

export function RecapCard({ recap }: RecapCardProps) {
  return <SpotifyDailyRecap recap={recap} />;
}
