<!-- =========== ROADS AND BRIDGES REPORT SECTION =========== -->
<div class="section-title">
    F. ROADS AND BRIDGES
</div>

<!-- E.1 Roads Table -->
<div class="subtitle" style="font-weight: bold; margin-bottom: 10px;">
    F.1 Roads
</div>
<table>
    <thead>
        <tr>
            <th class="align-left">Classification</th>
            <th class="align-left">Name of Road</th>
            <th class="align-left">Status</th>
            <th class="align-left">Areas Affected</th>
            <th class="align-left">Re-routing</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        @forelse($roadReports as $report)
            <tr>
                <td class="align-left">{{ $report['road_classification'] }}</td>
                <td class="align-left">{{ $report['name_of_road'] }}</td>
                <td class="align-left">{{ $report['status'] }}</td>
                <td class="align-left">{{ $report['areas_affected'] }}</td>
                <td class="align-left">{{ $report['re_routing'] }}</td>
                <td class="align-left">{{ $report['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6">No road data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>


<!-- E.2 Bridges Table -->
@include('reports.partials.bridges')