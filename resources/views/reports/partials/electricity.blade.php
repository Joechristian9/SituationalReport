<!-- =========== ELECTRICITY SERVICES REPORT SECTION =========== -->
<div class="section-title">
    B.  STATUS OF LIFELINES:
</div>

<div class="subtitle" style="font-weight: bold; font-style: italic; padding-left: 60px; margin-top: 10px; margin-bottom: 5px;">
    B.1 ELECTRICITY: (As of: {{ now()->format('d F Y / g:i A') }})
</div>
<div style="border-bottom: 1px solid #333; margin: 0 60px 10px 60px;"></div>
<div class="subtitle" style="font-style: italic; padding-left: 80px; margin-top: 5px; margin-bottom: 10px;">
    Source: ISELCO II, BDRRMC
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">STATUS OF<br>ELECTRICITY SERVICES</th>
            <th class="align-left">BARANGAYS AFFECTED</th>
            <th class="align-left">REMARKS</th>
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