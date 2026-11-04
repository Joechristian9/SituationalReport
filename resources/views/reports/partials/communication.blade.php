<!-- =========== COMMUNICATION SERVICES REPORT SECTION =========== -->
<div class="subtitle" style="font-weight: bold; font-style: italic; padding-left: 60px; margin-top: 15px; margin-bottom: 5px;">
    B.3 COMMUNICATIONS (As of: {{ now()->format('d F Y / g:i A') }})
</div>
<div style="border-bottom: 1px solid #333; margin: 0 60px 10px 60px;"></div>
<div class="subtitle" style="font-style: italic; padding-left: 80px; margin-top: 5px; margin-bottom: 10px;">
    Source: CDRRMO and BDRRMC
</div>

<table>
    <thead>
        <tr>
            <th colspan="2" class="align-left">CELLPHONE (SMS &<br>CALL)</th>
            <th class="align-left">Internet</th>
            <th class="align-left">Radio</th>
            @if($communicationServices->isNotEmpty())
                <th colspan="{{ $communicationServices->count() }}" class="align-left">ADDED SERVICES</th>
            @endif
            <th class="align-left">REMARKS</th>
        </tr>
        <tr>
            <th class="align-left">GLOBE</th>
            <th class="align-left">SMART</th>
            <th class="align-left">POLARIS</th>
            <th class="align-left">VHF</th>
            @foreach($communicationServices as $service)
                <th class="align-left">{{ $service->name }}</th>
            @endforeach
            <th class="align-left"></th>
        </tr>
    </thead>
    <tbody>
        @forelse($communicationReports as $report)
            <tr>
                <td class="align-left">{{ $report['globe'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['smart'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['pldt_internet'] ?? 'N/A' }}</td>
                <td class="align-left">{{ $report['vhf'] ?? 'N/A' }}</td>
                @foreach($communicationServices as $service)
                    <td class="align-left">{{ $report->serviceValues->firstWhere('service_id', $service->id)?->status ?? 'N/A' }}</td>
                @endforeach
                <td class="align-left">{{ $report['remarks'] ?? '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="{{ 5 + $communicationServices->count() }}">No communication service data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>
