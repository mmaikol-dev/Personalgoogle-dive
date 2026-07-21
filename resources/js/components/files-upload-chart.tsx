import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const chartConfig = {
    count: {
        label: 'Uploads',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

type Props = {
    data: { date: string; count: number }[];
};

export function FilesUploadChart({ data }: Props) {
    const [timeRange, setTimeRange] = React.useState('90d');

    const referenceDate = React.useMemo(() => {
        const dates = data.map((d) => new Date(d.date));
        return dates.length
            ? new Date(Math.max(...dates.map(Number)))
            : new Date();
    }, [data]);

    const filteredData = React.useMemo(() => {
        const daysToSubtract =
            timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        const uploads = data.filter((item) => new Date(item.date) >= startDate);

        // Recharts cannot draw an area from a single point. Add the preceding day
        // at zero so the first day of uploads is still visible.
        if (uploads.length === 1) {
            const firstDate = new Date(`${uploads[0].date}T00:00:00`);
            firstDate.setDate(firstDate.getDate() - 1);

            return [
                { date: firstDate.toISOString().slice(0, 10), count: 0 },
                uploads[0],
            ];
        }

        return uploads;
    }, [data, referenceDate, timeRange]);

    return (
        <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Files uploaded per day</CardTitle>
                    <CardDescription>
                        Showing file upload activity over time
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a time range"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {filteredData.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        Upload a file to see activity here.
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[250px] w-full"
                    >
                        <AreaChart
                            data={filteredData}
                            margin={{ left: 8, right: 8 }}
                        >
                            <defs>
                                <linearGradient
                                    id="fillCount"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-count)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-count)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                width={24}
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    });
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => {
                                            return new Date(
                                                value,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            });
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area
                                dataKey="count"
                                type="monotone"
                                fill="url(#fillCount)"
                                stroke="var(--color-count)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-count)', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
