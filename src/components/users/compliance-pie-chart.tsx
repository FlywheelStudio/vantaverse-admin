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

export function CompliancePieChart({ compliance }: CompliancePieChartProps) {
  const chartData = React.useMemo(() => {
    const completed = Math.max(0, Math.min(100, compliance))
    const nonCompleted = Math.max(0, 100 - completed)
    
    return [
      { name: "completed", value: completed, fill: chartConfig.completed.color },
      { name: "nonCompleted", value: nonCompleted, fill: chartConfig.nonCompleted.color },
    ]
  }, [compliance])

  const displayPercentage = Math.round(compliance)

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square w-full h-full min-w-32 min-h-32"
      style={{ width: 128, height: 128 }}
    >
      <PieChart width={128} height={128}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={55}
          strokeWidth={0}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                const cy = (viewBox.cy ?? 0) - 5
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
                      className="fill-foreground text-xl font-bold"
                    >
                      {displayPercentage}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={cy + 18}
                      className="fill-muted-foreground text-xs"
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
