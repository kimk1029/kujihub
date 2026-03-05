import { create } from 'zustand';

export type ReportTag =
  | '완판'
  | 'A상'
  | '라스트원'
  | '혼잡도'
  | '박스상태'
  | string;

export interface Report {
  id: string;
  storeName: string;
  memo?: string;
  tags: ReportTag[];
  createdAt: string; // ISO string
}

interface ReportState {
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => void;
}

let idCounter = 0;

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  addReport: (report) =>
    set((state) => {
      const newReport: Report = {
        ...report,
        id: `report_${++idCounter}_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      return {
        reports: [newReport, ...state.reports],
      };
    }),
}));
