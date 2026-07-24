import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Instagram,
    Upload,
    Sparkles,
    Share2,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Zap,
    MonitorSmartphone,
    Globe,
} from 'lucide-react';

export default function Welcome() {
    const { auth, currentTeam } = usePage().props;
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';

    const features = [
        {
            icon: Upload,
            title: 'Auto-Upload from Sheets',
            desc: 'Read posts from Google Sheets and automatically upload to Instagram.',
        },
        {
            icon: Sparkles,
            title: 'Smart Media Resizing',
            desc: 'Images are automatically resized to perfect Instagram dimensions.',
        },
        {
            icon: Share2,
            title: 'Reels, Posts & Stories',
            desc: 'Supports all Instagram formats: image posts, reels, and stories.',
        },
        {
            icon: BarChart3,
            title: 'Schedule & Automate',
            desc: 'Set your publishing schedule and let the system handle the rest.',
        },
    ];

    const steps = [
        { num: '01', label: 'Add rows to your Google Sheet' },
        { num: '02', label: 'Images are downloaded & resized' },
        { num: '03', label: 'Uploaded to your Drive storage' },
        { num: '04', label: 'Published to Instagram automatically' },
    ];

    return (
        <>
            <Head title="Welcome" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Animated gradient orbs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                    <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/10 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-yellow-500/10 blur-3xl [animation-delay:2s]" />
                    <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 blur-3xl [animation-delay:4s]" />
                </div>

                {/* Nav */}
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg">
                            <Instagram className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-foreground">
                            DrivePost
                        </span>
                    </div>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href={dashboardUrl}>
                                <Button>Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={login()}>
                                    <Button variant="ghost">Log in</Button>
                                </Link>
                                <Link href={register()}>
                                    <Button>Get Started</Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 px-4 py-1.5 text-sm text-purple-700 dark:text-purple-300 border-0">
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                            Instagram Automation Powered by Laravel
                        </Badge>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Publish to Instagram{' '}
                            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                                Automatically
                            </span>
                        </h1>

                        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
                            Connect your Google Sheets, upload images to your own storage,
                            and publish Reels, Posts, and Stories to Instagram — all on
                            autopilot.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {auth.user ? (
                                <Link href={dashboardUrl}>
                                    <Button size="lg" className="h-12 px-8 text-base gap-2">
                                        Go to Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={register()}>
                                        <Button size="lg" className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg">
                                            Start Automating
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={login()}>
                                        <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                            Sign In
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3D Card Grid */}
                    <div className="mt-20 perspective-[2000px]">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, i) => (
                                <div
                                    key={feature.title}
                                    className="group cursor-default"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/10 hover:rotate-y-3"
                                        style={{
                                            transformStyle: 'preserve-3d',
                                        }}
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                            <feature.icon className="h-6 w-6 text-pink-500" />
                                        </div>
                                        <h3 className="mb-2 font-semibold text-foreground">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="relative z-10 border-t bg-card/50 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-6 py-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                How It Works
                            </h2>
                            <p className="text-muted-foreground">
                                From spreadsheet to Instagram in four steps
                            </p>
                        </div>

                        <div className="relative mx-auto max-w-4xl">
                            {/* Connection line */}
                            <div className="absolute top-8 left-8 right-8 hidden h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 md:block" />

                            <div className="grid gap-8 md:grid-cols-4">
                                {steps.map((step, i) => (
                                    <div key={step.num} className="relative flex flex-col items-center text-center">
                                        <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-lg font-bold text-white shadow-lg">
                                            {step.num}
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            {step.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features grid */}
                <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
                    <div className="mx-auto max-w-3xl text-center mb-16">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                            Everything You Need
                        </h2>
                        <p className="text-muted-foreground">
                            Built on your own infrastructure — no third-party services
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                icon: MonitorSmartphone,
                                title: 'Your Storage',
                                desc: 'Images are stored on your own server via Laravel. No Google Drive hotlinking.',
                            },
                            {
                                icon: Globe,
                                title: 'Public Share URLs',
                                desc: 'Every file gets a shareable URL that Facebook can reliably fetch.',
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Reliable Publishing',
                                desc: 'n8n workflows handle retries, error logging, and status updates.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 group-hover:scale-110 transition-transform">
                                    <item.icon className="h-5 w-5 text-foreground/70" />
                                </div>
                                <h3 className="mb-2 font-semibold">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="relative z-10 border-t bg-card/30 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
                        <div className="mx-auto max-w-2xl">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                Ready to Automate Your
                                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                                    {' '}Instagram
                                </span>
                                ?
                            </h2>
                            <p className="mb-8 text-muted-foreground">
                                Stop manually posting. Set it up once and let the automation
                                run your content calendar.
                            </p>
                            {auth.user ? (
                                <Link href={dashboardUrl}>
                                    <Button size="lg" className="h-12 px-8 text-base gap-2">
                                        Go to Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href={register()}>
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg"
                                    >
                                        Get Started Free
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 border-t">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                                <Instagram className="h-3.5 w-3.5 text-white" />
                            </div>
                            DrivePost
                        </div>
                        <p>Built with Laravel + shadcn</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
