const webpack = require('webpack');
const path = require('path');
const { createRefreshTemplate } = require('./utils/createTemplate');
const { injectEntry } = require('./utils/injectEntry');
const {
  prefreshUtils,
  NAME,
  matcherOptions,
  nextMatcherOptions,
  injectRefreshFunctions,
} = require('./utils/constants');

class ReloadPlugin {
  constructor(options) {
    this.matcher = webpack.ModuleFilenameHelpers.matchObject.bind(
      undefined,
      options && options.runsInNextJs ? nextMatcherOptions : matcherOptions
    );

    this.options = {
      runsInNextJs: Boolean(options && options.runsInNextJs),
    };
  }

  webpack4(compiler) {
    compiler.hooks.normalModuleFactory.tap(NAME, nmf => {
      nmf.hooks.afterResolve.tap(NAME, data => {
        if (
          this.matcher(data.resource) &&
          !data.resource.includes('@prefresh') &&
          !data.resource.includes(path.join(__dirname, './loader')) &&
          !data.resource.includes(path.join(__dirname, './utils'))
        ) {
          data.loaders.unshift({
            loader: require.resolve('./loader'),
            options: undefined,
          });
        }

        return data;
      });
    });

    compiler.hooks.compilation.tap(NAME, compilation => {
      injectRefreshFunctions(compilation);
      compilation.mainTemplate.hooks.require.tap(NAME, (source, chunk, hash) =>
        createRefreshTemplate(
          source,
          chunk,
          hash,
          compilation.mainTemplate,
          this.options
        )
      );
    });
  }

  webpack5(compiler) {
    const ConstDependency = require('webpack/lib/dependencies/ConstDependency');

    const RuntimeGlobals = require('webpack/lib/RuntimeGlobals');
    const PrefreshRuntimeModule = require('./utils/Runtime');

    compiler.hooks.compilation.tap(
      NAME,
      (compilation, { normalModuleFactory }) => {
        if (compilation.compiler !== compiler) {
          return;
        }

        injectRefreshFunctions(compilation);

        compilation.dependencyTemplates.set(
          ConstDependency,
          new ConstDependency.Template()
        );

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          NAME,
          (chunk, runtimeRequirements) => {
            runtimeRequirements.add(RuntimeGlobals.interceptModuleExecution);
            compilation.addRuntimeModule(chunk, new PrefreshRuntimeModule());
          }
        );

        normalModuleFactory.hooks.afterResolve.tap(
          NAME,
          ({ createData: data }) => {
            if (
              this.matcher(data.resource) &&
              !data.resource.includes('@prefresh') &&
              !data.resource.includes(path.join(__dirname, './loader')) &&
              !data.resource.includes(path.join(__dirname, './utils'))
            ) {
              data.loaders.unshift({
                loader: require.resolve('./loader'),
                options: undefined,
              });
            }
          }
        );
      }
    );
  }

  apply(compiler) {
    if (
      process.env.NODE_ENV === 'production' ||
      compiler.options.mode === 'production'
    )
      return;

    const internalWebpackVersion = compiler.webpack
      ? compiler.webpack.version[0]
      : 4;
    const externalWebpackVersion = webpack.version[0];

    if (!externalWebpackVersion) {
      throw new Error(
        `Missing webpack Dependency, try installing webpack@${
          compiler.webpack ? compiler.webpack.version : 4
        } locally.`
      );
    }

    if (internalWebpackVersion !== externalWebpackVersion) {
      throw new Error(`
        Next is using webpack-version ${internalWebpackVersion} and you have ${externalWebpackVersion} installed.

        Try installing ${
          compiler.webpack ? compiler.webpack.version : 4
        } locally.
        Or if you want to try webpack 5 you can turn this on with { future: { webpack5:true } } in you next.config.js.
      `);
    }

    compiler.options.entry = injectEntry(compiler.options.entry);

    const providePlugin = new webpack.ProvidePlugin({
      [prefreshUtils]: require.resolve('./utils/prefresh'),
    });
    providePlugin.apply(compiler);

    switch (Number(webpack.version[0])) {
      case 4: {
        this.webpack4(compiler);
        break;
      }
      case 5: {
        this.webpack5(compiler);
        break;
      }
      default: {
        throw new Error('Unsupported webpack version.');
      }
    }
  }
}

ReloadPlugin.supportsNextJs = true;

module.exports = ReloadPlugin;
