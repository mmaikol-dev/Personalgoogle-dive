import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type GoogleSheetsProps = {
    integration: {
        spreadsheet_id: string | null;
        sheet_name: string | null;
    };
    sheetNames: string[];
    connectionError: string | null;
};

export default function GoogleSheets({ integration, sheetNames, connectionError }: GoogleSheetsProps) {
    const [spreadsheetId, setSpreadsheetId] = useState(integration.spreadsheet_id ?? '');
    const [sheetName, setSheetName] = useState(integration.sheet_name ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [previewError, setPreviewError] = useState('');
    const [viewing, setViewing] = useState(false);

    const save = () => {
        router.patch('/settings/google-sheets', {
            spreadsheet_id: spreadsheetId,
            sheet_name: sheetName,
        }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onError: (nextErrors) => setErrors(nextErrors),
            onSuccess: () => setErrors({}),
            onFinish: () => setProcessing(false),
        });
    };

    const viewSheet = async () => {
        if (!sheetName) return;

        setViewing(true);
        setPreviewError('');

        try {
            const response = await fetch(`/settings/google-sheets/preview?sheet_name=${encodeURIComponent(sheetName)}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json() as { values?: string[][]; message?: string };

            if (!response.ok) throw new Error(data.message);
            setPreviewRows(data.values ?? []);
        } catch {
            setPreviewError('Could not load the sheet contents.');
        } finally {
            setViewing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Head title="Google Sheets" />
            <Heading
                variant="small"
                title="Google Sheets"
                description="Append every uploaded file's link, caption, and status to a sheet."
            />

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
                    <Input
                        id="spreadsheet-id"
                        value={spreadsheetId}
                        onChange={(event) => setSpreadsheetId(event.target.value)}
                        placeholder="1AbC..."
                    />
                    <p className="text-xs text-muted-foreground">
                        The value between <code>/d/</code> and <code>/edit</code> in the Google Sheets URL.
                    </p>
                    <InputError message={errors.spreadsheet_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="sheet-name">Sheet name</Label>
                    {sheetNames.length > 0 ? (
                        <Select value={sheetName} onValueChange={setSheetName}>
                            <SelectTrigger id="sheet-name">
                                <SelectValue placeholder="Choose a sheet" />
                            </SelectTrigger>
                            <SelectContent>
                                {sheetNames.map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="rounded-md border p-3 text-sm text-muted-foreground">
                            Save the spreadsheet ID first to load its available sheets.
                        </p>
                    )}
                    <InputError message={errors.sheet_name} />
                </div>

                {connectionError && <p className="text-sm text-destructive">{connectionError}</p>}

                <p className="rounded-md border p-3 text-sm text-muted-foreground">
                    Share the spreadsheet with the service-account email in your Google credential file as an Editor. New uploads are appended as: link, caption, status.
                </p>

                <div className="flex gap-2">
                    <Button onClick={save} disabled={processing}>
                        {processing ? 'Saving...' : 'Save integration'}
                    </Button>
                    <Button variant="outline" onClick={viewSheet} disabled={viewing || !sheetName}>
                        {viewing ? 'Loading...' : 'View sheet'}
                    </Button>
                </div>

                {previewError && <p className="text-sm text-destructive">{previewError}</p>}

                {previewRows.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <tbody>
                                {previewRows.map((row, index) => (
                                    <tr key={index} className="border-b last:border-0">
                                        {[0, 1, 2].map((column) => (
                                            <td key={column} className="max-w-64 truncate px-3 py-2">
                                                {row[column] ?? ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

GoogleSheets.layout = {
    breadcrumbs: [
        { title: 'Google Sheets', href: '/settings/google-sheets' },
    ],
};
