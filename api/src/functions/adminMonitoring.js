const { app } = require('@azure/functions');

// List of all API endpoints to monitor (excluding self to avoid recursion)
const endpoints = [
    { name: 'Health', path: '/api/health', method: 'GET', critical: true },
    { name: 'Get Availability', path: '/api/availability', method: 'GET', critical: true },
    { name: 'Get Holidays', path: '/api/holidays', method: 'GET', critical: false },
    { name: 'Admin Bookings', path: '/api/dashboard/bookings', method: 'GET', critical: true },
    { name: 'Admin Availability', path: '/api/dashboard/availability', method: 'GET', critical: true },
    { name: 'Admin Settings', path: '/api/dashboard/settings', method: 'GET', critical: false },
    { name: 'Admin Table Data', path: '/api/dashboard/tables/bookings', method: 'GET', critical: false },
];

const BASE_URL = 'https://sofija-nutrition-api.azurewebsites.net';

async function checkEndpoint(endpoint) {
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(BASE_URL + endpoint.path, {
            method: endpoint.method,
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        return {
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            critical: endpoint.critical,
            status: response.ok || response.status === 204 ? 'healthy' : 'degraded',
            httpStatus: response.status,
            responseTime: responseTime,
            message: response.ok || response.status === 204 ? 'OK' : `HTTP ${response.status}`
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            critical: endpoint.critical,
            status: 'unhealthy',
            httpStatus: 0,
            responseTime: responseTime,
            message: error.name === 'AbortError' ? 'Timeout (>10s)' : error.message
        };
    }
}

app.http('adminGetMonitoring', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/monitoring',
    handler: async (request, context) => {
        context.log('Monitoring health check requested');
        
        const startTime = Date.now();
        
        // Check all endpoints in parallel
        const results = await Promise.all(endpoints.map(checkEndpoint));
        
        const totalTime = Date.now() - startTime;
        
        // Calculate overall status
        const criticalUnhealthy = results.filter(r => r.critical && r.status === 'unhealthy');
        const anyUnhealthy = results.filter(r => r.status === 'unhealthy');
        const anyDegraded = results.filter(r => r.status === 'degraded');
        
        let overallStatus = 'healthy';
        if (criticalUnhealthy.length > 0) {
            overallStatus = 'unhealthy';
        } else if (anyUnhealthy.length > 0 || anyDegraded.length > 0) {
            overallStatus = 'degraded';
        }
        
        // Calculate stats
        const avgResponseTime = Math.round(
            results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        );
        
        return {
            status: 200,
            jsonBody: {
                overallStatus,
                checkedAt: new Date().toISOString(),
                totalCheckTime: totalTime,
                avgResponseTime,
                summary: {
                    total: results.length,
                    healthy: results.filter(r => r.status === 'healthy').length,
                    degraded: results.filter(r => r.status === 'degraded').length,
                    unhealthy: results.filter(r => r.status === 'unhealthy').length
                },
                endpoints: results,
                environment: {
                    functionApp: 'sofija-nutrition-api',
                    region: process.env.REGION_NAME || 'unknown',
                    nodeVersion: process.version
                }
            }
        };
    }
});
