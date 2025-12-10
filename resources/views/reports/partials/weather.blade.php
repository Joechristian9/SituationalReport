<!-- =========== WEATHER REPORT SECTION =========== -->
<div class="section-title">
    A. PRESENT WEATHER:
</div>

@if($weatherReports->count() > 0)
    @php $report = $weatherReports->first(); @endphp
    <table>
        <tbody>
            <tr>
                <td rowspan="4" style="width: 25%; vertical-align: middle; text-align: center; color: #666;">
                    {{ $report['municipality'] ?? 'City of Ilagan' }}
                </td>
                <td style="width: 25%; font-weight: bold; color: #333;">Sky Condition</td>
                <td style="width: 50%; color: #333;">{{ $report['sky_condition'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #333;">Wind</td>
                <td style="color: #333;">{{ $report['wind'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #333;">Precipitation</td>
                <td style="color: #333;">{{ $report['precipitation'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #333;">Sea Condition</td>
                <td style="color: #333;">{{ $report['sea_condition'] ?? 'N/A' }}</td>
            </tr>
        </tbody>
    </table>
@else
    <p style="font-style: italic; color: #666;">No weather data available.</p>
@endif