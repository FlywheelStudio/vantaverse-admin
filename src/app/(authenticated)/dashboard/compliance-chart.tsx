'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SeriesPoint = { time: string; value: number };

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatYyyyMmDd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateMonthSeries(opts: {
  year: number;
  monthIndex0: number;
  startValue: number;
  endValue: number;
  wobble?: number;
}): SeriesPoint[] {
  const { year, monthIndex0, startValue, endValue, wobble = 4 } = opts;
  const total = daysInMonth(year, monthIndex0);
  const out: SeriesPoint[] = [];
  for (let day = 1; day <= total; day++) {
    const t = total === 1 ? 1 : (day - 1) / (total - 1);
    const trend = startValue + (endValue - startValue) * t;
    const noise = Math.sin(day * 1.7) * wobble + Math.cos(day * 0.9) * (wobble * 0.6);
    const value = clamp(Math.round(trend + noise), 0, 100);
    out.push({ time: formatYyyyMmDd(new Date(year, monthIndex0, day)), value });
  }
  return out;
}

export function ComplianceChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lastMonthSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const currentMonthSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const { lastMonth, currentMonth } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex0 = now.getMonth();

    const lastMonthIndex0 = currentMonthIndex0 === 0 ? 11 : currentMonthIndex0 - 1;
    const lastMonthYear = currentMonthIndex0 === 0 ? currentYear - 1 : currentYear;

    const lastMonth = generateMonthSeries({
      year: lastMonthYear,
      monthIndex0: lastMonthIndex0,
      startValue: 34,
      endValue: 58,
      wobble: 5,
    });

    const currentMonth = generateMonthSeries({
      year: currentYear,
      monthIndex0: currentMonthIndex0,
      startValue: 52,
      endValue: 78,
      wobble: 4,
    });

    return { lastMonth, currentMonth };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748B',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.25)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.25)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: {
        vertLine: { visible: true, labelVisible: false },
        horzLine: { visible: true, labelVisible: true },
      },
    });

    const lastMonthSeries = chart.addSeries(LineSeries, {
      color: '#94A3B8',
      lineWidth: 2,
    });
    const currentMonthSeries = chart.addSeries(LineSeries, {
      color: '#2454FF',
      lineWidth: 3,
    });

    lastMonthSeries.setData(lastMonth);
    currentMonthSeries.setData(currentMonth);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    lastMonthSeriesRef.current = lastMonthSeries;
    currentMonthSeriesRef.current = currentMonthSeries;

    const ro = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      lastMonthSeriesRef.current = null;
      currentMonthSeriesRef.current = null;
    };
  }, [lastMonth, currentMonth]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1E3A5F]">Compliance growth</CardTitle>
        <div className="flex items-center gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#94A3B8]" />
            <span>Last month</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#2454FF]" />
            <span>Current month</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div ref={containerRef} className="h-[420px] w-full" />
      </CardContent>
    </Card>
  );
}

