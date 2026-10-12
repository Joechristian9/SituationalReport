<?php

// app.blade.php asks Vite for resources/js/Pages/<component>.jsx. A page that Rollup folded into
// a shared chunk has no manifest entry, so loading it directly (or reopening it offline) is a 500.
// public/build is committed, so this catches a page added or merged without a working build.
it('has a build entry for every Inertia page', function () {
    $manifestPath = public_path('build/manifest.json');
    if (! is_file($manifestPath)) {
        $this->markTestSkipped('No production build to check.');
    }

    $manifest = json_decode(file_get_contents($manifestPath), true);
    $pages = collect(new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/Pages'), FilesystemIterator::SKIP_DOTS)))
        ->filter(fn (SplFileInfo $file) => $file->getExtension() === 'jsx')
        ->map(fn (SplFileInfo $file) => 'resources/js/Pages/'.str_replace('\\', '/', substr($file->getPathname(), strlen(resource_path('js/Pages')) + 1)));

    $missing = $pages->reject(fn (string $page) => isset($manifest[$page]))->values()->all();

    expect($missing)->toBe([], 'Pages without a build entry: '.implode(', ', $missing));
});
