import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  ReportCreate: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Map: undefined;
  Community: undefined;
  My: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
