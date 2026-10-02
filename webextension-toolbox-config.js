const path = require('path');

const {
    dedupeModules,
    fixZipPackage,
    useExternal,
    useImages,
    useLicenseChecker,
    useSourceMap,
    useTypescript,
} = require('@spadin/webextension-build-utils');

const allowedLicenses = [
    'Apache-2.0',
    'BSD-2-Clause',
    'MIT',
    'MPL-2.0',
    'Zlib',
];

module.exports = {
    webpack: (config, { dev }) => {

        useLicenseChecker(config, allowedLicenses);

        useSourceMap(config, dev);

        useTypescript(config);

        useImages(config, {
            optimizeImages: !dev,
        });

        // Don't bundle certain large modules to speed up build times and allow
        // the browser to cache them between builds.
        const mode = dev ? 'development' : 'production.min';

        useExternal(config, {
            module: 'react',
            global: 'React',
            from: `../node_modules/react/umd/react.${mode}.js`,
            to: 'scripts/react/react.js',
        });

        useExternal(config, {
            module: 'react-dom',
            global: 'ReactDOM',
            from: `../node_modules/react-dom/umd/react-dom.${mode}.js`,
            to: 'scripts/react/react-dom.js',
        });

        const min = dev ? '' : '.min';

        useExternal(config, {
            module: 'react-modal',
            global: 'ReactModal',
            from: `../node_modules/react-modal/dist/react-modal${min}.js`,
            to: 'scripts/react/react-modal.js',
        });

        // Chromium 136+ (Opera 136 / Chromium 152) exposes a plain-object
        // `browser` global, which makes webextension-polyfill skip promisifying
        // `chrome` and hand back the callback-based API instead. The extension
        // then silently does nothing.
        //
        // Redirecting the package through a shim that deletes the global first
        // forces the polyfill down its `wrapAPIs(chrome)` path. Aliasing has to
        // happen here rather than in an importer, because `import` declarations
        // are hoisted above the importing module's own statements.
        //
        // This must be registered *before* dedupeModules() below. dedupeModules()
        // adds a non-exact alias for the same package name, and webpack resolves
        // aliases in insertion order, so a key added afterwards would never be
        // reached and this fix would silently do nothing.
        //
        // The trailing `$` marks this as an exact-match alias, so only a bare
        // `require('webextension-polyfill')` is redirected; the deeper
        // `webextension-polyfill/dist/...` require inside the shim still
        // resolves to the real package instead of recursing back here.
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            'webextension-polyfill$': path.resolve(
                __dirname,
                'shim/webextension-polyfill.js',
            ),
        };

        // Fix for duplicate modules in bundles when some of our dependencies
        // are installed via npm link.
        dedupeModules(config, [
            'webextension-polyfill',
            'webextension-polyfill-ts',
            '@spadin/webextension-storage',
        ]);

        // dedupeModules() added a non-exact `webextension-polyfill` alias that
        // would otherwise shadow the exact-match alias set above. Dropping it
        // leaves deduplication to the nested copy inside webextension-toolbox,
        // which is the only other one in the tree.
        delete config.resolve.alias['webextension-polyfill'];

        // Workaround for issue in webextension-toolbox v3.0.0:
        // The ZipPlugin added by webextension-toolbox will get run before our
        // CopyPlugin, so the external libraries won't be included in the output
        // package unless we move ZipPlugin to the end of the plugins list.
        fixZipPackage(config);

        // Must return the modified config.
        return config;
    },
    copyIgnore: [
        '**/*.js',
        '**/*.json',
        '**/*.ts',
        '**/*.tsx',
    ],
};
