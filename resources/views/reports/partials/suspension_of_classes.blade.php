<!-- =========== F.1 SUSPENSION OF CLASSES SECTION =========== -->
<div class="subtitle" style="font-weight: bold; margin-top: 15px; margin-bottom: 10px;">
    F.1 Suspension of Classes
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Province/ City/ Municipality</th>
            <th class="align-left">Levels</th>
            <th>Date of Suspension</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        {{-- 
          Loop through the $suspensionOfClasses array from the controller.
          The @forelse directive handles the case where the array is empty.
        --}}
        @forelse($suspensionOfClasses as $suspension)
            <tr>
                <td class="align-left">{{ $suspension['province_city_municipality'] }}</td>
                <td class="align-left">{{ $suspension['level'] }}</td>
                {{-- Format the date for better readability --}}
                <td>{{ \Carbon\Carbon::parse($suspension['date_of_suspension'])->format('F d, Y') }}</td>
                <td class="align-left">{{ $suspension['remarks'] }}</td>
            </tr>
        @empty
            {{-- 
              This block is displayed if the $suspensionOfClasses array is empty,
              replicating the "empty state" from the React component.
            --}}
            <tr>
                <td colspan="4">No class suspensions have been recorded.</td>
            </tr>
        @endforelse
    </tbody>
</table>