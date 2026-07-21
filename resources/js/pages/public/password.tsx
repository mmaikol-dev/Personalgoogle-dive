import { Head, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    token: string;
    fileId: number;
    fileName: string;
};

export default function PasswordGate({ token, fileId, fileName }: Props) {
    const { data, setData, post, errors, processing } = useForm({
        file_id: fileId,
        password: '',
    });

    return (
        <>
            <Head title="Password Required" />

            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
                            <Lock className="size-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Password Required</CardTitle>
                        <CardDescription className="truncate">
                            {fileName}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                post(`/f/${token}/verify-password`);
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoFocus
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? 'Checking...' : 'Access File'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
