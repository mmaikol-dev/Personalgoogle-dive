import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type InstagramProps = {
    instagram: {
        node: string | null;
        access_token: string | null;
    };
};

export default function Instagram({ instagram }: InstagramProps) {
    const [node, setNode] = useState(instagram.node ?? '');
    const [accessToken, setAccessToken] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const save = () => {
        router.patch('/settings/instagram', {
            node,
            access_token: accessToken,
        }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onError: (nextErrors) => setErrors(nextErrors),
            onSuccess: () => { setErrors({}); setAccessToken(''); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="space-y-6">
            <Head title="Instagram" />
            <Heading
                variant="small"
                title="Instagram"
                description="Configure your Instagram node and access token for publishing."
            />

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="instagram-node">Node ID</Label>
                    <Input
                        id="instagram-node"
                        value={node}
                        onChange={(event) => setNode(event.target.value)}
                        placeholder="178414..."
                    />
                    <p className="text-xs text-muted-foreground">
                        The Instagram Business Account ID or node ID.
                    </p>
                    <InputError message={errors.node} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="instagram-token">Access Token</Label>
                    <Input
                        id="instagram-token"
                        type="password"
                        value={accessToken}
                        onChange={(event) => setAccessToken(event.target.value)}
                        placeholder={instagram.access_token ? '•••••••• (saved)' : 'EAA...'}
                    />
                    <p className="text-xs text-muted-foreground">
                        A valid Facebook/Instagram Graph API access token with the required permissions.
                    </p>
                    <InputError message={errors.access_token} />
                </div>

                <Button onClick={save} disabled={processing}>
                    {processing ? 'Saving...' : 'Save configuration'}
                </Button>
            </div>
        </div>
    );
}

Instagram.layout = {
    breadcrumbs: [
        { title: 'Instagram', href: '/settings/instagram' },
    ],
};
