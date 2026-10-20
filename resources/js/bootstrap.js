import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// No X-CSRF-TOKEN from the page's <meta> tag: Inertia never reloads that HTML (and the
// service worker can serve an old copy), so it goes stale, and Laravel checks it before the
// cookie, giving 419 on logout and saves. Axios instead sends the XSRF-TOKEN cookie, which
// Laravel renews on every response.

// Add axios interceptor to handle 419 errors
axios.interceptors.response.use(
    response => response,
    error => {
        // Background sends of offline saves must not reload the page the user is working in.
        if (error.response?.status === 419 && !error.config?.offlineSync) {
            // CSRF token expired, reload the page
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
