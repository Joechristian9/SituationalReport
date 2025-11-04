<!-- =========== COMMUNICATION SERVICES REPORT SECTION =========== -->
<div class="section-title">
    E. COMMUNICATION SERVICES
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Globe</th>
            <th class="align-left">Smart</th>
            <th class="align-left">PLDT Landline</th>
            <th class="align-left">PLDT Internet</th>
            <th class="align-left">VHF Radio</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        @forelse($communicationReports as $report)
            <tr>
                <td class="align-left">{{ $report['globe'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['smart'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['pldt_landline'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['pldt_internet'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['vhf'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['remarks'] ?? '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6">No communication service data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>
