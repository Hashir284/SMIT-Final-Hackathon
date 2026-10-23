import axios from "axios";

const api = axios.create({
    baseURL: window.location.href.split(':')[0] === 'http' ? 'http://localhost:8000/api' : '/api',
    withCredentials: true
})

export default api;

// withCredentials: true
// Ye cross-origin requests mein browser ko credentials, jaise cookies, bhejne aur 
// applicable responses ki cookies accept karne deta hai.