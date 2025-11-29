import axios from "axios";
import type { School, RegionStat, MetricLevel } from "../types";

// 学校 API 客户端
const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000
});

// 获取所有学校
export async function getAllSchools(): Promise<School[]> {
  const { data } = await api.get<School[]>("/schools");
  return data;
}

// 获取指定省份的学校
export async function getSchoolsByProvince(province: string): Promise<School[]> {
  const { data } = await api.get<School[]>(`/schools/province/${encodeURIComponent(province)}`);
  return data;
}

// 获取指定城市的学校
export async function getSchoolsByCity(city: string): Promise<School[]> {
  const { data } = await api.get<School[]>(`/schools/city/${encodeURIComponent(city)}`);
  return data;
}

//
export async function searchSchools(keyword: string): Promise<School[]> {
  const { data } = await api.get<School[]>(`/schools/search/${encodeURIComponent(keyword)}`);
  return data;
}

export async function getProvinceStats(level: MetricLevel = "total"): Promise<RegionStat[]> {
  const { data } = await api.get<RegionStat[]>(`/schools/stats/province`, { params: { level } });
  return data;
}

export async function getCityStats(province: string, level: MetricLevel = "total"): Promise<RegionStat[]> {
  const { data } = await api.get<RegionStat[]>(`/schools/stats/city/${encodeURIComponent(province)}`, { params: { level } });
  return data;
}
