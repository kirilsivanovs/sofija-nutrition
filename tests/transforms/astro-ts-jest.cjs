/**
 * Custom ts-jest transformer that handles Astro's import.meta.env
 * 
 * Replaces import.meta.env.X with process.env.X before ts-jest compiles,
 * allowing Jest to test modules that use Astro env variables.
 */
const path = require('path');
const { TsJestTransformer } = require('ts-jest');

class AstroTsJestTransformer extends TsJestTransformer {
    constructor() {
        super({
            tsconfig: path.resolve(__dirname, '../../tsconfig.json'),
            isolatedModules: true,
        });
    }

    process(sourceText, sourcePath, options) {
        // Replace Astro's import.meta.env with process.env before TS compilation
        const transformed = sourceText.replace(/import\.meta\.env/g, 'process.env');
        return super.process(transformed, sourcePath, options);
    }
}

module.exports = new AstroTsJestTransformer();
