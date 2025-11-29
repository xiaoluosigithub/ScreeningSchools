import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapLevel, MapSelection } from "../types";

// 地图状态管理钩子
function readInitialSelection(): MapSelection {
  try {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    const level = (sp.get("level") as MapLevel) || "country";
    const province = sp.get("province");
    const city = sp.get("city");
    if (level === "country") {
      const ls = localStorage.getItem("map_selection");
      if (ls) {
        const obj = JSON.parse(ls);
        return { level: obj.level || "country", country: "中国", province: obj.province ?? null, city: obj.city ?? null };
      }
      return { level: "country", country: "中国", province: null, city: null };
    }
    if (level === "province" && province) {
      return { level: "province", country: "中国", province, city: null };
    }
    if (level === "city" && province && city) {
      return { level: "city", country: "中国", province, city };
    }
    const ls = localStorage.getItem("map_selection");
    if (ls) {
      const obj = JSON.parse(ls);
      return { level: obj.level || "country", country: "中国", province: obj.province ?? null, city: obj.city ?? null };
    }
  } catch {}
  return { level: "country", country: "中国", province: null, city: null };
}

function persistSelection(sel: MapSelection) {
  try {
    localStorage.setItem("map_selection", JSON.stringify(sel));
    const url = new URL(window.location.href);
    url.searchParams.set("level", sel.level);
    if (sel.province) url.searchParams.set("province", sel.province); else url.searchParams.delete("province");
    if (sel.city) url.searchParams.set("city", sel.city); else url.searchParams.delete("city");
    window.history.replaceState(null, "", url.toString());
  } catch {}
}

export function useMap() {
  // 地图选择状态
  const [selection, setSelection] = useState<MapSelection>(readInitialSelection());
  // 设置国家层级选择
  const setCountry = useCallback(() => {
    setSelection({ level: "country", country: "中国", province: null, city: null });
  }, []);
  // 设置省份层级选择
  const setProvince = useCallback((name: string) => {
    setSelection({ level: "province", country: "中国", province: name, city: null });
  }, []);
  // 设置城市层级选择
  const setCity = useCallback((name: string) => {
    setSelection(prev => ({ ...prev, level: "city", city: name }));
  }, []);
  // 持久化与URL同步
  useEffect(() => { persistSelection(selection); }, [selection]);
  // 地图面包屑导航
  const breadcrumbs = useMemo(() => {
    const items: string[] = ["中国"];
    if (selection.province) items.push(selection.province); // 添加省份
    if (selection.city) items.push(selection.city); // 添加城市 
    return items;
  }, [selection]);
  // 返回地图选择状态、层级设置函数和面包屑导航
  return { selection, setCountry, setProvince, setCity, breadcrumbs };
}

// 获取地图资源 URL
export function getGeoResource(level: MapLevel, province?: string | null, city?: string | null) {
  return buildAliyunUrl(level, province, city); // 构建阿里云地图资源 URL
}

// 标准化省份名称
type CodeMap = Record<string, string>;

// 标准化省份名称，移除后缀（如“省”、“市”等）
export function normalizeProvinceName(name: string): string {
  return name
    .replace(/省$/u, "")
    .replace(/市$/u, "")
    .replace(/自治区$/u, "")
    .replace(/壮族自治区$/u, "")
    .replace(/回族自治区$/u, "")
    .replace(/维吾尔自治区$/u, "")
    .replace(/特别行政区$/u, "");
}

export function normalizeCityName(name: string): string {
  return name
    .replace(/市$/u, "")
    .replace(/地区$/u, "")
    .replace(/盟$/u, "")
    .replace(/自治州$/u, "")
    .replace(/林区$/u, "")
    .replace(/区$/u, "")
    .replace(/县$/u, "");
}

// 省份名称到代码的映射
const provinceCodeMap: CodeMap = {
  "北京": "110000",
  "天津": "120000",
  "河北": "130000",
  "山西": "140000",
  "内蒙古": "150000",
  "辽宁": "210000",
  "吉林": "220000",
  "黑龙江": "230000",
  "上海": "310000",
  "江苏": "320000",
  "浙江": "330000",
  "安徽": "340000",
  "福建": "350000",
  "江西": "360000",
  "山东": "370000",
  "河南": "410000",
  "湖北": "420000",
  "湖南": "430000",
  "广东": "440000",
  "广西": "450000",
  "海南": "460000",
  "重庆": "500000",
  "四川": "510000",
  "贵州": "520000",
  "云南": "530000",
  "西藏": "540000",
  "陕西": "610000",
  "甘肃": "620000",
  "青海": "630000",
  "宁夏": "640000",
  "新疆": "650000",
  "香港": "810000",
  "澳门": "820000",
  "台湾": "710000",
  "北京市": "110000",
  "天津市": "120000",
  "上海市": "310000",
  "重庆市": "500000",
  "河北省": "130000",
  "山西省": "140000",
  "辽宁省": "210000",
  "吉林省": "220000",
  "黑龙江省": "230000",
  "江苏省": "320000",
  "浙江省": "330000",
  "安徽省": "340000",
  "福建省": "350000",
  "江西省": "360000",
  "山东省": "370000",
  "河南省": "410000",
  "湖北省": "420000",
  "湖南省": "430000",
  "广东省": "440000",
  "广西壮族自治区": "450000",
  "内蒙古自治区": "150000",
  "海南省": "460000",
  "四川省": "510000",
  "贵州省": "520000",
  "云南省": "530000",
  "西藏自治区": "540000",
  "陕西省": "610000",
  "甘肃省": "620000",
  "青海省": "630000",
  "宁夏回族自治区": "640000",
  "新疆维吾尔自治区": "650000",
  "香港特别行政区": "810000",
  "澳门特别行政区": "820000",
  "台湾省": "710000"
};

// 解析城市名称到行政代码（ADCODE）
async function resolveCityAdcode(province: string, city: string): Promise<string | null> {
  try {
    // 标准化省份名称
    const provCode = provinceCodeMap[province] ?? provinceCodeMap[normalizeProvinceName(province)];
    // 标准化城市名称，移除后缀（如“市”、“地区”等）
    const normCity = city
      .replace(/市$/u, "")
      .replace(/地区$/u, "")
      .replace(/盟$/u, "")
      .replace(/自治州$/u, "")
      .replace(/林区$/u, "")
      .replace(/区$/u, "")
      .replace(/县$/u, "");
    // 尝试直接查询城市名称和标准化后的城市名称
    const queries = [city, normCity];
    // 尝试查询城市名称和标准化后的城市名称
    for (const q of queries) {
      // 构建查询 URL
      const url = `https://geo.datav.aliyun.com/areas_v3/search?keywords=${encodeURIComponent(q)}`;
      // 发送查询请求
      const res = await fetch(url);
      // 解析 JSON 响应
      const list: { name: string; adcode: string; level: string }[] = await res.json();
      // 过滤出城市级别的结果
      const candidates = list.filter(i => i.level === "city");
      // 尝试直接匹配城市名称
      let match = candidates.find(i => i.name.includes(q));
      // 如果没有直接匹配，尝试使用省份前缀匹配
      if (!match && provCode) {
        // 如果没有直接匹配，尝试使用省份前缀匹配
        const provPrefix = provCode.slice(0, 2);
        // 尝试使用省份前缀匹配城市
        match = candidates.find(i => i.adcode.startsWith(provPrefix));
      }
      // 如果有匹配结果，返回 ADCODE
      if (match) return match.adcode;
    }
    return null;
  } catch {
    return null;
  }
}
// 解析省份下的城市名称到行政代码（ADCODE）
async function resolveCityAdcodeByProvince(province: string, city: string): Promise<string | null> {
  try {
    const provCode = provinceCodeMap[province] ?? provinceCodeMap[normalizeProvinceName(province)];
    if (!provCode) return null;
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${provCode}_full.json`;
    const geo = await fetch(url).then(r => r.json());
    const features = (geo && geo.features) ? geo.features : [];
    const normCity = city
      .replace(/市$/u, "")
      .replace(/地区$/u, "")
      .replace(/盟$/u, "")
      .replace(/自治州$/u, "")
      .replace(/林区$/u, "")
      .replace(/区$/u, "")
      .replace(/县$/u, "");
    for (const f of features) {
      const name = f?.properties?.name as string | undefined;
      const adcode = f?.properties?.adcode as string | undefined;
      if (!name || !adcode) continue;
      if (name === city || name === normCity || name.includes(normCity)) {
        return adcode;
      }
    }
    return null;
  } catch {
    return null;
  }
}
//
function buildAliyunUrl(level: MapLevel, province?: string | null, city?: string | null) {
  if (level === "country") {
    return { name: "中国", url: "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json" };
  }
  if (level === "province" && province) {
    const base = normalizeProvinceName(province);
    const code = provinceCodeMap[province] ?? provinceCodeMap[base];
    if (code) {
      return { name: province, url: `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json` };
    }
    return { name: province, url: `https://geo.datav.aliyun.com/areas_v3/search?keywords=${encodeURIComponent(base)}` };
  }
  if (level === "city" && province && city) {
    return { name: city, url: `CITY_DYNAMIC:${province}:${city}` };
  }
  return { name: "中国", url: "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json" };
}

export async function loadGeoJSON(level: MapLevel, province?: string | null, city?: string | null) {
  const res = getGeoResource(level, province, city);
  const cacheKey = `${level}|${province ?? ''}|${city ?? ''}`;
  // 简易内存缓存（模块级单例）
  // @ts-ignore
  const globalAny: any = globalThis as any;
  globalAny.__geoCache = globalAny.__geoCache || new Map<string, any>();
  const cache: Map<string, any> = globalAny.__geoCache;
  const cached = cache.get(cacheKey);
  if (cached) return { name: res.name, geo: cached };
  if (res.url.startsWith("CITY_DYNAMIC")) {
    const [, p, c] = res.url.split(":");
    const [byProv, direct] = await Promise.all([
      resolveCityAdcodeByProvince(p, c),
      resolveCityAdcode(p, c)
    ]);
    const adcode = byProv || direct;
    if (!adcode) throw new Error("无法解析该城市的边界数据");
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
    const geo = await fetch(url).then(r => r.json());
    cache.set(cacheKey, geo);
    return { name: res.name, geo };
  } else if (res.url.includes("search?keywords=")) {
    const list = await fetch(res.url).then(r => r.json());
    const match = Array.isArray(list) ? list.find((i: any) => i.level === "province") : null;
    if (!match) throw new Error("省份加载失败");
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${match.adcode}_full.json`;
    const geo = await fetch(url).then(r => r.json());
    cache.set(cacheKey, geo);
    return { name: res.name, geo };
  } else {
    const geo = await fetch(res.url).then(r => r.json());
    cache.set(cacheKey, geo);
    return { name: res.name, geo };
  }
}
