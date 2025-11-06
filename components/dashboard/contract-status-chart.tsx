"use client"

import { Pie, PieChart, Cell, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type ContractStatusChartProps = {
  data: Array<{ status: string; count: number; fill: string }>
}

export function ContractStatusChart({ data }: ContractStatusChartProps) {
  const chartConfig = data.reduce(
    (acc, item) => {
      acc[item.status.toLowerCase()] = {
        label: item.status,
        color: item.fill,
      }
      return acc
    },
    {} as Record<string, { label: string; color: string }>,
  )

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  )
}
