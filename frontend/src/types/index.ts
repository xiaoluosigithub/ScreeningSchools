export interface School {
  school_name: string;
  school_code: string;
  department: string;
  city: string;
  province: string;
  education_level: string;
  notes?: string;
}

export type MapLevel = "country" | "province" | "city";

export interface Theme {
  primary: string;
  highlight: string;
}

export interface MapSelection {
  level: MapLevel;
  country?: "中国";
  province?: string | null;
  city?: string | null;
}

export type MetricLevel = "total" | "bachelor";

export interface RegionStat {
  name: string;
  value: number;
}

export interface SummaryStats {
  total: number;
  bachelor: number;
}
