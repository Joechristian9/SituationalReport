import {
    Activity,
    AlertTriangle,
    ClipboardList,
    Cloud,
    Droplets,
    FileWarning,
    Flame,
    HeartHandshake,
    HeartPulse,
    House,
    Landmark,
    Luggage,
    MapPin,
    Radio,
    Route,
    Sprout,
    Tent,
    UserRound,
    UserSearch,
    Users,
    UserX,
    Waves,
    Zap,
} from 'lucide-react';

/*
 * Every "Report History" page, in one place: the page, the sidebar and the Excel
 * export all read this. Column: { name, label, align?: 'right', value?: (report) => text }.
 * `pdf` is the route of a per-disaster PDF, for the types that have one. `page` and `api`
 * are route names; `pageParams` / `apiParams` fill their parameters (the shared
 * ReportHistoryController routes take the type).
 */
const roadLike = (nameField, nameLabel) => [
    { name: 'road_classification', label: 'Road classification' },
    { name: nameField, label: nameLabel },
    { name: 'status', label: 'Status' },
    { name: 'areas_affected', label: 'Areas / barangays affected' },
    { name: 're_routing', label: 'Re-routing' },
    { name: 'remarks', label: 'Remarks' },
];

const count = (name, label) => ({ name, label, align: 'right' });

// The forms served by ReportHistoryController share one page route and one data route.
const shared = (type, config) => ({
    ...config,
    api: 'api.report-history',
    apiParams: { type },
    page: 'report-history.show',
    pageParams: { type },
});

export const HISTORY_TYPES = {
    weather: {
        title: 'Weather history',
        menuTitle: 'Weather',
        icon: Cloud,
        api: 'api.weather-history',
        page: 'weather.history',
        permission: 'access-weather-form',
        columns: [
            { name: 'municipality', label: 'Location' },
            { name: 'sky_condition', label: 'Sky condition' },
            { name: 'wind', label: 'Wind' },
            { name: 'precipitation', label: 'Precipitation' },
            { name: 'sea_condition', label: 'Sea condition' },
        ],
    },
    communication: {
        title: 'Communication history',
        menuTitle: 'Communications',
        icon: Radio,
        api: 'api.communication-history',
        page: 'communication.history',
        permission: 'access-communication-form',
        columns: [
            { name: 'globe', label: 'Globe' },
            { name: 'smart', label: 'Smart' },
            { name: 'pldt_internet', label: 'Polaris' },
            { name: 'vhf', label: 'VHF' },
            {
                name: 'service_values',
                label: 'Other services',
                value: (report) =>
                    (report.service_values ?? [])
                        .filter((service) => service.status)
                        .map((service) => `${service.name}: ${service.status}`)
                        .join('; '),
            },
            { name: 'remarks', label: 'Remarks' },
        ],
    },
    road: {
        title: 'Road history',
        menuTitle: 'Roads',
        icon: Route,
        api: 'api.road-history',
        page: 'road.history',
        permission: 'access-road-form',
        columns: roadLike('name_of_road', 'Name of road'),
    },
    bridge: {
        title: 'Bridge history',
        menuTitle: 'Bridges',
        icon: Landmark,
        api: 'api.bridge-history',
        page: 'bridge.history',
        permission: 'access-bridge-form',
        columns: roadLike('name_of_bridge', 'Name of bridge'),
    },
    'pre-emptive': {
        title: 'Pre-emptive evacuation history',
        menuTitle: 'Pre-Emptive Evacuation',
        icon: ClipboardList,
        api: 'api.pre-emptive-history',
        page: 'pre-emptive.history',
        permission: 'access-pre-emptive-form',
        columns: [
            { name: 'barangay', label: 'Barangay' },
            { name: 'evacuation_center', label: 'Evacuation center' },
            count('families', 'Families in center'),
            count('persons', 'Persons in center'),
            { name: 'outside_center', label: 'Outside center' },
            count('outside_families', 'Families outside'),
            count('outside_persons', 'Persons outside'),
            count('total_families', 'Total families'),
            count('total_persons', 'Total persons'),
        ],
    },
    incident: {
        title: 'Incident history',
        menuTitle: 'Incident Monitored',
        icon: Flame,
        api: 'api.incident-history',
        page: 'incident.history',
        permission: 'access-incident-form',
        columns: [
            { name: 'kinds_of_incident', label: 'Kind of incident' },
            { name: 'date_time', label: 'Date & time', value: (report) => formatDateTime(report.date_time) },
            { name: 'location', label: 'Location' },
            { name: 'description', label: 'Description' },
            { name: 'remarks', label: 'Remarks' },
        ],
    },
    agriculture: {
        title: 'Agriculture history',
        menuTitle: 'Agriculture',
        icon: Sprout,
        api: 'api.agriculture-history',
        page: 'agriculture.history',
        permission: 'access-agriculture-form',
        columns: [
            { name: 'crops_affected', label: 'Crops affected' },
            count('standing_crop_ha', 'Standing crop (ha)'),
            { name: 'stage_of_crop', label: 'Stage of crop' },
            count('total_area_affected_ha', 'Area affected (ha)'),
            count('total_production_loss', 'Production loss'),
            { name: 'remarks', label: 'Remarks' },
        ],
    },
    electricity: {
        title: 'Electricity history',
        menuTitle: 'Electricity',
        icon: Zap,
        api: 'api.electricity-history',
        page: 'electricity.history',
        permission: 'access-electricity-form',
        pdf: 'api.electricity-history.pdf',
        columns: [
            { name: 'status', label: 'Status of electricity services' },
            { name: 'barangays_affected', label: 'Barangays affected' },
            { name: 'remarks', label: 'Remarks' },
        ],
    },
    'water-service': {
        title: 'Water services history',
        menuTitle: 'Water Services',
        icon: Droplets,
        api: 'api.water-service-history',
        page: 'water-service.history',
        permission: 'access-water-service-form',
        pdf: 'api.water-service-history.pdf',
        columns: [
            { name: 'source_of_water', label: 'Source of water' },
            { name: 'barangays_served', label: 'Barangays served' },
            { name: 'status', label: 'Status' },
            { name: 'remarks', label: 'Remarks' },
        ],
    },
    casualties: shared('casualties', {
        title: 'Casualties (dead) history',
        menuTitle: 'Dead',
        icon: UserX,
        permission: 'access-casualty-form',
        columns: [
            { name: 'name', label: 'Name' },
            count('age', 'Age'),
            { name: 'sex', label: 'Sex' },
            { name: 'address', label: 'Address' },
            { name: 'cause_of_death', label: 'Cause of death' },
            { name: 'date_died', label: 'Date died', value: (report) => formatDate(report.date_died) },
            { name: 'place_of_incident', label: 'Place of incident' },
        ],
    }),
    injured: shared('injured', {
        title: 'Casualties (injured) history',
        menuTitle: 'Injured',
        icon: UserRound,
        permission: 'access-injured-form',
        columns: [
            { name: 'name', label: 'Name' },
            count('age', 'Age'),
            { name: 'sex', label: 'Sex' },
            { name: 'address', label: 'Address' },
            { name: 'diagnosis', label: 'Diagnosis' },
            { name: 'date_admitted', label: 'Date admitted', value: (report) => formatDate(report.date_admitted) },
            { name: 'place_of_incident', label: 'Place of incident' },
            { name: 'remarks', label: 'Remarks' },
        ],
    }),
    missing: shared('missing', {
        title: 'Casualties (missing) history',
        menuTitle: 'Missing',
        icon: UserSearch,
        permission: 'access-missing-form',
        columns: [
            { name: 'name', label: 'Name' },
            count('age', 'Age'),
            { name: 'sex', label: 'Sex' },
            { name: 'address', label: 'Address' },
            { name: 'cause', label: 'Cause' },
            { name: 'remarks', label: 'Remarks' },
        ],
    }),
    tourists: shared('tourists', {
        title: 'Affected tourists history',
        menuTitle: 'Affected Tourists',
        icon: Luggage,
        permission: 'access-tourist-form',
        columns: [
            { name: 'province_city_municipality', label: 'Province / city / municipality' },
            { name: 'location', label: 'Location' },
            count('local_tourists', 'Local tourists'),
            count('foreign_tourists', 'Foreign tourists'),
            { name: 'remarks', label: 'Remarks' },
        ],
    }),
    'damaged-houses': shared('damaged-houses', {
        title: 'Damaged houses history',
        menuTitle: 'Damaged Houses',
        icon: House,
        permission: 'access-damaged-houses-form',
        columns: [
            { name: 'barangay', label: 'Barangay' },
            count('partially', 'Partially damaged'),
            count('totally', 'Totally damaged'),
            count('total', 'Total'),
        ],
    }),
    'pre-positioning': shared('pre-positioning', {
        title: 'Deployment of response assets history',
        menuTitle: 'Response Assets',
        icon: MapPin,
        permission: 'access-pre-positioning-form',
        columns: [
            { name: 'team_units', label: 'Team / unit' },
            { name: 'team_leader', label: 'Team leader' },
            { name: 'personnel_deployed', label: 'Personnel deployed' },
            { name: 'response_assets', label: 'Response assets' },
            { name: 'capability', label: 'Capability' },
            { name: 'area_of_deployment', label: 'Area of deployment' },
        ],
    }),
    'response-operations': shared('response-operations', {
        title: 'Response operations history',
        menuTitle: 'Response Operations',
        icon: Users,
        permission: 'access-response-operations',
        columns: [
            { name: 'team_unit', label: 'Team / unit' },
            { name: 'incident', label: 'Incident' },
            { name: 'datetime', label: 'Date & time', value: (report) => formatDateTime(report.datetime) },
            { name: 'location', label: 'Location' },
            { name: 'actions', label: 'Actions taken' },
            { name: 'remarks', label: 'Remarks' },
        ],
    }),
    'assistance-extended': shared('assistance-extended', {
        title: 'Assistance extended history',
        menuTitle: 'Assistance',
        icon: HeartHandshake,
        permission: 'access-assistance-extended',
        columns: [
            { name: 'agency_officials_groups', label: 'Agency / officials / groups' },
            { name: 'type_kind_of_assistance', label: 'Type / kind of assistance' },
            { name: 'amount', label: 'Amount' },
            { name: 'beneficiaries', label: 'Beneficiaries' },
        ],
    }),
    declaration: shared('declaration', {
        title: 'Declaration of state of calamity history',
        menuTitle: 'Declaration',
        icon: FileWarning,
        permission: 'access-declaration-form',
        columns: [
            { name: 'declared_by', label: 'Declared by' },
            { name: 'resolution_number', label: 'Resolution number' },
            { name: 'date_approved', label: 'Date approved', value: (report) => formatDate(report.date_approved) },
        ],
    }),
    'water-level': shared('water-level', {
        title: 'Water level history',
        menuTitle: 'Water Level',
        icon: Waves,
        permission: 'access-water-level-form',
        columns: [
            { name: 'gauging_station', label: 'Gauging station' },
            { name: 'current_level', label: 'Current level' },
            { name: 'alarm_level', label: 'Alarm level' },
            { name: 'critical_level', label: 'Critical level' },
            { name: 'affected_areas', label: 'Affected areas' },
        ],
    }),
};

/** Columns every history table ends with. */
export const TRAILING_COLUMNS = [
    { name: 'updated_at', label: 'Last updated', value: (report) => formatDateTime(report.updated_at) },
    { name: 'user', label: 'Updated by', value: (report) => report.user?.name ?? '—' },
];

export function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatDate(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** The text a column shows for a report. */
export const cellText = (column, report) => {
    const value = column.value ? column.value(report) : report[column.name];
    return value === null || value === undefined || value === '' ? '' : String(value);
};

// Sidebar submenus, in the same sections as the Reports page. Every type must be in one.
const HISTORY_GROUPS = [
    { title: 'Situation Overview', icon: Activity, keys: ['weather', 'electricity', 'water-service', 'water-level', 'communication', 'road', 'bridge'] },
    { title: 'Evacuation & Response', icon: Tent, keys: ['pre-emptive', 'pre-positioning', 'response-operations', 'assistance-extended'] },
    { title: 'Effects', icon: AlertTriangle, keys: ['incident', 'agriculture', 'damaged-houses', 'tourists', 'declaration'] },
    { title: 'Casualties', icon: HeartPulse, keys: ['casualties', 'injured', 'missing'] },
];

/** Sidebar submenus holding the given history types; sections with none of them drop out. */
export const historyMenuItems = (keys) =>
    HISTORY_GROUPS.map((group) => ({
        title: group.title,
        icon: group.icon,
        roles: ['user', 'admin'],
        items: group.keys
            .filter((key) => keys.includes(key))
            .map((key) => {
                const type = HISTORY_TYPES[key];
                return {
                    // Sidebar items are Title Case like the rest of the menu.
                    title: type.menuTitle,
                    url: route(type.page, type.pageParams),
                    icon: type.icon,
                };
            }),
    })).filter((group) => group.items.length > 0);
