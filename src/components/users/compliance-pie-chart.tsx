"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface CompliancePieChartProps {
  compliance: number
  size?: number
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
  nonCompleted: {
    label: "Non-completed",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const DEFAULT_SIZE = 128

export function CompliancePieChart({ compliance, size = DEFAULT_SIZE }: CompliancePieChartProps) {
  const chartData = React.useMemo(() => {
    const completed = Math.max(0, Math.min(100, compliance))
    const nonCompleted = Math.max(0, 100 - completed)
    
    return [
      { name: "completed", value: completed, fill: chartConfig.completed.color },
      { name: "nonCompleted", value: nonCompleted, fill: chartConfig.nonCompleted.color },
    ]
  }, [compliance])

  const displayPercentage = Math.round(compliance)
  const scale = size / DEFAULT_SIZE
  const innerRadius = Math.round(45 * scale)
  const outerRadius = Math.round(55 * scale)
  const labelOffset = Math.round(18 * scale)

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square w-full h-full"
      style={{ width: size, height: size }}
    >
      <PieChart width={size} height={size}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          strokeWidth={0}
          startAngle={90}
          endAngle={-270}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                const cy = (viewBox.cy ?? 0) - scale * 5
                return (
                  <text
                    x={viewBox.cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={cy}
                      className="fill-foreground font-bold"
                      style={{ fontSize: Math.round(20 * scale) }}
                    >
                      {displayPercentage}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={cy + labelOffset}
                      className="fill-muted-foreground"
                      style={{ fontSize: Math.round(12 * scale) }}
                    >
                      compliance
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
