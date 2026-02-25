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
  const bachelorRatio = useMemo(() => {
    if (!stats.total) return "0.0%";
    return `${((stats.bachelor / stats.total) * 100).toFixed(1)}%`;
  }, [stats]);

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
    <div className="mt-4">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">当前区域详情</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{regionLabel}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 font-medium">
              规则：{metricLabel}
            </span>
            {loading && <span className="text-gray-500">统计计算中...</span>}
          </div>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded bg-red-50 text-red-600 shadow-sm">{error}</div>}

      {!error && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">学校数量</div>
            <div className="mt-2 text-4xl leading-none font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">本科数量</div>
            <div className="mt-2 text-4xl leading-none font-bold text-gray-900">{stats.bachelor}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">本科占比</div>
            <div className="mt-2 text-4xl leading-none font-bold text-gray-900">{bachelorRatio}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
