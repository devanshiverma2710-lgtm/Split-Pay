import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json",
    },
});

// ==========================================
// ATTACH JWT TO EVERY REQUEST
// ==========================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        console.log(
            "JWT token:",
            token ? "Token found" : "NO TOKEN"
        );

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// HANDLE API RESPONSES
// ==========================================
api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        if (error.response) {
            console.error(
                "API ERROR:",
                error.response.status,
                error.config?.url,
                error.response.data
            );

            // Do NOT automatically delete the token on 403.
            // A 403 can mean the logged-in user does not
            // have permission for a particular endpoint.
            if (error.response.status === 401) {
                console.warn(
                    "401 Unauthorized - token may be expired or invalid."
                );
            }

            if (error.response.status === 403) {
                console.warn(
                    "403 Forbidden - JWT was received but access was denied."
                );
            }
        } else {
            console.error(
                "Network error:",
                error.message
            );
        }

        return Promise.reject(error);
    }
);

export default api;