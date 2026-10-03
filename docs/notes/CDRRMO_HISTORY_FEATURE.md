# CDRRMO History Feature - Dropdown Report History

## Overview
CDRRMO users now have access to Report History as a dropdown menu in the sidebar with separate links for Weather History and Communication History.

## Changes Made

### 1. Routes (`routes/web.php`)
- `/weather/history` - Weather reports history page (route name: `weather.history`)
- `/communication/history` - Communication reports history page (route name: `communication.history`)
- API endpoints: `/api/weather-history` and `/api/communication-history`

### 2. Sidebar Updates (`resources/js/Components/app-sidebar.jsx`)
- Added "Report History" as a dropdown menu item
- Contains two sub-items:
  - Weather History (with Cloud icon)
  - Communication History (with Radio icon)
- Only visible to CDRRMO users (weather + communication access)

### 3. Nav Component Updates (`resources/js/Components/nav-main.jsx`)
- Added handler for "Report History" dropdown
- Collapsible/expandable with chevron icon
- Opens by default when sidebar is expanded

## Features

### Dropdown Menu
- **Report History** parent menu item with dropdown
- **Two sub-items:** Weather History and Communication History
- **Icons:** Cloud for Weather, Radio for Communication
- **Collapsible:** Click to expand/collapse the dropdown
- **Clean UI:** Organized navigation structure

### Weather History Page
Displays:
- Municipality
- Sky Condition
- Wind
- Precipitation
- Sea Condition
- Last Updated timestamp
- Updated By user

### Communication History Page
Displays:
- Globe status
- Smart status
- PLDT Landline status
- PLDT Internet status
- VHF status
- Remarks
- Last Updated timestamp
- Updated By user

### Common Features (Both Pages)
- ✅ Grouped by typhoon
- ✅ Expandable/collapsible typhoon cards
- ✅ Shows typhoon status badge (Active/Paused/Ended)
- ✅ Shows report count per typhoon
- ✅ Shows typhoon start date
- ✅ Responsive design
- ✅ Empty state when no reports exist
- ✅ Separate pages with consistent design

## User Experience

### CDRRMO User Login
When CDRRMO logs in, they will see:
1. **Sidebar Menu:**
   - Weather & Communication (main form)
   - **Report History** (dropdown menu)
     - Weather History
     - Communication History

2. **Using Report History:**
   - Click "Report History" to expand the dropdown
   - Click "Weather History" or "Communication History" to view reports
   - Each page shows reports grouped by typhoon
   - Click on typhoon cards to expand and see all reports
   - Each report shows who created/updated it and when

## Testing

### Test as CDRRMO:
```
Email: cdrrmo@gmail.com
Password: wardead123
```

Expected:
- ✅ See "Weather & Communication" in sidebar
- ✅ See "Report History" dropdown menu
- ✅ Can expand dropdown to see Weather History and Communication History
- ✅ Can access both history pages separately
- ✅ History pages show reports grouped by typhoon
- ✅ Can expand/collapse typhoon cards

## Technical Details

### Routes
- Weather History: `/weather/history` (route name: `weather.history`)
- Communication History: `/communication/history` (route name: `communication.history`)

### Sidebar Menu Structure
```javascript
{
    title: "Report History",
    url: "#",
    icon: History,
    items: [
        {
            title: "Weather History",
            url: route("weather.history"),
            icon: Cloud,
            permission: "access-weather-form"
        },
        {
            title: "Communication History",
            url: route("communication.history"),
            icon: Radio,
            permission: "access-communication-form"
        }
    ]
}
```

### Permissions Required
- Weather History: `access-weather-form`
- Communication History: `access-communication-form`
- CDRRMO users have both permissions

## Files Modified
1. `routes/web.php` - Weather and Communication history routes
2. `resources/js/Components/app-sidebar.jsx` - Added dropdown menu structure
3. `resources/js/Components/nav-main.jsx` - Added Report History dropdown handler
4. `resources/js/Pages/WeatherHistory/Index.jsx` - Weather history page
5. `resources/js/Pages/CommunicationHistory/Index.jsx` - Communication history page

## Benefits
1. **Organized Navigation:** Dropdown groups related history pages
2. **Clear Structure:** Parent menu with sub-items
3. **Easy Access:** Click to expand and select the desired history
4. **Consistent Design:** Matches other dropdown menus in the sidebar
5. **Scalable:** Easy to add more history types in the future
