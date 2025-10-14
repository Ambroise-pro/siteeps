<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$baseDir = realpath(__DIR__ . '/..');

if ($baseDir === false) {
    http_response_code(500);
    echo json_encode(['apps' => [], 'error' => 'Impossible de localiser le répertoire racine.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$excludeDirs = ['api', 'vendor', 'node_modules', 'assets', '.git', '.github'];
$apps = [];

try {
    $iterator = new DirectoryIterator($baseDir);

    foreach ($iterator as $fileinfo) {
        if (!$fileinfo->isDir() || $fileinfo->isDot()) {
            continue;
        }

        $directoryName = $fileinfo->getFilename();
        if (in_array($directoryName, $excludeDirs, true) || (isset($directoryName[0]) && $directoryName[0] === '.')) {
            continue;
        }

        $fullPath = $fileinfo->getPathname();
        $metadata = readManifest($fullPath);
        $structuredName = parseStructuredDirectoryName($directoryName);

        $title = $metadata['title'] ?? ($structuredName['title'] ?? normaliseTitle($directoryName));
        $description = $metadata['description'] ?? null;
        $entryFile = isset($metadata['entry']) ? resolveInDirectory($fullPath, $metadata['entry']) : null;

        if ($entryFile === null) {
            $entryFile = findEntryPoint($fullPath);
        }

        if ($entryFile === null) {
            continue; // No HTML entry point found.
        }

        $iconPath = null;
        if (isset($metadata['icon'])) {
            $iconPath = resolveInDirectory($fullPath, $metadata['icon']);
        }
        if ($iconPath === null) {
            $iconPath = findIcon($fullPath);
        }

        $apps[] = array_filter([
            'name' => $title,
            'description' => $description,
            'category' => $structuredName['category'] ?? null,
            'sport' => $structuredName['sport'] ?? null,
            'url' => encodeUrlPath($directoryName . '/' . $entryFile),
            'logo' => $iconPath !== null ? encodeUrlPath($directoryName . '/' . $iconPath) : null,
        ], static fn ($value) => $value !== null && $value !== '');
    }

    usort($apps, static function (array $a, array $b) {
        $normalize = static function (?string $value): string {
            if ($value === null) {
                return '';
            }

            return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
        };

        $aTuple = [$normalize($a['category'] ?? ''), $normalize($a['sport'] ?? ''), $normalize($a['name'] ?? '')];
        $bTuple = [$normalize($b['category'] ?? ''), $normalize($b['sport'] ?? ''), $normalize($b['name'] ?? '')];

        return $aTuple <=> $bTuple;
    });

    echo json_encode(['apps' => $apps], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'apps' => [],
        'error' => 'Une erreur est survenue lors du scan : ' . $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

function readManifest(string $directory): array
{
    $manifestPath = $directory . DIRECTORY_SEPARATOR . 'app.json';
    if (!is_file($manifestPath)) {
        return [];
    }

    $contents = file_get_contents($manifestPath);
    if ($contents === false) {
        return [];
    }

    try {
        $data = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    } catch (\JsonException $exception) {
        return [];
    }

    return is_array($data) ? $data : [];
}

function parseStructuredDirectoryName(string $directoryName): ?array
{
    $normalized = trim(preg_replace('/\s+/', ' ', $directoryName) ?? $directoryName);
    if ($normalized === '') {
        return null;
    }

    $parts = preg_split('/\s+/', $normalized) ?: [];
    if (count($parts) < 3) {
        return null;
    }

    $category = array_shift($parts);
    $sport = array_shift($parts);
    $title = implode(' ', $parts);

    return [
        'category' => uppercase($category),
        'sport' => titleCase($sport),
        'title' => titleCase($title),
    ];
}

function normaliseTitle(string $directory): string
{
    $clean = preg_replace('/[_-]+/', ' ', $directory) ?? $directory;
    $clean = preg_replace('/\s+/', ' ', trim($clean)) ?? trim($clean);
    return titleCase($clean);
}

function uppercase(string $value): string
{
    if (function_exists('mb_strtoupper')) {
        return mb_strtoupper($value, 'UTF-8');
    }

    return strtoupper($value);
}

function titleCase(string $value): string
{
    if (function_exists('mb_convert_case')) {
        return mb_convert_case($value, MB_CASE_TITLE, 'UTF-8');
    }

    return ucwords(strtolower($value));
}

function resolveInDirectory(string $directory, string $relativePath): ?string
{
    $clean = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $relativePath);
    $full = realpath($directory . DIRECTORY_SEPARATOR . $clean);
    if ($full === false) {
        return null;
    }

    $directory = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (strpos($full, $directory) !== 0) {
        return null;
    }

    return ltrim(substr($full, strlen($directory)), DIRECTORY_SEPARATOR);
}

function findEntryPoint(string $directory): ?string
{
    $preferred = ['index.html', 'index.htm', 'Index.html', 'Index.htm', 'INDEX.HTML', 'INDEX.HTM'];
    foreach ($preferred as $file) {
        $candidate = $directory . DIRECTORY_SEPARATOR . $file;
        if (is_file($candidate)) {
            return basename($candidate);
        }
    }

    $files = glob($directory . DIRECTORY_SEPARATOR . '*.{htm,html,HTM,HTML}', GLOB_BRACE) ?: [];
    if (empty($files)) {
        return null;
    }

    usort($files, static fn (string $a, string $b) => strcasecmp($a, $b));

    foreach ($files as $file) {
        $base = basename($file);
        if (stripos($base, 'template') !== false || stripos($base, 'partial') !== false) {
            continue;
        }
        return $base;
    }

    return null;
}

function findIcon(string $directory): ?string
{
    $bases = ['logo', 'icon', 'thumbnail', 'cover'];
    $extensions = '{png,jpg,jpeg,svg,webp,gif,avif}';

    foreach ($bases as $base) {
        $candidates = [
            "{$base}.{$extensions}",
            "{$base}-*.{$extensions}",
            "{$base}_*.{$extensions}",
        ];

        foreach ($candidates as $candidate) {
            $files = glob($directory . DIRECTORY_SEPARATOR . $candidate, GLOB_BRACE) ?: [];
            if (!empty($files)) {
                usort($files, static fn (string $a, string $b) => strcasecmp($a, $b));
                return basename($files[0]);
            }
        }
    }

    return null;
}

function encodeUrlPath(string $path): string
{
    $segments = explode('/', str_replace('\\', '/', $path));
    $encodedSegments = array_map(static fn (string $segment) => rawurlencode($segment), $segments);
    return implode('/', $encodedSegments);
}

