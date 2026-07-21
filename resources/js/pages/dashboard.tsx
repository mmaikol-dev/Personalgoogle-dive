import { Head, usePage } from '@inertiajs/react';
import {
    Download,
    FileIcon,
    Globe,
    HardDrive,
    Link2,
    Lock,
    ShieldOff,
} from 'lucide-react';
import { FilesUploadChart } from '@/components/files-upload-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import type { DashboardInvitation } from '@/types';

type Props = {
    pendingInvitations?: DashboardInvitation[];
    chartData?: { date: string; count: number }[];
    stats?: {
        totalFiles: number;
        totalSize: string;
        totalDownloads: number;
        publicFiles: number;
        passwordProtected: number;
        revokedFiles: number;
    };
};

export default function Dashboard({ pendingInvitations = [], chartData = [], stats }: Props) {
    const { currentTeam } = usePage().props as { currentTeam?: { slug: string } | null };

    const statCards = [
        { label: 'Total Files', value: stats?.totalFiles ?? 0, icon: FileIcon, color: 'text-blue-500' },
        { label: 'Total Size', value: stats?.totalSize ?? '0 B', icon: HardDrive, color: 'text-green-500' },
        { label: 'Downloads', value: stats?.totalDownloads ?? 0, icon: Download, color: 'text-purple-500' },
        { label: 'Public Shares', value: stats?.publicFiles ?? 0, icon: Globe, color: 'text-cyan-500' },
        { label: 'Password Protected', value: stats?.passwordProtected ?? 0, icon: Lock, color: 'text-amber-500' },
        { label: 'Revoked', value: stats?.revokedFiles ?? 0, icon: ShieldOff, color: 'text-red-500' },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {statCards.map((stat) => (
                        <Card key={stat.label} className="aspect-video">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <stat.icon className={`size-4 ${stat.color}`} />
                                    {stat.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="min-h-[50vh] flex-1 md:min-h-min">
                    <FilesUploadChart data={chartData} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
