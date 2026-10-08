import { ClipboardList, Cloud, Droplets, Flame, Landmark, Radio, Route, Sprout, Zap } from 'lucide-react';

/*
 * Every "Report History" page, in one place: the page, the sidebar and the Excel
 * export all read this. Column: { name, label, align?: 'right', value?: (report) => text }.
 * `pdf` is the route of a per-disaster PDF, for the types that have one.
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

export const HISTORY_TYPES = {
    weather: {
        title: 'Weather history',
        menuTitle: 'Weather History',
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
        menuTitle: 'Communication History',
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
        menuTitle: 'Road History',
        icon: Route,
        api: 'api.road-history',
        page: 'road.history',
        permission: 'access-road-form',
        columns: roadLike('name_of_road', 'Name of road'),
    },
    bridge: {
        title: 'Bridge history',
        menuTitle: 'Bridge History',
        icon: Landmark,
        api: 'api.bridge-history',
        page: 'bridge.history',
        permission: 'access-bridge-form',
        columns: roadLike('name_of_bridge', 'Name of bridge'),
    },
    'pre-emptive': {
        title: 'Pre-emptive evacuation history',
        menuTitle: 'Pre-Emptive History',
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
        menuTitle: 'Incident History',
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
        menuTitle: 'Agriculture History',
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
        menuTitle: 'Electricity History',
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
        menuTitle: 'Water Service History',
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

/** Sidebar entries for the given history types, in that order. */
export const historyMenuItems = (keys) =>
    keys.map((key) => {
        const type = HISTORY_TYPES[key];
        return {
            // Sidebar items are Title Case like the rest of the menu.
            title: type.menuTitle,
            url: route(type.page),
            roles: ['user', 'admin'],
            icon: type.icon,
            permission: type.permission,
        };
    });
