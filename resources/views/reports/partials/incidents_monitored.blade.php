<!-- =========== INCIDENTS MONITORED SECTION =========== -->
<div class="main-title">
    V. INCIDENTS MONITORED
</div>
<div class="section-title" style="page-break-before: auto;">
    G.  INCIDENTS MONITORED
</div>

<table>
    <thead>
        <tr>
            <th class="align-left">Kinds of Incident</th>
            <th class="align-left">Date & Time of Occurrence</th>
            <th class="align-left">Location</th>
            <th class="align-left">Description</th>
            <th class="align-left">Remarks</th>
        </tr>
    </thead>
    <tbody>
        @forelse($incidentReports as $incident)
            <tr>
                <td class="align-left">{{ $incident['kinds_of_incident'] }}</td>
                <td class="align-left">{{ \Carbon\Carbon::parse($incident['date_time'])->format('F d, Y h:i A') }}</td>
                <td class="align-left">{{ $incident['location'] }}</td>
                <td class="align-left" style="white-space: pre-wrap;">{{ $incident['description'] }}</td>
                <td class="align-left">{{ $incident['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5">No incidents monitored data available.</td>
            </tr>
        @endforelse
    </tbody>
</table>