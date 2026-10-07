<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Installable app + offline use (see public/sw.js) -->
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
        <meta name="theme-color" content="#2563eb">
        <!-- ?v= busts the browser's long-lived icon cache when the logo changes. -->
        <link rel="icon" href="{{ asset('favicon.ico') }}?v=2" sizes="48x48">
        <link rel="icon" type="image/png" href="{{ asset('images/icons/favicon-32.png') }}?v=2" sizes="32x32">
        <link rel="apple-touch-icon" href="{{ asset('images/icons/apple-touch-icon.png') }}?v=2">
        <meta name="mobile-web-app-capable" content="yes">
        <!-- Older iPhones still read the apple- prefixed tag; the standard one above silences Chrome's warning. -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="SitRep">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
