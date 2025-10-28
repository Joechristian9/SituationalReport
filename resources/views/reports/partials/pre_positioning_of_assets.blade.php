<!-- =========== PRE-POSITIONING OF RESPONSE ASSETS SECTION =========== -->
 <div class="main-title">
        DEPLOYMENT OF RESPONSE ASSETS (PRE-POSITIONING)
    </div>
<div class="section-title" style="page-break-before: auto;">
    DEPLOYMENT OF RESPONSE ASSETS (PRE-POSITIONING)
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Team/Units</th>
            <th class="align-left">Team Leader</th>
            <th>No. Personnel Deployed</th>
            <th class="align-left">Response Assets</th>
            <th class="align-left">Capability</th>
            <th class="align-left">Area of Deployment</th>
        </tr>
    </thead>
    <tbody>
        @forelse($prePositioningReports as $report)
            <tr>
                <td class="align-left">{{ $report['team_units'] }}</td>
                <td class="align-left">{{ $report['team_leader'] }}</td>
                <td>{{ $report['personnel_deployed'] }}</td>
                <td class="align-left">{{ $report['response_assets'] }}</td>
                <td class="align-left">{{ $report['capability'] }}</td>
                <td class="align-left">{{ $report['area_of_deployment'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6">No pre-positioning data available.</td>
            </tr>
        @endforelse
    </tbody>
    {{-- <tfoot>
        <tr>
            <th class="align-left" colspan="2">Grand Total</th>
            <th>{{ $prePositioningTotalPersonnel ?? 0 }}</th>
            <th colspan="3"></th>
        </tr>
    </tfoot> --}}
</table>