<!-- =========== PRE-EMPTIVE EVACUATION REPORT SECTION =========== -->
<div class="main-title">
        PRE-EMPTIVE EVACUATION
    </div>

<div class="section-title">
   PRE-EMPTIVE EVACUATION
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">Barangay</th>
            <th rowspan="2" class="align-left">Evacuation Center</th>
            <th colspan="2">Inside Evacuation Center</th>
            <th colspan="3">Outside Evacuation Center</th>
            <th colspan="2">TOTAL</th>
        </tr>
        <tr>
            <!-- Inside EC -->
            <th>Families</th>
            <th>Persons</th>
            <!-- Outside EC -->
            <th class="align-left">Location</th>
            <th>Families</th>
            <th>Persons</th>
            <!-- Total -->
            <th>Families</th>
            <th>Persons</th>
        </tr>
    </thead>
    <tbody>
        @forelse($preEmptiveReports as $report)
            <tr>
                <td class="align-left">{{ $report['barangay'] }}</td>
                <td class="align-left">{{ $report['evacuation_center'] }}</td>
                <td>{{ $report['families'] }}</td>
                <td>{{ $report['persons'] }}</td>
                <td class="align-left">{{ $report['outside_center'] }}</td>
                <td>{{ $report['outside_families'] }}</td>
                <td>{{ $report['outside_persons'] }}</td>
                <td>{{ $report['total_families'] }}</td>
                <td>{{ $report['total_persons'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="9">No pre-emptive evacuation data available.</td>
            </tr>
        @endforelse
    </tbody>
    <tfoot>
        <tr>
            <th colspan="2" class="align-left">Grand Total</th>
            <th>{{ $preEmptiveTotals['families'] ?? 0 }}</th>
            <th>{{ $preEmptiveTotals['persons'] ?? 0 }}</th>
            <th></th>
            <th>{{ $preEmptiveTotals['outside_families'] ?? 0 }}</th>
            <th>{{ $preEmptiveTotals['outside_persons'] ?? 0 }}</th>
            <th>{{ $preEmptiveTotals['total_families'] ?? 0 }}</th>
            <th>{{ $preEmptiveTotals['total_persons'] ?? 0 }}</th>
        </tr>
    </tfoot>
</table>