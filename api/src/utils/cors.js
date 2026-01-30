/**
 * CORS Headers Utility
 * Adds CORS headers to responses for local development and production
 */

const allowedOrigins = [
    'http://localhost:4321',
    'http://localhost:3000',
    'https://www.sofija-nutrition.lv',
    'https://sofija-nutrition.lv'
];

/**
 * Get CORS headers for a request
 * @param {Object} request - The HTTP request object
 * @returns {Object} - CORS headers
 */
function getCorsHeaders(request) {
    const origin = request.headers.get('origin') || request.headers.get('Origin');
    
    // Check if origin is allowed
    const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

/**
 * Add CORS headers to a response object
 * @param {Object} response - The response object
 * @param {Object} request - The request object
 * @returns {Object} - Response with CORS headers
 */
function addCorsHeaders(response, request) {
    const corsHeaders = getCorsHeaders(request);
    
    return {
        ...response,
        headers: {
            ...corsHeaders,
            ...(response.headers || {})
        }
    };
}

module.exports = {
    getCorsHeaders,
    addCorsHeaders
};
