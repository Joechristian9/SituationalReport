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
            padding-bottom: 8px;
            margin-bottom: 0;
        }
        
        .header-border {
            width: 100%;
            border-bottom: 3px solid #003d82;
            margin: 0 -40px 15px -40px;
            padding: 0 40px;
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
        
        .main-title { 
            background-color: #4472C4; 
            color: white; 
            padding: 10px 15px; 
            font-weight: bold; 
            font-size: 14px; 
            margin: 20px 0 15px 0; 
            text-align: left;
            letter-spacing: 1px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 13px;
            margin: 15px 0 10px 0;
            color: #333;
            padding-left: 40px;
        }
        
        .subtitle {
            font-size: 12px;
            margin: 10px 0 8px 0;
            color: #666;
            padding-left: 60px;
        }
        
        .pdf-header-info p { margin: 0; padding: 2px 0; font-size: 13px; }
        
        /* --- Table Styling to match image --- */
        table { 
            width: calc(100% - 60px);
            border-collapse: collapse; 
            margin-bottom: 20px; 
            border: 1px solid #666;
            margin-left: 60px;
        }
        th, td { 
            border: 1px solid #666; 
            text-align: left; 
            padding: 6px 10px; 
            font-size: 11px;
            vertical-align: middle;
            background-color: #fff;
        }
        th { 
            font-weight: bold; 
            color: #333;
        }
        
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
            
            /* Make header repeat on every page using thead */
            .report-header {
                page-break-inside: avoid;
            }
            
            /* Add page break before main sections */
            .main-title {
                page-break-before: auto;
                page-break-after: avoid;
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
                page-break-inside: auto;
            }
            table thead {
                display: table-header-group;
            }
            th, td {
                padding: 4px;
            }
            tr {
                page-break-inside: avoid;
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
    
    {{-- Full-width blue border line --}}
    <div class="header-border"></div>
    
    {{-- Memorandum Section --}}
    <div style="margin-top: 30px; margin-bottom: 30px;">
        <div style="border-top: 3px solid #cc0000; margin-bottom: 15px;"></div>
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">MEMORANDUM</h2>
        
        <table style="width: 100%; border: none; margin-bottom: 20px;">
            <tr style="border: none;">
                <td style="width: 15%; border: none; padding: 5px 0; font-weight: bold;">FOR</td>
                <td style="width: 5%; border: none; padding: 5px 0;">:</td>
                <td style="border: none; padding: 5px 0;">OCDRO2; DILG, PDRRMO</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 5px 0; font-weight: bold;">FROM</td>
                <td style="border: none; padding: 5px 0;">:</td>
                <td style="border: none; padding: 5px 0;">CDRRMO ILAGAN</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 5px 0; font-weight: bold;">SUBJECT</td>
                <td style="border: none; padding: 5px 0;">:</td>
                <td style="border: none; padding: 5px 0; font-weight: bold;">
                    TERMINAL REPORT re: TYPHOON "{{ strtoupper($typhoonName ?? 'N/A') }}"
                </td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 5px 0; font-weight: bold;">DATE</td>
                <td style="border: none; padding: 5px 0;">:</td>
                <td style="border: none; padding: 5px 0;">As of {{ now()->format('d F Y / g:i A') }}</td>
            </tr>
        </table>
        
        <div style="border-bottom: 2px solid #333; margin-bottom: 10px;"></div>
        
        <p style="font-size: 12px; font-style: italic; color: #666; margin-bottom: 20px;">
            Sources: CDRRMO member-agencies, BDRRMC and others:
        </p>
    </div>

    <div class="main-title">
        I. SITUATION OVERVIEW
    </div>

    @include('reports.partials.weather')
    @include('reports.partials.electricity')
    @include('reports.partials.water_services')
    @include('reports.partials.communication')
    @include('reports.partials.roads_and_bridges')
    @include('reports.partials.agriculture')
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