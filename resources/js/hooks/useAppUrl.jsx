import { useMemo } from "react";

const useAppUrl = () => {
    // Use the APP_URL from environment or fall back to current origin
    const appUrl = window.location.origin;

    const API_URL = useMemo(() => {
        return appUrl;
    }, []);

    return API_URL;
};

export default useAppUrl;
