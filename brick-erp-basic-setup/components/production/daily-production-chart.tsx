'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aggregateDailyProduction } from '@/lib/utils/erp-logic';

interface ProductionLogForChart {
  productionDate: Date;
  bricksProduced: number;
  netYield: number;
  wastageCount: number;
  totalCost: number | string;
}

export function DailyProductionChart({
  logs,
}: {
  logs: ProductionLogForChart[];
}) {
  const data = aggregateDailyProduction(logs);

  // Mobile: shorter height, hide legend to save space
  const chartHeight = 'h-[200px] sm:h-[300px]';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">Daily Production</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={chartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                height={40}
              />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ fontSize: '12px', padding: '6px 8px' }}
              />
              {/* Hide legend on small screens, show on sm+ */}
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                className="hidden sm:block"
              />
              <Bar
                dataKey="bricks"
                name="Produced"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="netYield"
                name="Net Yield"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
