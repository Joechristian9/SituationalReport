<!-- =========== DECLARATION OF STATE OF CALAMITY SECTION =========== -->
<div class="main-title">
    III. DECLARATION OF STATE OF CALAMITY
</div>
<div class="section-title">
    E.  DECLARATION OF STATE OF CALAMITY
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Declared By</th>
            <th class="align-left">Resolution Number</th>
            <th class="align-left">Date Approved</th>
        </tr>
    </thead>
    <tbody>
        @forelse($uscDeclarations as $declaration)
            <tr>
                <td class="align-left">{{ $declaration['declared_by'] }}</td>
                <td class="align-left">{{ $declaration['resolution_number'] }}</td>
                <td class="align-left">{{ \Carbon\Carbon::parse($declaration['date_approved'])->format('F d, Y') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="3">No State of Calamity declaration data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>