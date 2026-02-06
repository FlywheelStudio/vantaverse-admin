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

export function AdminComplianceBarChart({ data }: AdminComplianceBarChartProps) {
  const chartData = data.map((d) => ({
    name: d.organizationName,
    compliance: Math.round(d.compliance),
    programCompletion: Math.round(d.programCompletion),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-border/50 bg-muted/20 text-sm text-muted-foreground">
        No group data yet
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[240px] w-full"
    >
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
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
