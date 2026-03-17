import { api } from '../../shared/api';

export interface KujiPlayer {
  id: string;
  nickname: string;
  points: number;
}

let cachedPlayerId: string | null = null;

function getPlayerId() {
  if (!cachedPlayerId) {
    cachedPlayerId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
  return cachedPlayerId;
}

export async function ensureKujiPlayer(): Promise<KujiPlayer> {
  const playerId = getPlayerId();
  const { data } = await api.post<KujiPlayer>('/api/kujis/player/ensure', {
    playerId,
    nickname: '게스트',
  });
  return data;
}
