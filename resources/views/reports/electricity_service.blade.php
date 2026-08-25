<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electricity Service Report - {{ $typhoon->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 11pt;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .header h1 {
            font-size: 18pt;
            margin-bottom: 5px;
            color: #1a1a1a;
        }
        
        .header h2 {
            font-size: 14pt;
            color: #444;
            font-weight: normal;
        }
        
        .info-box {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #f59e0b;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #333;
        }
        
        .info-value {
            color: #555;
        }
        
        .section-title {
            font-size: 13pt;
            font-weight: bold;
            margin: 25px 0 15px 0;
            padding: 8px 12px;
            background-color: #f59e0b;
            color: white;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th {
            background-color: #f59e0b;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
        }
        
        td {
            padding: 10px;
            border: 1px solid #ddd;
            vertical-align: top;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .status-operational {
            color: #059669;
            font-weight: bold;
        }
        
        .status-partial {
            color: #d97706;
            font-weight: bold;
        }
        
        .status-outage {
            color: #dc2626;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }
        
        .timestamp {
            font-style: italic;
            color: #888;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ELECTRICITY SERVICE REPORT</h1>
        <h2>{{ $typhoon->name }}</h2>
    </div>
    
    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Disaster Name:</span>
            <span class="info-value">{{ $typhoon->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Disaster Type:</span>
            <span class="info-value">{{ $typhoon->disaster_type ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">{{ ucfirst($typhoon->status) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Started:</span>
            <span class="info-value">{{ \Carbon\Carbon::parse($typhoon->started_at)->format('F d, Y h:i A') }}</span>
        </div>
        @if($typhoon->ended_at)
        <div class="info-row">
            <span class="info-label">Ended:</span>
            <span class="info-value">{{ \Carbon\Carbon::parse($typhoon->ended_at)->format('F d, Y h:i A') }}</span>
        </div>
        @endif
        <div class="info-row">
            <span class="info-label">Total Reports:</span>
            <span class="info-value">{{ $reports->count() }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Reported By:</span>
            <span class="info-value">{{ $user->name }}</span>
        </div>
    </div>
    
    <div class="section-title">ELECTRICITY SERVICE REPORTS</div>
    
    <p class="timestamp">Source: ISELCO II, BDRRMC</p>
    
    <table>
        <thead>
            <tr>
                <th style="width: 8%;">#</th>
                <th style="width: 15%;">Status</th>
                <th style="width: 35%;">Barangays Affected</th>
                <th style="width: 27%;">Remarks</th>
                <th style="width: 15%;">Date/Time</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports as $index => $report)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td class="status-{{ strtolower($report->status) }}">
                    {{ $report->status }}
                </td>
                <td>{{ $report->barangays_affected ?: '-' }}</td>
                <td>{{ $report->remarks ?: '-' }}</td>
                <td style="font-size: 9pt;">
                    {{ \Carbon\Carbon::parse($report->updated_at)->format('M d, Y') }}<br>
                    {{ \Carbon\Carbon::parse($report->updated_at)->format('h:i A') }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: #888;">
                    No electricity service reports available for this disaster.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    <div class="footer">
        <p>Generated on: {{ $generatedAt }}</p>
        <p>City Disaster Risk Reduction and Management Office - Ilagan City</p>
    </div>
</body>
</html>
