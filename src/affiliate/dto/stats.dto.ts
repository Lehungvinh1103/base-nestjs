export interface MonthlyStats {
    month: number;
    clicks: number;
  }
  
  export interface QuarterlyStats {
    quarter: number;
    clicks: number;
  }
  
  export interface TimeStats {
    monthly: MonthlyStats[];
    quarterly: QuarterlyStats[];
  }