import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Function to refresh CSRF token
const refreshCSRFToken = () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    } else {
        console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
    }
};

// Set initial CSRF token
refreshCSRFToken();

// Refresh CSRF token on page visibility change (when user comes back to tab)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        refreshCSRFToken();
    }
});

// Add axios interceptor to handle 419 errors
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 419) {
            // CSRF token expired, reload the page
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
