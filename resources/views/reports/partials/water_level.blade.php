<!-- =========== WATER LEVEL REPORT SECTION =========== -->
<div class="section-title">
    B. WATER LEVEL STATION
</div>
<div class="subtitle">
    Source of Data: Water Level Monitoring System
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">GAUGING STATION</th>
            <th colspan="3">WARNING WATER LEVEL (Meter)</th>
            <th rowspan="2" class="align-left">Areas Likely to be Affected</th>
        </tr>
        <tr>
            <th>Current Level</th>
            <th>ALARM</th>
            <th>CRITICAL</th>
        </tr>
    </thead>
    <tbody>
        @forelse($waterLevelReports as $report)
            <tr>
                <td class="align-left">{{ $report['gauging_station'] }}</td>
                <td>{{ $report['current_level'] }}</td>
                <td>{{ $report['alarm_level'] }}</td>
                <td>{{ $report['critical_level'] }}</td>
                <td class="align-left">{{ $report['affected_areas'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5">No water level data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>

<div class="note">
    Note: For LGUs with existing Water Level monitoring system...
</div>