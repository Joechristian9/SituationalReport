<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Situational Report for {{ $selectedYear }}</title>
    <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
    <style>
        /* --- General Setup --- */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f7f9;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        
        /* --- Layout Containers --- */
        .report-container { background-color: #fff; max-width: 800px; margin: 0 auto; padding: 30px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .download-container { position: fixed; top: 20px; right: 20px; z-index: 1000; }
        
        /* ================================================================ */
        /* == START: ENHANCED HEADER STYLES                              == */
        /* ================================================================ */
        
        /* --- Header with Logos Styles --- */
        .report-header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #003d82;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        .header-left, .header-center, .header-right {
            display: table-cell;
            vertical-align: middle;
        }
        
        .header-left, .header-right {
            width: 90px;
            text-align: center;
        }
        
        .header-center {
            text-align: center;
            padding: 0 10px;
        }
        
        .header-logo {
            width: 75px;
            height: 75px;
        }
        
        .header-center h1 {
            margin: 0;
            line-height: 1.2;
            font-size: 13px;
            font-weight: normal;
            color: #333;
        }
        
        .header-center h2 {
            margin: 1px 0;
            line-height: 1.2;
            font-size: 17px;
            font-weight: bold;
            color: #003d82;
        }
        
        .header-center p {
            margin: 1px 0;
            line-height: 1.3;
            font-size: 10px;
            color: #666;
        }
        
        .header-center .office-title {
            margin-top: 4px;
            font-weight: bold;
            font-size: 11px;
            color: #555;
        }
        
        .header-center .office-address {
            font-size: 9px;
            color: #777;
        }
        /* ================================================================ */
        /* == END: ENHANCED HEADER STYLES                                == */
        /* ================================================================ */
        
        .main-title { background-color: #FFC107; color: #333; padding: 12px; font-weight: bold; font-size: 16px; margin: 30px 0 25px 0; text-align: center; border-radius: 4px; }
        .pdf-header-info p { margin: 0; padding: 2px 0; font-size: 13px; }
        
        /* --- Original Table Styling --- */
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th, td { border: 1px solid #999; text-align: center; padding: 6px; }
        th { background-color: #e9ecef; font-weight: bold; }
        
        /* --- Download Button --- */
        .download-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; border: none; cursor: pointer; transition: background-color 0.3s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
        .download-btn:hover { background-color: #0056b3; }
        .download-btn svg { width: 16px; height: 16px; }

        /* --- PDF & Print Specific Styles --- */
        @if(isset($isDownloading) && $isDownloading)
            body { 
                background-color: #fff; 
                padding: 0;
                font-family: 'DejaVu Sans', sans-serif; /* Faster PDF font */
            }
            .report-container { 
                box-shadow: none; 
                border-radius: 0; 
                padding: 15px;
                max-width: 100%;
            }
            /* Optimize header for PDF */
            .header-logo {
                width: 60px;
                height: 60px;
            }
            .header-center h1 {
                font-size: 12px;
            }
            .header-center h2 {
                font-size: 14px;
            }
            .report-header h1 {
                font-size: 22px;
            }
            /* Optimize tables for PDF */
            table {
                font-size: 11px;
            }
            th, td {
                padding: 4px;
            }
        @endif
        
        .no-print { display: block; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>

    @if(!isset($isDownloading) || !$isDownloading)
        <div class="download-container no-print">
            <a href="{{ route('reports.download', ['year' => $selectedYear]) }}" class="download-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download PDF
            </a>
        </div>
    @endif

<div class="report-container">

    {{-- Header with logos for both WEB and PDF --}}
    <header class="report-header">
        <div class="header-left">
            @php
                $imagePath = public_path('images/ilagan.jpeg');
                $imageData = base64_encode(file_get_contents($imagePath));
                $src = 'data:image/jpeg;base64,' . $imageData;
            @endphp
            <img src="{{ $src }}" alt="City of Ilagan Logo" class="header-logo">
        </div>
        <div class="header-center">
            <h1>Republic of the Philippines</h1>
            <h2>CITY OF ILAGAN</h2>
            <h1>Province of Isabela</h1>
            <p class="office-title">CITY DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</p>
            <p class="office-address">CDRRMO Building, City Hall Compound, San Vicente, City of Ilagan, Isabela 3300</p>
        </div>
        <div class="header-right">
            @php
                $imagePath = public_path('images/ilagan.jpeg');
                $imageData = base64_encode(file_get_contents($imagePath));
                $src = 'data:image/jpeg;base64,' . $imageData;
            @endphp
            <img src="{{ $src }}" alt="City of Ilagan Logo" class="header-logo">
        </div>
    </header>
    
    <div class="pdf-header-info">
        <p>As of: {{ now()->format('h:i A, F d, Y') }}</p>
    </div>

    <div class="main-title">
        SITUATION OVERVIEW
    </div>

    @include('reports.partials.weather')
    @include('reports.partials.water_level')
    @include('reports.partials.electricity')
    @include('reports.partials.water_services')
    @include('reports.partials.communication')
    @include('reports.partials.roads_and_bridges')
    @include('reports.partials.pre_emptive_evacuation')
    @include('reports.partials.declaration_state_of_calamity')
    @include('reports.partials.pre_positioning_of_assets')
    @include('reports.partials.incidents_monitored')
    @include('reports.partials.casualties')
    @include('reports.partials.affected_tourists')
    @include('reports.partials.damaged_houses') 
    @include('reports.partials.suspension_of_classes_and_work')

</div>

</body>
</html>