import { Head, router, usePage } from '@inertiajs/react';
import {
    Copy,
    Download,
    Eye,
    FileIcon,
    FileUp,
    FolderIcon,
    FolderPlus,
    HardDrive,
    Link2,
    Lock,
    MoreHorizontal,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Tag,
    Trash2,
    Unlink,
    Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import filesRoute from '@/actions/App/Http/Controllers/FilesController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { DriveFile, FilesPage } from '@/types';

type FilesSettings = {
    expires_at: string;
    password: string;
    max_downloads: string;
    slug: string;
    folder: string;
    tags: string;
};

export default function Files() {
    const { files, folders, allTags, filters, currentTeam } = usePage<FilesPage & { currentTeam?: { slug: string } | null }>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [uploadOpen, setUploadOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'pdf'>('image');
    const [settingsFile, setSettingsFile] = useState<DriveFile | null>(null);
    const [settings, setSettings] = useState<FilesSettings>({
        expires_at: '0',
        password: '',
        max_downloads: '',
        slug: '',
        folder: '',
        tags: '',
    });
    const [uploadFileList, setUploadFileList] = useState<globalThis.File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const teamSlug = currentTeam?.slug;
    const activeFolder = filters.folder;

    const updateQuery = useCallback((params: Record<string, string | undefined>) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v) query.set(k, v);
        });
        const qs = query.toString();
        router.get(window.location.pathname + (qs ? `?${qs}` : ''), {}, { preserveState: true, replace: true });
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            updateQuery({ search: search || undefined, folder: activeFolder });
        }, 300);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [search]);

    const fileUrl = (file: DriveFile, path: string) =>
        `/${teamSlug}/files/${file.id}/${path}`;

    const handleSearch = (val: string) => setSearch(val);

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            setUploadFileList(droppedFiles);
            setUploadOpen(true);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setUploadFileList(newFiles);
            setUploadOpen(true);
        }
    };

    const handleUpload = async () => {
        if (uploadFileList.length === 0) return;
        setUploading(true);

        for (const file of uploadFileList) {
            const formData = new FormData();
            formData.append('file', file);
            if (activeFolder) formData.append('folder', activeFolder);

            await new Promise<void>((resolve) => {
                router.post(filesRoute.store(teamSlug!), formData, {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => resolve(),
                });
            });
        }

        setUploading(false);
        setUploadOpen(false);
        setUploadFileList([]);
        toast.success(`${uploadFileList.length} file(s) uploaded`);
    };

    const openSettings = (file: DriveFile) => {
        setSettingsFile(file);
        setSettings({
            expires_at: file.expires_at ? '24' : '0',
            password: '',
            max_downloads: file.max_downloads?.toString() || '',
            slug: file.slug || '',
            folder: file.folder || '',
            tags: file.tags?.join(', ') || '',
        });
        setSettingsOpen(true);
    };

    const saveSettings = () => {
        if (!settingsFile) return;

        const payload: Record<string, unknown> = {};
        payload.expires_at = parseInt(settings.expires_at);
        payload.password = settings.password;
        payload.max_downloads = settings.max_downloads ? parseInt(settings.max_downloads) : null;
        payload.slug = settings.slug;
        payload.folder = settings.folder;
        payload.tags = settings.tags ? settings.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

        router.patch(filesRoute.update({ current_team: teamSlug!, fileId: settingsFile.id }), payload as Record<string, string | number | boolean | null | string[]>, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSettingsOpen(false);
                toast.success('Settings updated');
            },
        });
    };

    const revokeFile = (file: DriveFile) => {
        router.post(fileUrl(file, 'revoke'), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Link revoked'),
        });
    };

    const unrevokeFile = (file: DriveFile) => {
        router.post(fileUrl(file, 'unrevoke'), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Link restored'),
        });
    };

    const deleteFile = (file: DriveFile) => {
        router.delete(filesRoute.destroy({ current_team: teamSlug!, fileId: file.id }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('File deleted'),
        });
    };

    const batchDelete = () => {
        router.post(`/${teamSlug}/files/batch-delete`, { ids: Array.from(selected) }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelected(new Set());
                toast.success('Files deleted');
            },
        });
    };

    const copyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        } catch {
            toast.error('Failed to copy');
        }
    };

    const downloadFile = (file: DriveFile) => {
        const link = document.createElement('a');
        link.href = fileUrl(file, 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openPreview = (file: DriveFile) => {
        setPreviewUrl(fileUrl(file, 'preview'));
        setPreviewType(file.mime_type === 'application/pdf' ? 'pdf' : 'image');
        setPreviewOpen(true);
    };

    const canPreview = (mime: string) => mime.startsWith('image/') || mime === 'application/pdf';

    const createFolder = () => {
        const name = newFolderName.trim();
        if (!name) return;
        if (folders.includes(name)) {
            toast.error('Folder already exists');
            return;
        }
        toast.success(`Folder "${name}" created`);
        setNewFolderName('');
        updateQuery({ folder: name, search: search || undefined });
    };

    const getStatusBadge = (file: DriveFile) => {
        if (file.is_revoked) return <Badge variant="destructive">Revoked</Badge>;
        if (file.is_expired) return <Badge variant="destructive">Expired</Badge>;
        if (file.is_download_limit_reached) return <Badge variant="destructive">Limit Reached</Badge>;
        if (file.is_password_protected) return <Badge variant="secondary"><Lock className="mr-1 size-3" />Protected</Badge>;
        if (file.expires_at) return <Badge variant="outline">Expires soon</Badge>;
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fileMimeIcon = (mime: string) => {
        const type = mime.split('/').pop()?.toUpperCase();
        if (type === 'pdf') return 'PDF';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type || '')) return 'IMG';
        if (['mp4', 'mov', 'avi', 'mkv'].includes(type || '')) return 'VID';
        if (['mp3', 'wav', 'flac'].includes(type || '')) return 'AUD';
        if (['zip', 'rar', 'tar', 'gz'].includes(type || '')) return 'ZIP';
        if (['doc', 'docx'].includes(type || '')) return 'DOC';
        if (['xls', 'xlsx'].includes(type || '')) return 'XLS';
        return type?.slice(0, 4) || 'FILE';
    };

    return (
        <>
            <Head title="Files" />

            <div
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="flex h-full flex-1 flex-col gap-4 p-4"
            >
                {dragOver && (
                    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileUp className="size-12" />
                            <p className="text-lg font-medium">Drop files to upload</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setUploadOpen(true)}>
                            <HardDrive className="mr-2 size-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="sticky top-4 hidden max-h-[calc(100vh-2rem)] w-56 shrink-0 self-start overflow-y-auto md:flex md:flex-col md:gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Folders</span>
                            <span className="text-xs text-muted-foreground">{folders.length}</span>
                        </div>

                        <div className="flex gap-1">
                            <Input
                                placeholder="New folder..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); }}
                                className="h-8 text-xs"
                            />
                            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={createFolder}>
                                <FolderPlus className="size-4" />
                            </Button>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={() => updateQuery({ folder: undefined, search: search || undefined })}
                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${!activeFolder ? 'bg-muted font-medium' : ''}`}
                            >
                                <HardDrive className="size-4 text-muted-foreground" />
                                All Files
                            </button>

                            {folders.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => updateQuery({ folder: f === activeFolder ? undefined : f, search: search || undefined })}
                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${activeFolder === f ? 'bg-muted font-medium' : ''}`}
                                >
                                    <FolderIcon className="size-4 text-muted-foreground" />
                                    <span className="truncate">{f}</span>
                                </button>
                            ))}
                        </div>

                        {activeFolder && (
                            <button
                                onClick={() => updateQuery({ folder: undefined, search: search || undefined })}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left px-2"
                            >
                                &larr; Clear filter
                            </button>
                        )}

                        <Separator />

                        {allTags.length > 0 && (
                            <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {allTags.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => updateQuery({ tag: filters.tag === t ? undefined : t, search: search || undefined })}
                                            className={`rounded-md px-2 py-0.5 text-xs transition-colors ${filters.tag === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {selected.size > 0 && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm">
                                <span className="font-medium">{selected.size} selected</span>
                                <Button variant="destructive" size="sm" onClick={batchDelete}>
                                    <Trash2 className="mr-1 size-3" /> Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                                    Clear selection
                                </Button>
                            </div>
                        )}

                        {activeFolder && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <FolderIcon className="size-4" />
                                <span>Showing: <strong>{activeFolder}</strong></span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateQuery({ folder: undefined, search: search || undefined })}>
                                    Clear
                                </Button>
                            </div>
                        )}

                        {files.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                                <HardDrive className="size-16 text-muted-foreground/30" />
                                <p className="text-lg font-medium text-muted-foreground">No files yet</p>
                                <p className="text-sm text-muted-foreground/60">Upload your first file to get a shareable link.</p>
                                <Button variant="outline" onClick={() => setUploadOpen(true)} className="mt-2">
                                    <Upload className="mr-2 size-4" /> Upload
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {files.data.map((file) => (
                                    <Card
                                        key={file.id}
                                        className={`group relative overflow-hidden transition-all hover:shadow-md ${selected.has(file.id) ? 'ring-2 ring-primary' : ''}`}
                                    >
                                        <div className="absolute top-2 left-2 z-10">
                                            <Checkbox
                                                checked={selected.has(file.id)}
                                                onCheckedChange={() => toggleSelect(file.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                                            />
                                        </div>

                                        <div
                                            className="aspect-video flex items-center justify-center bg-muted/30 cursor-pointer"
                                            onClick={() => canPreview(file.mime_type) ? openPreview(file) : downloadFile(file)}
                                        >
                                            {file.mime_type.startsWith('image/') ? (
                                                <img
                                                    src={fileUrl(file, 'preview')}
                                                    alt={file.original_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                    <FileIcon className="size-8" />
                                                    <span className="text-[10px] font-medium">{fileMimeIcon(file.mime_type)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-3 space-y-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{file.original_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.size_for_humans} &middot; {formatDate(file.created_at)}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Download className="size-3" />
                                                    {file.download_count}
                                                    {file.max_downloads && <span>/ {file.max_downloads}</span>}
                                                </div>
                                                {getStatusBadge(file)}
                                            </div>

                                            <Separator />

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => copyLink(file.share_url)}
                                                >
                                                    <Link2 className="mr-1 size-3" /> Copy Link
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-7 ml-auto">
                                                            <MoreHorizontal className="size-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        {canPreview(file.mime_type) && (
                                                            <DropdownMenuItem onClick={() => openPreview(file)}>
                                                                <Eye className="mr-2 size-4" /> Preview
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                                                            <Download className="mr-2 size-4" /> Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => copyLink(file.share_url)}>
                                                            <Link2 className="mr-2 size-4" /> Copy Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openSettings(file)}>
                                                            <SlidersHorizontal className="mr-2 size-4" /> Settings
                                                        </DropdownMenuItem>
                                                        {file.is_revoked ? (
                                                            <DropdownMenuItem onClick={() => unrevokeFile(file)}>
                                                                <RefreshCw className="mr-2 size-4" /> Restore Link
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => revokeFile(file)}>
                                                                <Unlink className="mr-2 size-4" /> Revoke Link
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => deleteFile(file)}>
                                                            <Trash2 className="mr-2 size-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {files.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {Array.from({ length: files.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === files.current_page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('page', page.toString());
                                            router.get(window.location.pathname + '?' + params.toString(), {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Drawer open={uploadOpen} onOpenChange={setUploadOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Upload Files</DrawerTitle>
                        <DrawerDescription>
                            Drop files or click to select. Max 100MB per file.
                            {activeFolder && <span className="block mt-1 text-xs">Uploading to folder: <strong>{activeFolder}</strong></span>}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 space-y-4 overflow-y-auto max-h-[50vh]">
                        <div
                            className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files);
                                if (files.length) setUploadFileList(files);
                            }}
                        >
                            {uploadFileList.length === 0 ? (
                                <>
                                    <Upload className="size-8 text-muted-foreground" />
                                    <div>
                                        <Button
                                            variant="link"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-0"
                                        >
                                            Click to browse
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            {' '}or drag and drop
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full space-y-2">
                                    {uploadFileList.map((f) => (
                                        <div key={f.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                            <span className="truncate">{f.name}</span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {(f.size / 1024 / 1024).toFixed(1)} MB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        {uploadFileList.length > 0 ? (
                            <div className="flex gap-2">
                                <Button variant="ghost" className="flex-1" onClick={() => { setUploadFileList([]); setUploadOpen(false); }}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleUpload} disabled={uploading}>
                                    {uploading ? 'Uploading...' : `Upload ${uploadFileList.length} file(s)`}
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Close</Button>
                        )}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>File Settings</DrawerTitle>
                        <DrawerDescription className="truncate">
                            {settingsFile?.original_name}
                        </DrawerDescription>
                    </DrawerHeader>

                    {settingsFile && (
                        <div className="px-4 space-y-4 overflow-y-auto max-h-[50vh]">
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Share URL</span>
                                    <Button variant="ghost" size="sm" onClick={() => copyLink(settingsFile.share_url)}>
                                        <Copy className="mr-1 size-3" /> Copy
                                    </Button>
                                </div>
                                <p className="mt-1 truncate font-mono text-xs">{settingsFile.share_url}</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Link Expiry</Label>
                                <Select
                                    value={settings.expires_at}
                                    onValueChange={(v) => setSettings((prev) => ({ ...prev, expires_at: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Never</SelectItem>
                                        <SelectItem value="24">24 Hours</SelectItem>
                                        <SelectItem value="168">7 Days</SelectItem>
                                        <SelectItem value="720">30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password Protection</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Leave blank for no password"
                                    value={settings.password}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, password: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Viewers must enter this password to access the file
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_downloads">Max Downloads</Label>
                                <Input
                                    id="max_downloads"
                                    type="number"
                                    min="0"
                                    placeholder="No limit"
                                    value={settings.max_downloads}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, max_downloads: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Custom Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="shrink-0 text-sm text-muted-foreground">/f/</span>
                                    <Input
                                        id="slug"
                                        placeholder="my-custom-link"
                                        value={settings.slug}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, slug: e.target.value }))}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Override the random token with a custom short slug
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="folder">Folder</Label>
                                <Select
                                    value={settings.folder || '_none'}
                                    onValueChange={(v) => setSettings((prev) => ({ ...prev, folder: v === '_none' ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No folder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">No folder</SelectItem>
                                        {folders.map((f) => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="tag1, tag2, tag3"
                                    value={settings.tags}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, tags: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">Comma-separated tags for filtering</p>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    {settingsFile.is_revoked ? (
                                        <Badge variant="destructive">Revoked</Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-green-600">Active</Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        {settingsFile.download_count} download(s)
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {settingsFile.is_revoked ? (
                                        <Button variant="outline" size="sm" onClick={() => unrevokeFile(settingsFile)}>
                                            <RefreshCw className="mr-1 size-3" /> Restore
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => revokeFile(settingsFile)}>
                                            <Unlink className="mr-1 size-3" /> Revoke
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DrawerFooter>
                        <Button onClick={saveSettings}>Save Changes</Button>
                        <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Drawer open={previewOpen} onOpenChange={setPreviewOpen}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle>Preview</DrawerTitle>
                    </DrawerHeader>
                    <div className="mx-4 mb-4 flex h-[400px] max-h-[50vh] items-center justify-center overflow-hidden rounded border bg-muted/30">
                        {previewType === 'pdf' ? (
                            <iframe src={previewUrl} className="size-full" title="Preview" />
                        ) : (
                            <img src={previewUrl} alt="Preview" className="size-full object-contain" />
                        )}
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
}

Files.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Files',
            href: props.currentTeam ? filesRoute.index(props.currentTeam.slug) : '/',
        },
    ],
});
