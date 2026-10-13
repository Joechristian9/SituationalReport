import ReportHistoryPage from '@/Components/history/ReportHistoryPage';

// One page for every form served by ReportHistoryController; `type` comes from the route.
export default function ReportHistoryIndex({ type }) {
    return <ReportHistoryPage type={type} />;
}
