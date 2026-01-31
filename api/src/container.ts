/**
 * Simple Dependency Injection Container
 * 
 * Provides a lightweight DI solution for managing service dependencies.
 * Supports singleton and factory patterns.
 */

export type ServiceFactory<T> = (container: Container) => T;

export interface ServiceRegistration<T = unknown> {
    factory: ServiceFactory<T>;
    singleton: boolean;
}

export interface RegisterOptions {
    singleton?: boolean;
}

export class Container {
    private services: Map<string, ServiceRegistration> = new Map();
    private singletons: Map<string, unknown> = new Map();

    /**
     * Register a service factory
     * @param name - Service name
     * @param factory - Factory function that receives container
     * @param options - Registration options
     */
    register<T>(name: string, factory: ServiceFactory<T>, options: RegisterOptions = {}): void {
        this.services.set(name, {
            factory,
            singleton: options.singleton || false
        });
    }

    /**
     * Resolve a service by name
     * @param name - Service name
     * @returns Service instance
     */
    resolve<T = unknown>(name: string): T {
        const registration = this.services.get(name);
        
        if (!registration) {
            throw new Error(`Service '${name}' not registered. Available: ${[...this.services.keys()].join(', ')}`);
        }

        // Return existing singleton if available
        if (registration.singleton && this.singletons.has(name)) {
            return this.singletons.get(name) as T;
        }

        // Create new instance
        const instance = registration.factory(this) as T;

        // Cache singleton
        if (registration.singleton) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    /**
     * Check if a service is registered
     * @param name - Service name
     * @returns boolean
     */
    has(name: string): boolean {
        return this.services.has(name);
    }

    /**
     * Clear all singletons (useful for testing)
     */
    clearSingletons(): void {
        this.singletons.clear();
    }

    /**
     * Clear all registrations (useful for testing)
     */
    clear(): void {
        this.services.clear();
        this.singletons.clear();
    }
}

// Create and export the default container instance
export const container = new Container();

export default { Container, container };
