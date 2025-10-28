<!-- =========== DAMAGED HOUSES SECTION =========== -->
<div class="section-title" style="page-break-before: auto;">
    E. DAMAGED HOUSES
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Barangay</th>
            <th>Partially</th>
            <th>Totally</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        {{-- 
          Loop through the $damagedHouses array passed from the controller.
          The @forelse directive is perfect for this.
        --}}
        @forelse($damagedHouses as $report)
            <tr>
                <td class="align-left">{{ $report['barangay'] }}</td>
                <td>{{ number_format($report['partially']) }}</td>
                <td>{{ number_format($report['totally']) }}</td>
                <td>{{ number_format($report['total']) }}</td>
            </tr>
        @empty
            {{-- This block is displayed if the $damagedHouses array is empty. --}}
            <tr>
                <td colspan="4">No data on damaged houses available.</td>
            </tr>
        @endforelse
    </tbody>
    <tfoot>
        <tr>
            <th class="align-left">GRAND TOTAL</th>
            {{-- 
              Display the pre-calculated totals passed from the controller.
            --}}
            <th>{{ number_format($grandTotalPartially ?? 0) }}</th>
            <th>{{ number_format($grandTotalTotally ?? 0) }}</th>
            <th>{{ number_format($grandTotal ?? 0) }}</th>
        </tr>
    </tfoot>
</table>