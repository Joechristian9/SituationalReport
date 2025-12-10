<!-- =========== C.2 BRIDGES/OVERFLOW BRIDGES =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px; padding-left: 60px;">
    C.2 BRIDGES/OVERFLOW BRIDGES
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Road<br>Classification</th>
            <th class="align-left">Name of<br>Bridges</th>
            <th class="align-left">Status</th>
            <th class="align-left">Areas/Barangays<br>Affected</th>
            <th class="align-left">Re-<br>routing</th>
            <th class="align-left">REMARKS</th>
        </tr>
    </thead>
    <tbody>
        @forelse($bridgeReports as $report)
            <tr>
                <td class="align-left">{{ $report['road_classification'] }}</td>
                <td class="align-left">{{ $report['name_of_bridge'] }}</td>
                <td class="align-left">{{ $report['status'] }}</td>
                <td class="align-left">{{ $report['areas_affected'] }}</td>
                <td class="align-left">{{ $report['re_routing'] }}</td>
                <td class="align-left">{{ $report['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6">No bridge data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>