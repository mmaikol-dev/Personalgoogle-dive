<?php

namespace Database\Factories;

use App\Models\File;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<File>
 */
class FileFactory extends Factory
{
    protected $model = File::class;

    public function definition(): array
    {
        $name = Str::random(40);
        $originalName = fake()->word().'.'.fake()->fileExtension();

        return [
            'uuid' => (string) Str::uuid(),
            'team_id' => Team::factory(),
            'user_id' => User::factory(),
            'name' => $name,
            'original_name' => $originalName,
            'mime_type' => fake()->mimeType(),
            'size' => fake()->numberBetween(1024, 10485760),
            'disk' => 'public',
            'path' => 'files/'.$name.'/'.$originalName,
            'is_public' => false,
        ];
    }

    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_public' => true,
        ]);
    }
}
