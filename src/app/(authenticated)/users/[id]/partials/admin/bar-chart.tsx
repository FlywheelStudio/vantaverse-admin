'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export type ComplianceByOrgItem = {
  organizationId: string;
  organizationName: string;
  compliance: number;
  programCompletion: number;
};

const chartConfig = {
  compliance: {
    label: 'Compliance %',
    color: 'var(--chart-1)',
  },
  programCompletion: {
    label: 'Program completion %',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

interface AdminComplianceBarChartProps {
  data: ComplianceByOrgItem[];
}

export function AdminComplianceBarChart({
  data,
}: AdminComplianceBarChartProps): React.ReactElement {
  const chartData = data.map((d) => ({
    name: d.organizationName,
    compliance: Math.round(d.compliance),
    programCompletion: Math.round(d.programCompletion),
  }));

  if (chartData.length === 0) {
    return (
      <div
        style={{
          padding: '20px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-default)',
          background: 'var(--slate-50)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        No compliance data for these groups yet.
      </div>
    );
  }

  const chartHeight = Math.min(280, Math.max(160, chartData.length * 48 + 48));

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full !aspect-auto"
      style={{ height: chartHeight }}
    >
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar
          dataKey="compliance"
          fill="var(--color-compliance)"
          radius={[0, 4, 4, 0]}
          name={chartConfig.compliance.label}
        />
        <Bar
          dataKey="programCompletion"
          fill="var(--color-programCompletion)"
          radius={[0, 4, 4, 0]}
          name={chartConfig.programCompletion.label}
        />
      </BarChart>
    </ChartContainer>
  );
}
