
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FoodLog } from "@/lib/supabase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MacronutrientChartProps {
  foodLogs: FoodLog[];
}

const MacronutrientChart = ({ foodLogs }: MacronutrientChartProps) => {
  const data = useMemo(() => {
    const totals = foodLogs.reduce(
      (acc, log) => {
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 }
    );

    return [
      { name: "Protein", value: totals.protein.toFixed(1), fill: "hsl(var(--primary))" },
      { name: "Carbs", value: totals.carbs.toFixed(1), fill: "hsl(var(--secondary))" },
      { name: "Fat", value: totals.fat.toFixed(1), fill: "hsl(var(--muted))" },
    ];
  }, [foodLogs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macronutrient Breakdown</CardTitle>
        <CardDescription>
          Total protein, carbs, and fat for the selected day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[250px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} unit="g" />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="value" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default MacronutrientChart;
