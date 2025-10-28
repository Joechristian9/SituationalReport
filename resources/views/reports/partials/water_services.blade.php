<!-- =========== WATER SERVICES REPORT SECTION =========== -->
<div class="section-title">
    D. WATER SERVICES
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Source of Water</th>
            <th class="align-left">Barangays Served</th>
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