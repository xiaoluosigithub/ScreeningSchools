import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { getContrastText } from "../theme";
import { loadGeoJSON, normalizeProvinceName, normalizeCityName } from "../hooks/useMap";
import type { MapLevel, MetricLevel, RegionStat } from "../types";
import { getProvinceStats, getCityStats, getAllSchools, getSchoolsByProvince } from "../api/schools";

// 地图可视化组件
interface MapVisualizerProps {
  level: MapLevel;
  province?: string | null;
  city?: string | null;
  primary?: string;
  highlight?: string;
  onSelectProvince?: (name: string) => void;
  onSelectCity?: (name: string) => void;
  metric?: MetricLevel;
}

// 地图可视化组件
const MapVisualizer: React.FC<MapVisualizerProps> = ({
  level,
  province,
  city,
  primary = "#2D67FF",
  highlight = "#FF8C00",
  onSelectProvince,
  onSelectCity,
  metric = "total"
}) => {
  const [geoName, setGeoName] = useState<string>("中国"); // 地图名称
  const [loading, setLoading] = useState<boolean>(true); // 是否加载中
  const [mapReady, setMapReady] = useState<boolean>(false); // 是否地图准备就绪
  const [error, setError] = useState<string | null>(null); // 地图加载错误信息
  const chartRef = useRef<ReactECharts>(null); // 地图实例引用
  const [featureNames, setFeatureNames] = useState<string[]>([]);
  const [stats, setStats] = useState<RegionStat[]>([]);
  const [maxValue, setMaxValue] = useState<number>(100);
  const [loadPct, setLoadPct] = useState<number>(0);

  // 加载地图数据
  useEffect(() => {
    let mounted = true; // 是否组件挂载
    setLoading(true); // 设置加载中为 true
    setLoadPct(0);
    setError(null); // 清空地图加载错误信息
    setMapReady(false); // 设置地图准备就绪为 false
    // 加载地图数据
    loadGeoJSON(level, province, city)
      .then(({ name, geo }) => {
        if (!mounted) return; // 如果组件未挂载，直接返回
        setGeoName(name); // 设置地图名称为加载到的地图名称
        echarts.registerMap(name, geo as any); // 注册地图数据
        const names: string[] = Array.isArray(geo?.features) ? geo.features.map((f: any) => f?.properties?.name).filter(Boolean) : [];
        setFeatureNames(names);
        setMapReady(true); // 设置地图准备就绪为 true
        setLoading(false); // 设置加载中为 false
        setLoadPct(100);
      })
      .catch(() => {
        if (!mounted) return;
        setError("地图加载失败"); // 设置地图加载错误信息
        setLoading(false); // 设置加载中为 false  
      });
    return () => {
      mounted = false;
    };
  }, [level, province, city]);

  // 计算高亮区域的文本颜色
  const textColor = useMemo(() => getContrastText(highlight), [highlight]);

  // 地图选项
  const mapOption = useMemo(() => {
    return {
      backgroundColor: "#ffffff", // 地图背景颜色
      tooltip: { trigger: "item", formatter: (p: any) => `${p.name}: ${p.value ?? 0}` },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 20,
        bottom: 20,
        inRange: { color: ["#e0e7ff", primary, "#001a72"] },
        calculable: true,
        text: ["多", "少"]
      },
      series: [
        {
          type: "map",
          map: geoName,
          roam: true,
          selectedMode: "single",
          label: { show: false },
          itemStyle: { areaColor: "#eef2ff", borderColor: "#c7d2fe", borderWidth: 1 },
          emphasis: {
            itemStyle: { areaColor: highlight },
            label: { show: true, color: textColor, fontWeight: "600" }
          },
          data: stats
        }
      ]
    };
  }, [geoName, primary, highlight, textColor, stats, maxValue]);

  // 备用选项，当地图尚未注册时显示空
  const fallbackOption = useMemo(() => ({ backgroundColor: "#ffffff", series: [] }), []);
  const hasRegistered = !!echarts.getMap(geoName);

  // 地图事件处理
  const onEvents = useMemo(() => {
    return {
      // 点击事件处理
      click: (params: any) => {
        const name: string = params?.name; // 点击的区域名称
        if (!name) return; // 如果点击的区域名称为空，直接返回
        if (level === "country") onSelectProvince?.(name); // 如果点击的区域为国家，调用选择省份回调函数
        else if (level === "province") {
          if (province && name === province) return; // 如果点击的省份与当前选中的省份相同，直接返回
          onSelectCity?.(name); // 否则，调用选择城市回调函数 
        }
      }
    };
  }, [level, province, onSelectProvince, onSelectCity]);

  useEffect(() => {
    async function fetchStats() {
      try {
        let result: RegionStat[] = [];
        if (level === "country") {
          result = await getProvinceStats(metric);
        } else if (level === "province" && province) {
          result = await getCityStats(province, metric);
        }
        if (!Array.isArray(result) || result.length === 0) throw new Error("empty");
        const mapped = mapNamesToFeatures(result, featureNames, level);
        const max = Math.max(...mapped.map(i => i.value), 0);
        setStats(mapped);
        setMaxValue(max || 100);
      } catch {
        try {
          let schools = [] as any[];
          if (level === "country") {
            schools = await getAllSchools();
            const source = metric === "bachelor" ? schools.filter((s: any) => String(s.education_level || "").includes("本科")) : schools;
            const byProv: Record<string, number> = {};
            for (const s of source) byProv[s.province] = (byProv[s.province] || 0) + 1;
            const tmp = Object.entries(byProv).map(([name, value]) => ({ name, value }));
            const mapped = mapNamesToFeatures(tmp, featureNames, level);
            const max = Math.max(...mapped.map(i => i.value), 0);
            setStats(mapped);
            setMaxValue(max || 100);
          } else if (level === "province" && province) {
            schools = await getSchoolsByProvince(province);
            const source = metric === "bachelor" ? schools.filter((s: any) => String(s.education_level || "").includes("本科")) : schools;
            const byCity: Record<string, number> = {};
            for (const s of source) byCity[s.city] = (byCity[s.city] || 0) + 1;
            const tmp = Object.entries(byCity).map(([name, value]) => ({ name, value }));
            const mapped = mapNamesToFeatures(tmp, featureNames, level);
            const max = Math.max(...mapped.map(i => i.value), 0);
            setStats(mapped);
            setMaxValue(max || 100);
          }
        } catch {}
      }
    }
    fetchStats();
  }, [level, province, metric, featureNames]);

  useEffect(() => {
    if (!loading) return;
    let pct = 0;
    setLoadPct(0);
    const id = setInterval(() => {
      pct = Math.min(85, pct + 7);
      setLoadPct(pct);
    }, 120);
    return () => clearInterval(id);
  }, [loading]);

  function mapNamesToFeatures(items: RegionStat[], features: string[], lvl: MapLevel): RegionStat[] {
    if (!features || features.length === 0) return items;
    return items.map(it => {
      const n = it.name;
      let target = features.find(f => f === n);
      if (!target && lvl === "country") {
        const nn = normalizeProvinceName(n);
        target = features.find(f => normalizeProvinceName(f) === nn || f.includes(nn));
      }
      if (!target && lvl === "province") {
        const nn = normalizeCityName(n);
        target = features.find(f => normalizeCityName(f) === nn || f.includes(nn));
      }
      return { name: target || n, value: it.value };
    });
  }

  return ( // 地图可视化组件
    // 地图容器
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="w-40 h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, loadPct))}%` }} />
            </div>
            <div className="text-xs text-gray-600">正在加载地图...</div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-3 py-2 rounded bg-red-50 text-red-600 shadow-sm">{error}</div>
        </div>
      )}
      <ReactECharts
        key={geoName}
        ref={chartRef}
        echarts={echarts}
        option={hasRegistered ? mapOption : fallbackOption}
        style={{ height: "100%", width: "100%" }}
        notMerge={false}
        lazyUpdate={true}
        onEvents={onEvents}
      /> 
    </div>
  );
};

export default MapVisualizer;
