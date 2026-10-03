# Where to Find Pause/Resume Buttons

## Location
The Pause/Resume buttons are in the **Typhoon Management** page (Admin Dashboard).

## How to Access
1. Login as **Admin**
2. Go to **Admin Dashboard** or **Typhoon Management**
3. Look at the **Active Typhoon Report** card at the top

## Button Visibility

### When Typhoon is Active
You'll see:
- **🟡 Pause Report** button (amber/yellow)
- **🔴 End Report** button (red)

### When Typhoon is Paused
You'll see:
- **🟢 Resume Report** button (green)
- **🔵 Download Snapshot** button (blue)
- **🔴 End Report** button (red)

## Visual Guide

```
┌─────────────────────────────────────────────────────┐
│  Active Typhoon Report                    [Active]  │
├─────────────────────────────────────────────────────┤
│  Typhoon Pepito                                     │
│  Started: Nov 28, 2024                              │
│  Created by: Admin                                  │
│                                                     │
│  [🟡 Pause Report]  [🔴 End Report]                │
└─────────────────────────────────────────────────────┘
```

When paused:

```
┌─────────────────────────────────────────────────────┐
│  Active Typhoon Report                   [Paused]   │
├─────────────────────────────────────────────────────┤
│  Typhoon Pepito                                     │
│  Started: Nov 28, 2024                              │
│  Created by: Admin                                  │
│                                                     │
│  [🟢 Resume]  [🔵 Download Snapshot]  [🔴 End]     │
└─────────────────────────────────────────────────────┘
```

## Button Actions

### Pause Report
- Temporarily stops data entry
- Disables all forms for users
- Shows confirmation modal
- Changes status to "Paused"

### Resume Report
- Reactivates the typhoon
- Re-enables all forms
- Shows confirmation modal
- Changes status back to "Active"

### Download Snapshot
- Generates PDF of current data
- Downloads immediately
- Available only when paused
- Can download multiple times

### End Report
- Permanently closes typhoon
- Generates final PDF
- Cannot be resumed after ending
- Available in both active and paused states

## Workflow Example

1. **Start**: Create new typhoon → Status: Active
2. **Pause**: Click "Pause Report" → Status: Paused
3. **Download**: Click "Download Snapshot" → Get PDF
4. **Resume**: Click "Resume Report" → Status: Active
5. **Repeat**: Can pause/resume multiple times
6. **End**: Click "End Report" → Status: Ended (permanent)

## Status Indicators

The badge next to "Active Typhoon Report" shows:
- **Green "Active"** - Forms enabled, data entry allowed
- **Amber "Paused"** - Forms disabled, can download snapshot
- No badge shown when ended

## Notes

- Only **admins** can see and use these buttons
- Regular users will see disabled forms when paused
- The active typhoon card only appears when there's an active or paused typhoon
- Once ended, the typhoon moves to history and cannot be resumed

## Troubleshooting

**Can't see the buttons?**
- Make sure you're logged in as admin
- Check if there's an active typhoon
- Refresh the page

**Buttons are disabled?**
- Check your internet connection
- Wait for any ongoing operations to complete
- Refresh the page

**Forms still enabled after pause?**
- Refresh the page
- Check the status badge
- Try logging out and back in
