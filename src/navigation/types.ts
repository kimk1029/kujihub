import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { KujiDrawRevealResult } from '../features/kuji-draw/kujiDraw.types';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  ReportCreate: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Feed: undefined;
  Media: undefined;
  Draw: undefined;
  Community: undefined;
  My: undefined;
};

export type KujiDrawStackParamList = {
  KujiList: undefined;
  KujiSelection: { kujiId: string };
  KujiPurchase: { kujiId: string };
  KujiBoardDraw: { kujiId: string; quantity: number; purchaseId: string; playerId: string };
  KujiResult: {
    kujiId: string;
    quantity: number;
    purchaseId: string;
    playerId: string;
    selectedSlots: number[];
    results: KujiDrawRevealResult[];
  };
};

export type CommunityStackParamList = {
  CommunityList: undefined;
  CommunityDetail: { id: number };
  CommunityPostForm: { id?: number };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
