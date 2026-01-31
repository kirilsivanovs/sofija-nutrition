/**
 * Simple Dependency Injection Container
 * 
 * Provides a lightweight DI solution for managing service dependencies.
 * Supports singleton and factory patterns.
 */

class Container {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a service factory
     * @param {string} name - Service name
     * @param {Function} factory - Factory function that receives container
     * @param {Object} options - Registration options
     * @param {boolean} options.singleton - Whether to create only one instance
     */
    register(name, factory, options = {}) {
        this.services.set(name, {
            factory,
            singleton: options.singleton || false
        });
    }

    /**
     * Resolve a service by name
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    resolve(name) {
        const registration = this.services.get(name);
        
        if (!registration) {
            throw new Error(`Service '${name}' not registered. Available: ${[...this.services.keys()].join(', ')}`);
        }

        // Return existing singleton if available
        if (registration.singleton && this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Create new instance
        const instance = registration.factory(this);

        // Cache singleton
        if (registration.singleton) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Clear all singletons (useful for testing)
     */
    clearSingletons() {
        this.singletons.clear();
    }

    /**
     * Clear all registrations (useful for testing)
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}

// Create and export the default container instance
const container = new Container();

module.exports = { Container, container };
