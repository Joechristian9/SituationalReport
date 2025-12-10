<!-- =========== AFFECTED TOURISTS SECTION =========== -->
<div class="section-title" style="page-break-before: auto;">
    I.  AFFECTED TOURISTS
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">Province/ City/ Municipality</th>
            <th rowspan="2" class="align-left">Location</th>
            <th colspan="2" style="text-align: center;">Number of Tourists</th>
            <th rowspan="2" class="align-left">Remarks</th>
        </tr>
        <tr>
            <th>Local</th>
            <th>Foreign</th>
        </tr>
    </thead>
    <tbody>
        @forelse($affectedTourists as $touristReport)
            <tr>
                <td class="align-left">{{ $touristReport['province_city_municipality'] }}</td>
                <td class="align-left">{{ $touristReport['location'] }}</td>
                <td>{{ $touristReport['local_tourists'] }}</td>
                <td>{{ $touristReport['foreign_tourists'] }}</td>
                <td class="align-left">{{ $touristReport['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5">No affected tourist data available.</td>
            </tr>
        @endforelse
    </tbody>
    
</table>