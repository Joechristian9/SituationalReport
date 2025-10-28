<!-- =========== E.2 BRIDGES =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px;">
    F.2 Bridges
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Classification</th>
            <th class="align-left">Name of Bridge</th>
            <th class="align-left">Status</th>
            <th class="align-left">Areas Affected</th>
            <th class="align-left">Re-routing</th>
            <th class="align-left">Remarks</th>
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