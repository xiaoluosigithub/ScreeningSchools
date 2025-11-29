import React, { useEffect, useMemo, useState } from "react";
import type { MapLevel, MetricLevel, SummaryStats } from "../types";
import { getAllSchools, getSchoolsByProvince, getSchoolsByCity } from "../api/schools";

interface StatsPanelProps {
  level: MapLevel;
  province?: string | null;
  city?: string | null;
  metric: MetricLevel;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ level, province, city, metric }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SummaryStats>({ total: 0, bachelor: 0 });

  const regionLabel = useMemo(() => {
    if (level === "country") return "中国";
    if (level === "province") return province ?? "";
    return city ?? "";
  }, [level, province, city]);

  const metricLabel = useMemo(() => (metric === "bachelor" ? "本科数量" : "学校数量"), [metric]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        let list: any[] = [];
        if (level === "country") {
          list = await getAllSchools();
        } else if (level === "province" && province) {
          list = await getSchoolsByProvince(province);
        } else if (level === "city" && city) {
          list = await getSchoolsByCity(city);
        }
        const total = Array.isArray(list) ? list.length : 0;
        const bachelor = Array.isArray(list) ? list.filter((s) => String(s.education_level || "").includes("本科")).length : 0;
        setStats({ total, bachelor });
      } catch {
        setError("统计数据加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [level, province, city]);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">当前涂色规则：{metricLabel}</span>
          <span className="text-xs text-gray-500">当前区域：{regionLabel}</span>
        </div>
        {loading && <div className="text-xs text-gray-500">统计计算中...</div>}
      </div>

      {error && <div className="px-3 py-2 rounded bg-red-50 text-red-600 shadow-sm">{error}</div>}

      {!error && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs text-gray-500">学校数量</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs text-gray-500">本科数量</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.bachelor}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
