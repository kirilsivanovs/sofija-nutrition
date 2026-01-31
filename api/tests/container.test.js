/**
 * Tests for Dependency Injection Container
 */

const { Container, container } = require('../src/container');

describe('DI Container', () => {
    let testContainer;

    beforeEach(() => {
        testContainer = new Container();
    });

    describe('register', () => {
        it('should register a service factory', () => {
            testContainer.register('testService', () => ({ name: 'test' }));
            
            expect(testContainer.has('testService')).toBe(true);
        });

        it('should register multiple services', () => {
            testContainer.register('service1', () => 'one');
            testContainer.register('service2', () => 'two');
            
            expect(testContainer.has('service1')).toBe(true);
            expect(testContainer.has('service2')).toBe(true);
        });
    });

    describe('resolve', () => {
        it('should resolve a registered service', () => {
            testContainer.register('greeting', () => 'Hello, World!');
            
            const result = testContainer.resolve('greeting');
            
            expect(result).toBe('Hello, World!');
        });

        it('should throw error for unregistered service', () => {
            expect(() => testContainer.resolve('nonExistent'))
                .toThrow("Service 'nonExistent' not registered");
        });

        it('should pass container to factory function', () => {
            testContainer.register('config', () => ({ apiUrl: 'http://test.com' }));
            testContainer.register('apiClient', (c) => {
                const config = c.resolve('config');
                return { url: config.apiUrl };
            });
            
            const client = testContainer.resolve('apiClient');
            
            expect(client.url).toBe('http://test.com');
        });

        it('should create new instance each time for non-singleton', () => {
            let counter = 0;
            testContainer.register('counter', () => {
                counter++;
                return { count: counter };
            });
            
            const first = testContainer.resolve('counter');
            const second = testContainer.resolve('counter');
            
            expect(first.count).toBe(1);
            expect(second.count).toBe(2);
            expect(first).not.toBe(second);
        });
    });

    describe('singleton', () => {
        it('should return same instance for singleton', () => {
            let counter = 0;
            testContainer.register('singleton', () => {
                counter++;
                return { count: counter };
            }, { singleton: true });
            
            const first = testContainer.resolve('singleton');
            const second = testContainer.resolve('singleton');
            
            expect(first.count).toBe(1);
            expect(second.count).toBe(1);
            expect(first).toBe(second);
        });

        it('should clear singletons on clearSingletons()', () => {
            let counter = 0;
            testContainer.register('singleton', () => {
                counter++;
                return { count: counter };
            }, { singleton: true });
            
            testContainer.resolve('singleton');
            testContainer.clearSingletons();
            const result = testContainer.resolve('singleton');
            
            expect(result.count).toBe(2);
        });
    });

    describe('has', () => {
        it('should return true for registered service', () => {
            testContainer.register('exists', () => true);
            
            expect(testContainer.has('exists')).toBe(true);
        });

        it('should return false for unregistered service', () => {
            expect(testContainer.has('notExists')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all registrations', () => {
            testContainer.register('service1', () => 1);
            testContainer.register('service2', () => 2, { singleton: true });
            testContainer.resolve('service2'); // Create singleton instance
            
            testContainer.clear();
            
            expect(testContainer.has('service1')).toBe(false);
            expect(testContainer.has('service2')).toBe(false);
        });
    });

    describe('dependency chain', () => {
        it('should resolve complex dependency chain', () => {
            testContainer.register('database', () => ({ type: 'postgres' }), { singleton: true });
            testContainer.register('repository', (c) => ({
                db: c.resolve('database'),
                save: () => 'saved'
            }));
            testContainer.register('service', (c) => ({
                repo: c.resolve('repository'),
                process: () => 'processed'
            }));
            
            const service = testContainer.resolve('service');
            
            expect(service.repo.db.type).toBe('postgres');
            expect(service.repo.save()).toBe('saved');
            expect(service.process()).toBe('processed');
        });
    });
});

describe('Default Container', () => {
    it('should export a default container instance', () => {
        expect(container).toBeInstanceOf(Container);
    });

    it('should be usable for registration', () => {
        container.register('testDefault', () => 'default works');
        
        expect(container.resolve('testDefault')).toBe('default works');
        
        // Cleanup
        container.clear();
    });
});
