<!DOCTYPE html>
<html>
<head>
    <title>Situational Report</title>
    <style>
        body { 
            font-family: sans-serif; 
            font-size: 12px;
        }
        .header {
            text-align: left;
            margin-bottom: 20px;
        }
        .header p {
            margin: 0;
            padding: 2px 0;
        }
        .main-title {
            background-color: #FFC107; /* Yellow/orange color */
            padding: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 15px 0;
            text-align: center;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 12px;
            margin-bottom: 20px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th, td { 
            border: 1px solid #999; 
            text-align: center; 
            padding: 6px; 
        }
        th { 
            background-color: #e9ecef; 
            font-weight: bold;
        }
        .align-left {
            text-align: left;
        }
        .note {
            font-size: 10px;
            margin-top: 15px;
            font-style: italic;
        }
        .download-button {
            padding: 10px 15px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        /* This class hides elements when printing/generating PDF */
        @media print {
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="header">
        <p>As of: {{ now()->format('h:i A, F d, Y') }}</p>
    </div>

    <div class="main-title">
        SITUATION OVERVIEW
    </div>

     <!-- Include Weather Report Table -->
    @include('reports.partials.weather')

    <!-- Include Water Level Table -->
    @include('reports.partials.water_level')

    <!-- Include Electricity Services Table -->
    @include('reports.partials.electricity')

</body>
</html>