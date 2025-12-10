<!-- =========== ROADS AND BRIDGES REPORT SECTION =========== -->
<div class="section-title">
    C.  STATUS OF ROADS AND BRIDGES (As of {{ now()->format('d F Y / g:i A') }}) SOURCE:
</div>
<div class="subtitle" style="font-style: italic; padding-left: 60px; margin-top: 5px; margin-bottom: 10px;">
    (CEO, PNP, BDRRMC)
</div>

<!-- C.1 Roads Table -->
<div class="subtitle" style="font-weight: bold; margin-bottom: 10px; padding-left: 60px;">
    C.1 ROADS
</div>
<table>
    <thead>
        <tr>
            <th class="align-left">Road<br>Classification</th>
            <th class="align-left">Name of<br>Road</th>
            <th class="align-left">Status</th>
            <th class="align-left">Areas/Barangays<br>Affected</th>
            <th class="align-left">Re-<br>routing</th>
            <th class="align-left">REMARKS</th>
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


<!-- C.2 Bridges Table -->
@include('reports.partials.bridges')