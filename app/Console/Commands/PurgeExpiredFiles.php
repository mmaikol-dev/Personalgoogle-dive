<?php

namespace App\Console\Commands;

use App\Models\File;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredFiles extends Command
{
    protected $signature = 'files:purge-expired {--dry-run : List files that would be deleted without deleting them}';

    protected $description = 'Delete expired files and their storage from disk and database';

    public function handle(): int
    {
        $expired = File::where('expires_at', '<=', now())->get();
        $revoked = File::whereNotNull('revoked_at')
            ->where('revoked_at', '<=', now()->subDays(30))
            ->get();
        $limitReached = File::whereNotNull('max_downloads')
            ->whereColumn('download_count', '>=', 'max_downloads')
            ->where('created_at', '<=', now()->subDays(7))
            ->get();

        $toDelete = $expired->merge($revoked)->merge($limitReached)->unique('id');

        if ($toDelete->isEmpty()) {
            $this->info('No files to purge.');

            return Command::SUCCESS;
        }

        $totalSize = $toDelete->sum('size');

        $this->table(
            ['ID', 'Name', 'Size', 'Reason'],
            $toDelete->map(fn (File $file) => [
                $file->id,
                $file->original_name,
                $file->getSizeForHumans(),
                $file->expires_at?->isPast() ? 'Expired' : ($file->revoked_at ? 'Revoked (30d)' : 'Download limit reached'),
            ])
        );

        $this->info("Found {$toDelete->count()} files to delete ({$toDelete->sum(fn ($f) => $f->getSizeForHumans())} total)");

        if ($this->option('dry-run')) {
            $this->warn('Dry run — no files were deleted.');

            return Command::SUCCESS;
        }

        if (! $this->confirm('Delete these files?', true)) {
            $this->info('Cancelled.');

            return Command::FAILURE;
        }

        $bar = $this->output->createProgressBar($toDelete->count());
        $bar->start();

        foreach ($toDelete as $file) {
            Storage::disk($file->disk)->deleteDirectory(dirname($file->path));
            $file->delete();
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Purge complete.');

        return Command::SUCCESS;
    }
}
