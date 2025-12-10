<!-- =========== WATER SERVICES REPORT SECTION =========== -->
<div class="subtitle" style="font-weight: bold; font-style: italic; padding-left: 60px; margin-top: 15px; margin-bottom: 5px;">
    B.2 WATER: (As of: {{ now()->format('d F Y / g:i A') }})
</div>
<div style="border-bottom: 1px solid #333; margin: 0 60px 10px 60px;"></div>
<div class="subtitle" style="font-style: italic; padding-left: 80px; margin-top: 5px; margin-bottom: 10px;">
    Source: Ilagan Water District
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Source of<br>Water</th>
            <th class="align-left">Barangays<br>Served</th>
            <th class="align-left">Status</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        @forelse($waterServiceReports as $report)
            <tr>
                <td class="align-left">{{ $report['source_of_water'] }}</td>
                <td class="align-left">{{ $report['barangays_served'] }}</td>
                <td class="align-left">{{ $report['status'] }}</td>
                <td class="align-left">{{ $report['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4">No water service data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>

<div class="subtitle" style="font-style: italic; padding-left: 80px; margin-top: 5px; margin-bottom: 15px;">
    Analysis: City of Ilagan Water District services operational. Potable water available.
</div>