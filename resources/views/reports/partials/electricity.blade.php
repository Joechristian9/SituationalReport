<!-- =========== ELECTRICITY SERVICES REPORT SECTION =========== -->
<div class="section-title">
    C. ELECTRICITY SERVICES
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Status</th>
            <th class="align-left">Barangays Affected</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        @forelse($electricityReports as $report)
            <tr>
                <td class="align-left">{{ $report['status'] }}</td>
                <td class="align-left">{{ $report['barangays_affected'] }}</td>
                <td class="align-left">{{ $report['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="3">No electricity service data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>