
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20
        { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    },
};

const BASE_URL = 'http://localhost:3000'; // Or production URL

export default function () {
    // 1. Visit Landing Page
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'status was 200': (r) => r.status === 200 });

    // 2. Simulate "View Agenda" (Protected) - simplified, assuming token logic handling or public endpoint for test
    // For protected routes, we'd need to POST /auth first.
    // We'll test public static assets load time as proxy for server health.

    sleep(1);
}
