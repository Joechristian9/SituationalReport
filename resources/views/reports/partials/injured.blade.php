<!-- =========== I.2 INJURED =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px;">
    2. Injured
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">Name</th>
            <th colspan="3" style="text-align: center;">Profile</th>
            <th rowspan="2" class="align-left">Diagnosis</th>
            <th rowspan="2">Date Admitted</th>
            <th rowspan="2" class="align-left">Place of Incident</th>
            <th rowspan="2" class="align-left">Remarks</th>
        </tr>
        <tr>
            <th>Age</th>
            <th>Sex</th>
            <th class="align-left">Address</th>
        </tr>
    </thead>
    <tbody>
        @forelse($injuredCasualties as $casualty)
            <tr>
                <td class="align-left">{{ $casualty['name'] }}</td>
                <td>{{ $casualty['age'] }}</td>
                <td>{{ $casualty['sex'] }}</td>
                <td class="align-left">{{ $casualty['address'] }}</td>
                <td class="align-left">{{ $casualty['diagnosis'] }}</td>
                <td>{{ \Carbon\Carbon::parse($casualty['date_admitted'])->format('F d, Y') }}</td>
                <td class="align-left">{{ $casualty['place_of_incident'] }}</td>
                <td class="align-left">{{ $casualty['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8">No injured casualty data available.</td>
            </tr>
        @endforelse
    </tbody>
    
</table>