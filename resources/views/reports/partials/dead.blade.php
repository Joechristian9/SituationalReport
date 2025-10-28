<!-- =========== I.1 DEAD =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px;">
    1. Dead
</div>

<table>
    <thead>
        <tr>
            <th rowspan="2" class="align-left">Name</th>
            <th colspan="3" style="text-align: center;">Profile</th>
            <th rowspan="2" class="align-left">Cause of Death</th>
            <th rowspan="2">Date Died</th>
            <th rowspan="2" class="align-left">Place of Incident</th>
        </tr>
        <tr>
            <th>Age</th>
            <th>Sex</th>
            <th class="align-left">Address (Home)</th>
        </tr>
    </thead>
    <tbody>
        @forelse($deadCasualties as $casualty)
            <tr>
                <td class="align-left">{{ $casualty['name'] }}</td>
                <td>{{ $casualty['age'] }}</td>
                <td>{{ $casualty['sex'] }}</td>
                <td class="align-left">{{ $casualty['address'] }}</td>
                <td class="align-left">{{ $casualty['cause_of_death'] }}</td>
                <td>{{ \Carbon\Carbon::parse($casualty['date_died'])->format('F d, Y') }}</td>
                <td class="align-left">{{ $casualty['place_of_incident'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="7">No deceased casualty data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>