export type DriveFile = {
    id: number;
    uuid: string;
    name: string;
    original_name: string;
    mime_type: string;
    size: number;
    size_for_humans: string;
    folder: string | null;
    tags: string[] | null;
    share_url: string;
    expires_at: string | null;
    max_downloads: number | null;
    download_count: number;
    is_expired: boolean;
    is_revoked: boolean;
    is_password_protected: boolean;
    is_download_limit_reached: boolean;
    slug: string | null;
    created_at: string;
    revoked_at: string | null;
};

export type FilesPage = {
    files: {
        data: DriveFile[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    folders: string[];
    allTags: string[];
    filters: {
        search?: string;
        folder?: string;
        tag?: string;
        sort?: string;
        dir?: string;
    };
    chartData: { date: string; count: number }[];
};
