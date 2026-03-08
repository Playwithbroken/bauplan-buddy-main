import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, type TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelProps {
  data: FunnelData[];
  title?: string;
  description?: string;
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export function ConversionFunnel({ 
  data,
  title = 'Conversion-Funnel',
  description = 'Von Angebot bis Rechnung'
}: ConversionFunnelProps) {
  const tooltipFormatter: TooltipProps<number, string>['formatter'] = (
    value: ValueType,
    _name: NameType,
    props
  ) => {
    const payload = (props?.payload as FunnelData | undefined);
    const percentage = payload?.percentage ?? 0;
    return [`${value} (${percentage}%)`, 'Anzahl'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" stroke="#888888" />
            <YAxis 
              dataKey="stage" 
              type="category" 
              stroke="#888888"
              width={100}
            />
            <Tooltip 
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
