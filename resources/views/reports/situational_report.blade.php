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
        
        /* --- Shared Header Styles (for Web & PDF) --- */
        .report-header {
            text-align: center;
            border-bottom: 1px solid #e0e0e0; /* A soft separator line */
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .report-header .logo-title {
            display: inline-flex;
            align-items: center;
            gap: 15px;
            text-align: left;
        }
        .report-header img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
        }
        /* --- Main Title Styling --- */
        .report-header h1 {
            font-size: 26px; /* Larger font for more impact */
            margin: 0;
            font-weight: 600; /* Bolder, but not overly heavy */
            color: #2c3e50; /* A dark, professional color */
        }
        /* --- Sub-heading Styling --- */
        .report-header p {
            font-size: 15px;
            margin: 4px 0 0 0; /* Adjust top margin for perfect spacing */
            color: #8a8a8a; /* Lighter color for secondary info */
            letter-spacing: 0.5px; /* Adds an elegant, airy feel */
        }
        .report-header p strong {
            color: #555; /* Make the year slightly darker for readability */
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
            body { background-color: #fff; padding: 0; }
            .report-container { box-shadow: none; border-radius: 0; padding: 10px; }
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

    {{-- The centered header for the WEB VIEW --}}
    @if(!isset($isDownloading) || !$isDownloading)
        <header class="report-header no-print">
            <div class="logo-title">
                <img src="/images/ilagan.jpeg" alt="City Logo">
                <div>
                    <h1>Situational Report</h1>
                    <p>For the Year: <strong>{{ $selectedYear }}</strong></p>
                </div>
            </div>
        </header>
    @endif

    {{-- The new header for the PDF DOCUMENT --}}
    @if(isset($isDownloading) && $isDownloading)
        <header class="report-header">
            <div class="logo-title">
                <img src="{{ public_path('/images/ilagan.jpeg') }}" alt="City Logo">
                <div>
                    <h1>Situational Report</h1>
                    <p>For the Year: <strong>{{ $selectedYear }}</strong></p>
                </div>
            </div>
        </header>
    @endif
    
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