import { useMemo } from "react";

const useAppUrl = () => {
    // Define the URL constants for offline and online
    //const appUrl = "http://localhost:8000";
    const appUrl = "http://127.0.0.1:8000";
    // const appUrl = "https://isu.chaelx.online";
    // const appUrl = "https://isu.chaelx.online".replace(/\/$/, "");

    const API_URL = useMemo(() => {
        return appUrl;
    }, []);

    return API_URL;
};

export default useAppUrl;
