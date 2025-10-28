<!-- =========== I.3 MISSING =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px;">
    3. Missing
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">Name</th>
            <th colspan="3" style="text-align: center;">Profile</th>
            <th rowspan="2" class="align-left">Cause</th>
            <th rowspan="2" class="align-left">Remarks</th>
        </tr>
        <tr>
            <th>Age</th>
            <th>Sex</th>
            <th class="align-left">Address</th>
        </tr>
    </thead>
    <tbody>
        @forelse($missingCasualties as $casualty)
            <tr>
                <td class="align-left">{{ $casualty['name'] }}</td>
                <td>{{ $casualty['age'] }}</td>
                <td>{{ $casualty['sex'] }}</td>
                <td class="align-left">{{ $casualty['address'] }}</td>
                <td class="align-left">{{ $casualty['cause'] }}</td>
                <td class="align-left">{{ $casualty['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6">No missing casualty data available.</td>
            </tr>
        @endforelse
    </tbody>
    
</table>