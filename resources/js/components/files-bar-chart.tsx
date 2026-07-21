import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    data: { date: string; count: number }[];
};

export function FilesBarChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Files uploaded per day</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={4} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
