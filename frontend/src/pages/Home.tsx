import React, { useEffect, useState } from "react";
import MapVisualizer from "../components/MapVisualizer";
import StatsPanel from "../components/StatsPanel";
import SchoolList from "../components/SchoolList";
import { theme } from "../theme";
import { useMap } from "../hooks/useMap";
import type { MetricLevel } from "../types";

const Home: React.FC = () => {
  const { selection, setCountry, setProvince, setCity, breadcrumbs } = useMap();
  const [metric, setMetric] = useState<MetricLevel>("total");

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const m = (url.searchParams.get("metric") as MetricLevel) || (localStorage.getItem("map_metric") as MetricLevel) || "total";
      setMetric(m);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("map_metric", metric);
      const url = new URL(window.location.href);
      url.searchParams.set("metric", metric);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [metric]);

  const goBack = () => {
    if (selection.level === "city" && selection.province) {
      setProvince(selection.province);
    } else {
      setCountry();
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <header className="flex items-center px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">CN</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900">中国高校地图可视化</h1>
            <p className="text-xs text-gray-500">React + TypeScript + ECharts + TailwindCSS</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6">
        <section className="col-span-8 card p-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="text-base text-gray-700 font-medium">当前位置：{breadcrumbs.join(" / ")}</div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-sm">可拖拽缩放</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded bg-orange-50 text-orange-700 text-sm">区域高亮</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">筛选规则</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as MetricLevel)}
                  className="px-3 py-1.5 rounded border border-gray-200 bg-white text-sm"
                >
                  <option value="total">全部</option>
                  <option value="bachelor">本科</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={goBack}
                  disabled={selection.level === "country"}
                >
                  返回上级
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={setCountry}
                  disabled={selection.level === "country"}
                >
                  返回中国
                </button>
              </div>
            </div>
          </div>
          <div className="h-[58vh] border border-gray-200 rounded-lg overflow-hidden">
            <MapVisualizer
              level={selection.level}
              province={selection.province}
              city={selection.city}
              primary={theme.primary}
              highlight={theme.highlight}
              onSelectProvince={setProvince}
              onSelectCity={setCity}
              metric={metric}
            />
          </div>
          <StatsPanel level={selection.level} province={selection.province} city={selection.city} metric={metric} />
        </section>
        <aside className="col-span-4 card p-4">
          <SchoolList level={selection.level} province={selection.province} city={selection.city} metric={metric} />
        </aside>
      </main>
    </div>
  );
};

export default Home;
