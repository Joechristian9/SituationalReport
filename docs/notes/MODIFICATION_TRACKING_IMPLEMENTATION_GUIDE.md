# Modification Tracking Implementation Guide

## Overview
All 19 CDRRMO forms need modification tracking with hover + click functionality.

## Status

### ✅ Completed (4/19):
1. Weather Form
2. Communication Form
3. Pre-Emptive Report Form
4. Incident Monitored Form

### ❌ Remaining (15/19):
5. Water Level Form
6. Electricity Form
7. Water Service Form
8. Road Form
9. Bridge Form
10. Declaration Form (USC Declaration)
11. Pre-positioning Form
12. Casualty Form
13. Injured Form
14. Missing Form
15. Affected Tourist Form
16. Damaged Houses Form
17. Response Operations Form
18. Assistance Extended Form
19. Agriculture Form

## Reusable Component
**Location:** `resources/js/Components/shared/ModificationIndicator.jsx`
- ✅ Created and ready to use

## Backend Status
- ✅ All 19 models have `LogsModification` trait
- ✅ All 19 modification endpoints exist in routes
- ⚠️ Controllers need field-by-field comparison for updates

## Implementation Pattern

### For Each Form:

#### 1. Update Controller (if needed)
Add field-by-field comparison in update/store method:

```php
if ($reportId && is_numeric($reportId)) {
    $report = Model::find($reportId);
    if ($report) {
        $fieldsToUpdate = [];
        
        if ($report->field_name !== ($data['field_name'] ?? null)) {
            $fieldsToUpdate['field_name'] = $data['field_name'] ?? null;
        }
        // ... repeat for each field
        
        $fieldsToUpdate['updated_by'] = Auth::id();
        
        if (count($fieldsToUpdate) > 1) {
            $report->update($fieldsToUpdate);
        }
    }
}
```

#### 2. Update Frontend Form Component

**Step 1:** Add imports
```javascript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ModificationIndicator from '@/Components/shared/ModificationIndicator';
```

**Step 2:** Add query client and modification query
```javascript
const queryClient = useQueryClient();

const {
    data: modificationData,
    isError,
    error,
} = useQuery({
    queryKey: ["form-name-modifications"],
    queryFn: async () => {
        const { data } = await axios.get(
            `${APP_URL}/modifications/form-name`
        );
        return data;
    },
    staleTime: 1000 * 60 * 5,
});
```

**Step 3:** Add helper function
```javascript
const getFieldHistory = (recordId, fieldName) => {
    if (!modificationData?.history) return [];
    const historyKey = `${recordId}_${fieldName}`;
    return modificationData.history[historyKey] || [];
};
```

**Step 4:** Update submit handler
```javascript
// After successful save:
await queryClient.invalidateQueries(['form-name-modifications']);
```

**Step 5:** Wrap inputs with ModificationIndicator
```javascript
<td className="p-3">
    <div className="relative">
        <input
            // ... existing props
            className="w-full px-3 py-2 pr-12 ..." // Add pr-12 for icon space
        />
        <ModificationIndicator 
            recordId={record.id} 
            fieldName="field_name"
            getFieldHistory={getFieldHistory}
        />
    </div>
</td>
```

## Forms Mapping

### Form Components Location:
1. **Water Level** - `resources/js/Components/SituationOverview/WaterLevelForm.jsx`
2. **Electricity** - `resources/js/Components/SituationOverview/ElectricityForm.jsx`
3. **Water Service** - `resources/js/Components/SituationOverview/WaterServiceForm.jsx`
4. **Road** - `resources/js/Components/SituationOverview/RoadForm.jsx`
5. **Bridge** - `resources/js/Components/SituationOverview/BridgeForm.jsx`
6. **USC Declaration** - `resources/js/Components/Declaration/UscDeclarationForm.jsx`
7. **Pre-positioning** - `resources/js/Components/PrePositioning/PrePositioningForm.jsx`
8. **Casualty** - `resources/js/Components/Effects/CasualtyForm.jsx`
9. **Injured** - `resources/js/Components/Effects/InjuredForm.jsx`
10. **Missing** - `resources/js/Components/Effects/MissingForm.jsx`
11. **Affected Tourist** - `resources/js/Components/Effects/AffectedTouristForm.jsx`
12. **Damaged Houses** - `resources/js/Components/Effects/DamagedHouseForm.jsx`
13. **Response Operations** - `resources/js/Components/ResponseOperations/ResponseOperationForm.jsx`
14. **Assistance Extended** - `resources/js/Components/AssistanceExtended/AssistanceExtendedForm.jsx`
15. **Agriculture** - `resources/js/Components/Agriculture/AgricultureForm.jsx`

### Modification Endpoints:
- `/modifications/weather`
- `/modifications/water-level`
- `/modifications/electricity`
- `/modifications/water-service`
- `/modifications/communication`
- `/modifications/road`
- `/modifications/bridge`
- `/modifications/usc-declaration`
- `/modifications/pre-positioning`
- `/modifications/casualties`
- `/modifications/injured`
- `/modifications/missing`
- `/modifications/affected-tourists`
- `/modifications/damaged-houses`
- `/modifications/response-operations`
- `/modifications/assistance-extended`
- `/modifications/agriculture`

## Next Steps
Apply the implementation pattern to all 15 remaining forms following the steps above.
