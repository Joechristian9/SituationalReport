<!-- =========== F.2 SUSPENSION OF WORK SECTION =========== -->
<div class="section-title" style="font-weight: bold; margin-bottom: 10px;">
    F.2 Suspension of Work
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Province/ City/ Municipality</th>
            <th>Date of Suspension</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        {{-- 
          Loop through the $suspensionOfWork array from the controller.
          The @forelse directive will automatically handle the empty case.
        --}}
        @forelse($suspensionOfWork as $suspension)
            <tr>
                <td class="align-left">{{ $suspension['province_city_municipality'] }}</td>
                {{-- Format the date nicely for the report --}}
                <td>{{ \Carbon\Carbon::parse($suspension['date_of_suspension'])->format('F d, Y') }}</td>
                <td class="align-left">{{ $suspension['remarks'] }}</td>
            </tr>
        @empty
            {{-- 
              This block is displayed if the $suspensionOfWork array is empty,
              matching the "empty state" of the React component.
            --}}
            <tr>
                <td colspan="3">No work suspensions have been recorded.</td>
            </tr>
        @endforelse
    </tbody>
</table>