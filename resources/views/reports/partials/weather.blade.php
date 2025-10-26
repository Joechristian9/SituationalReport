<!-- =========== WEATHER REPORT SECTION =========== -->
<div class="section-title">
    A. PRESENT WEATHER
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Municipality</th>
            <th>Sky Condition</th>
            <th>Wind</th>
            <th>Precipitation</th>
            <th>Sea Condition</th>
        </tr>
    </thead>
    <tbody>
        @forelse($weatherReports as $report)
            <tr>
                <td class="align-left">{{ $report['municipality'] }}</td>
                <td>{{ $report['sky_condition'] }}</td>
                <td>{{ $report['wind'] }}</td>
                <td>{{ $report['precipitation'] }}</td>
                <td>{{ $report['sea_condition'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5">No weather data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>