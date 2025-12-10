<!-- =========== AGRICULTURE REPORT SECTION =========== -->
<div class="section-title" style="page-break-before: auto;">
    D.  Cost of Damages As of {{ now()->format('d F Y') }}
</div>

<div class="subtitle" style="font-weight: bold; margin-bottom: 10px; padding-left: 60px;">
    D.1 Damage to Agriculture
</div>

<div class="subtitle" style="font-style: italic; padding-left: 80px; margin-top: 5px; margin-bottom: 10px;">
    Source: CAO
</div>

<div class="subtitle" style="font-weight: bold; margin-bottom: 10px; padding-left: 80px;">
    a. Crops/Fishery
</div>

<table>
    <thead>
        <tr>
            <th class="align-left" rowspan="2">Crops<br>affected</th>
            <th class="align-left" colspan="4" style="text-align: center;">Area Affected</th>
        </tr>
        <tr>
            <th class="align-left">Standing<br>Crop (Ha)</th>
            <th class="align-left">Stage of<br>crop</th>
            <th class="align-left">TOTAL<br>Area<br>Affected<br>(Ha)</th>
            <th class="align-left">Total Production<br>Loss</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totalStandingCrop = 0;
            $totalAreaAffected = 0;
            $totalProductionLoss = 0;
        @endphp
        
        @forelse($agricultureReports as $report)
            @php
                $totalStandingCrop += $report['standing_crop_ha'] ?? 0;
                $totalAreaAffected += $report['total_area_affected_ha'] ?? 0;
                $totalProductionLoss += $report['total_production_loss'] ?? 0;
            @endphp
            <tr>
                <td class="align-left">{{ $report['crops_affected'] ?? 'N/A' }}</td>
                <td class="align-left">{{ number_format($report['standing_crop_ha'] ?? 0, 2) }}</td>
                <td class="align-left">{{ $report['stage_of_crop'] ?? 'N/A' }}</td>
                <td class="align-left">{{ number_format($report['total_area_affected_ha'] ?? 0, 2) }}</td>
                <td class="align-left">{{ number_format($report['total_production_loss'] ?? 0, 2) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="align-left">No agriculture data available.</td>
            </tr>
        @endforelse
        
        @if($agricultureReports->count() > 0)
            <tr style="font-weight: bold; background-color: #f0f0f0;">
                <td class="align-left">TOTAL</td>
                <td class="align-left">{{ number_format($totalStandingCrop, 2) }}</td>
                <td class="align-left"></td>
                <td class="align-left">{{ number_format($totalAreaAffected, 2) }}</td>
                <td class="align-left">{{ number_format($totalProductionLoss, 2) }}</td>
            </tr>
        @endif
    </tbody>
</table>
