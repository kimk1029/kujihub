export interface KujiPrize {
  id: string;
  grade: string; // A, B, C, D... Last One
  name: string;
  imageUrl?: string;
  totalQuantity: number;
  remainingQuantity: number;
}

export interface KujiItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  status: 'active' | 'sold_out';
  prizes: KujiPrize[];
}

export interface DrawResult {
  prize: KujiPrize;
  drawIndex: number;
}

export interface KujiDrawRevealResult {
  slotNumber: number;
  grade: string;
  name: string;
  color: string;
}
