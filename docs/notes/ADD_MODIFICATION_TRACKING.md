4# Add Modification Tracking to All Forms - Implementation Steps

## Quick Reference: Changes Needed for Each Form

### Step 1: Add Import at Top of File
```javascript
import ModificationIndicator from '@/Components/shared/ModificationIndicator';
```

### Step 2: Add getFieldHistory Helper Function
Add this before the `return` statement:

```javascript
// Helper function to get field modification history
const getFieldHistory = (recordId, fieldName) => {
    if (!modificationData?.history) return [];
    const historyKey = `${recordId}_${fieldName}`;
    return modificationData.history[historyKey] || [];
};
```

### Step 3: Wrap Each Input Field
Change from:
```javascript
<td className="p-3">
    <input
        type="text"
        name="field_name"
        value={row.field_name}
        onChange={(e) => handleInputChange(index, e)}
        className="w-full px-3 py-2 border ..."
    />
</td>
```

To:
```javascript
<td className="p-3">
    <div className="relative">
        <input
            type="text"
            name="field_name"
            value={row.field_name}
            onChange={(e) => handleInputChange(index, e)}
            className="w-full px-3 py-2 pr-12 border ..." // Added pr-12
        />
        <ModificationIndicator 
            recordId={row.id} 
            fieldName="field_name"
            getFieldHistory={getFieldHistory}
        />
    </div>
</td>
```

## Forms to Update (15 total)

### ✅ Forms Already Complete (4):
1. Weather Form
2. Communication Form  
3. Pre-Emptive Report Form
4. Incident Monitored Form

### ⚠️ Forms That Need ModificationIndicator Added (15):

#### Situation Overview Forms (6):
- `resources/js/Components/SituationOverview/WaterLevelForm.jsx`
  - Endpoint: `/modifications/water-level`
  - Query Key: `["water-level-modifications"]`
  - Fields to wrap: municipality, river_name, normal_level, water_level, observation_time

- `resources/js/Components/SituationOverview/ElectricityForm.jsx`
  - Endpoint: `/modifications/electricity`
  - Query Key: `["electricity-modifications"]`
  - Fields: municipality, power_status, affected_areas, estimated_restoration

- `resources/js/Components/SituationOverview/WaterServiceForm.jsx`
  - Endpoint: `/modifications/water-service`
  - Query Key: `["water-service-modifications"]`
  - Fields: municipality, service_status, affected_areas, estimated_restoration

- `resources/js/Components/SituationOverview/RoadForm.jsx`
  - Endpoint: `/modifications/road`
  - Query Key: `["road-modifications"]`
  - Fields: road_name, location, status, remarks

- `resources/js/Components/SituationOverview/BridgeForm.jsx`
  - Endpoint: `/modifications/bridge`
  - Query Key: `["bridge-modifications"]`
  - Fields: bridge_name, location, status, remarks

#### Effects Forms (6):
- `resources/js/Components/Effects/CasualtyForm.jsx`
  - Endpoint: `/modifications/casualties`
  - Query Key: `["casualties-modifications"]` ✅ Already has query
  - Fields: name, age, sex, address, cause_of_death, date_died, place_of_incident
  - **Action:** Add getFieldHistory helper and ModificationIndicator to inputs

- `resources/js/Components/Effects/InjuredForm.jsx`
  - Endpoint: `/modifications/injured`
  - Query Key: `["injured-modifications"]`
  - Fields: name, age, sex, address, nature_of_injury, date_injured, place_of_incident

- `resources/js/Components/Effects/MissingForm.jsx`
  - Endpoint: `/modifications/missing`
  - Query Key: `["missing-modifications"]`
  - Fields: name, age, sex, address, last_seen, date_missing, place_last_seen

- `resources/js/Components/Effects/AffectedTouristForm.jsx`
  - Endpoint: `/modifications/affected-tourists`
  - Query Key: `["affected-tourists-modifications"]`
  - Fields: name, nationality, age, sex, location, status, remarks

- `resources/js/Components/Effects/DamagedHouseForm.jsx`
  - Endpoint: `/modifications/damaged-houses`
  - Query Key: `["damaged-houses-modifications"]`
  - Fields: barangay, totally_damaged, partially_damaged

#### Other Forms (3):
- `resources/js/Components/Declaration/UscDeclarationForm.jsx`
  - Endpoint: `/modifications/usc-declaration`
  - Query Key: `["usc-declaration-modifications"]`
  - Fields: municipality, declaration_date, declaration_status, remarks

- `resources/js/Components/PrePositioning/PrePositioningForm.jsx`
  - Endpoint: `/modifications/pre-positioning`
  - Query Key: `["pre-positioning-modifications"]`
  - Fields: resource_type, quantity, location, contact_person

- `resources/js/Components/ResponseOperations/ResponseOperationForm.jsx`
  - Endpoint: `/modifications/response-operations`
  - Query Key: `["response-operations-modifications"]`
  - Fields: operation_type, location, personnel_deployed, equipment_used, date_conducted

- `resources/js/Components/AssistanceExtended/AssistanceExtendedForm.jsx`
  - Endpoint: `/modifications/assistance-extended`
  - Query Key: `["assistance-extended-modifications"]`
  - Fields: assistance_type, quantity, beneficiaries, barangay, date_provided

- `resources/js/Components/Agriculture/AgricultureForm.jsx`
  - Endpoint: `/modifications/agriculture`
  - Query Key: `["agriculture-modifications"]`
  - Fields: crops_affected, standing_crop_ha, stage_of_crop, total_area_affected_ha, total_production_loss, remarks

## Implementation Checklist

For each form:
- [ ] 1. Add import for ModificationIndicator
- [ ] 2. Verify query is fetching modifications (most already are)
- [ ] 3. Add getFieldHistory helper function
- [ ] 4. Wrap each input field with relative div
- [ ] 5. Add ModificationIndicator component to each field
- [ ] 6. Add pr-12 padding to input className for icon space
- [ ] 7. Test hover and click functionality
- [ ] 8. Verify NEW badge appears after field update
