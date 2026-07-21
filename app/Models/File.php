<?php

namespace App\Models;

use Database\Factories\FileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $team_id
 * @property int $user_id
 * @property string $name
 * @property string $original_name
 * @property string $mime_type
 * @property int $size
 * @property string $disk
 * @property string $path
 * @property string|null $folder
 * @property array|null $tags
 * @property bool $is_public
 * @property Carbon|null $expires_at
 * @property string|null $password_hash
 * @property int|null $max_downloads
 * @property int $download_count
 * @property string|null $slug
 * @property Carbon|null $revoked_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read bool $is_expired
 * @property-read bool $is_revoked
 * @property-read bool $is_password_protected
 * @property-read bool $is_download_limit_reached
 * @property-read bool $is_accessible
 * @property-read string $share_url
 * @property-read string $size_for_humans
 * @property-read Team $team
 * @property-read User $user
 */
#[Fillable([
    'uuid', 'team_id', 'user_id', 'name', 'original_name', 'mime_type', 'size',
    'disk', 'path', 'folder', 'tags', 'is_public',
    'expires_at', 'password_hash', 'max_downloads', 'slug',
])]
class File extends Model
{
    /** @use HasFactory<FileFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'is_public' => 'boolean',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'max_downloads' => 'integer',
            'download_count' => 'integer',
            'tags' => 'array',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (File $file) {
            if (empty($file->uuid)) {
                $file->uuid = (string) Str::uuid();
            }
        });
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): Attribute
    {
        return Attribute::get(fn () => $this->expires_at !== null && $this->expires_at->isPast());
    }

    public function isRevoked(): Attribute
    {
        return Attribute::get(fn () => $this->revoked_at !== null);
    }

    public function isPasswordProtected(): Attribute
    {
        return Attribute::get(fn () => $this->password_hash !== null);
    }

    public function isDownloadLimitReached(): Attribute
    {
        return Attribute::get(fn () => $this->max_downloads !== null && $this->download_count >= $this->max_downloads);
    }

    public function isAccessible(): Attribute
    {
        return Attribute::get(fn () =>
            ! $this->is_expired
            && ! $this->is_revoked
            && ! $this->is_download_limit_reached
        );
    }

    public function shareUrl(): Attribute
    {
        return Attribute::get(function () {
            $token = $this->slug ?? $this->uuid;

            return url("/f/{$token}/{$this->original_name}");
        });
    }

    public function getSizeForHumans(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes >= 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'size_for_humans' => $this->getSizeForHumans(),
            'folder' => $this->folder,
            'tags' => $this->tags,
            'is_public' => true,
            'share_url' => $this->share_url,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'max_downloads' => $this->max_downloads,
            'download_count' => $this->download_count,
            'is_expired' => $this->is_expired,
            'is_revoked' => $this->is_revoked,
            'is_password_protected' => $this->is_password_protected,
            'is_download_limit_reached' => $this->is_download_limit_reached,
            'slug' => $this->slug,
            'created_at' => $this->created_at,
            'revoked_at' => $this->revoked_at?->toIso8601String(),
        ];
    }
}
