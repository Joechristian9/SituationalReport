# CDRRMO Simple Forms - Implementation Needed

## Current Problem
- Weather form uses a TABLE with columns (Municipality, Sky Condition, Wind, Precipitation, Sea Condition)
- Communication form uses a TABLE with columns (Globe, Smart, PLDT, etc.)
- These are complex and don't match Electricity's simple format

## Required Solution
Redesign Weather and Communication forms to match Electricity's simple question-and-answer format:

### Weather Form Should Have:
```
☁️ Weather Conditions Update
One report per typhoon — update anytime to keep information current.

1. What are the current weather conditions?
   [Large textarea - describe sky, wind, precipitation, sea conditions]

2. Which areas are most affected?
   [Large textarea - list municipalities/barangays]

3. Any additional details?
   [Large textarea with auto-timestamp on focus]

[Submit Report Button]
```

### Communication Form Should Have:
```
📡 Communication Status Update
One report per typhoon — update anytime to keep information current.

1. What's the current communication network status?
   [Large textarea - describe Globe, Smart, PLDT status]

2. Which services are affected?
   [Large textarea - list affected networks and areas]

3. Any additional details?
   [Large textarea with auto-timestamp on focus]

[Submit Report Button]
```

## Files to Modify:
1. `resources/js/Components/SituationOverview/WeatherForm.jsx` - Redesign to simple format
2. `resources/js/Components/SituationOverview/CommunicationForm.jsx` - Redesign to simple format

## Backend Changes Needed:
1. Update `storeWeather()` in controller to accept simple text fields instead of table data
2. Update `storeCommunication()` in controller to accept simple text fields instead of table data
3. Update database migrations if needed to support text-based storage

## Design Specifications:
- Blue gradient banner at top (like Electricity's "⚡ Power Status Update")
- Numbered questions (1, 2, 3) with blue circular badges
- Large textareas with rounded corners
- Auto-timestamp on focus for remarks field
- "Submit Report" button at bottom
- "No Changes" state when nothing modified
- Loading state with spinner

This will make CDRRMO's experience identical to Electricity and Water Service users!
