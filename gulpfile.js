/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var packageData = require('./package.json');
var moduleMap = require('./scripts/module-map');
var del = require('del');
var gulpCheckDependencies = require('fbjs-scripts/gulp/check-dependencies');
var gulp = require('gulp');
var ts = require('gulp-typescript');
var cleanCSS = require('gulp-clean-css');
var concatCSS = require('gulp-concat-css');
var derequire = require('gulp-derequire');
var flatten = require('gulp-flatten');
var header = require('gulp-header');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var gulpUtil = require('gulp-util');
var StatsPlugin = require('stats-webpack-plugin');
var through = require('through2');
var webpackStream = require('webpack-stream');
var merge = require('merge2');
var TerserPlugin = require('terser-webpack-plugin');

var tsProject = ts.createProject('./tsconfig.dist.json');
var tsProjectMin = ts.createProject('./tsconfig.dist.json');

var paths = {
  dist: 'dist',
  lib: 'lib',
  src: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*',
  ],
  css: ['src/**/*.css'],
};

// FIXME: strip __DEV__

var COPYRIGHT_HEADER = `/**
 * Draft v<%= version %>
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`;

const terserPlugin = outputEcmaVersion =>
  new TerserPlugin({
    terserOptions: {
      parse: {
        ecma: 8,
      },
      compress: {
        ecma: outputEcmaVersion,
        warnings: false,
        // Disabled because of an issue with Uglify breaking seemingly valid code:
        // https://github.com/facebook/create-react-app/issues/2376
        // Pending further investigation:
        // https://github.com/mishoo/UglifyJS2/issues/2011
        comparisons: false,
      },
      mangle: {
        safari10: true,
      },
      output: {
        ecma: outputEcmaVersion,
        comments: false,
        // Turned on because emoji and regex is not minified properly using default
        // https://github.com/facebook/create-react-app/issues/2488
        ascii_only: true,
      },
    },
    // Use multi-process parallel running to improve the build speed
    // Default number of concurrent runs: os.cpus().length - 1
    // srubin(5/15/2020): turning off to try to fix CI build
    parallel: false,
    // Enable file caching
    cache: true,
    sourceMap: true,
  });

var buildDist = function(opts) {
  var webpackOpts = {
    externals: {
      immutable: {
        root: 'Immutable',
        commonjs2: 'immutable',
        commonjs: 'immutable',
        amd: 'immutable',
      },
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom',
      },
    },
    output: {
      filename: opts.output,
      libraryTarget: 'umd',
      library: 'Draft',
    },
    optimization: opts.debug
      ? {minimize: false}
      : {
          minimizer: [terserPlugin(6)],
        },
    plugins: [
      new webpackStream.webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(
          opts.debug ? 'development' : 'production',
        ),
      }),
      new webpackStream.webpack.LoaderOptionsPlugin({
        debug: opts.debug,
      }),
      new StatsPlugin(`../meta/bundle-size-stats/${opts.output}.json`, {
        chunkModules: true,
      }),
    ],
  };

  const wpStream = webpackStream(webpackOpts, null, function(err, stats) {
    if (err) {
      throw new gulpUtil.PluginError('webpack', err);
    }
    if (stats.compilation.errors.length) {
      gulpUtil.log('webpack', '\n' + stats.toString({colors: true}));
    }
  });
  return wpStream;
};

gulp.task(
  'clean',
  gulp.series(function() {
    return del([paths.dist, paths.lib]);
  }),
);

gulp.task(
  'modules',
  gulp.series(function() {
    const tsResult = tsProject.src().pipe(tsProject());
    return merge([
      tsResult.dts.pipe(gulp.dest(paths.lib)),
      tsResult.js.pipe(gulp.dest(paths.lib)),
    ]);
  }),
);
gulp.task(
  'modules:min',
  gulp.series(function() {
    const tsResult = tsProjectMin.src().pipe(tsProjectMin());
    return merge([
      tsResult.dts.pipe(gulp.dest(paths.lib)),
      tsResult.js.pipe(gulp.dest(paths.lib)),
    ]);
  }),
);

gulp.task(
  'css',
  gulp.series(function() {
    return (
      gulp
        .src(paths.css)
        .pipe(
          through.obj(function(file, encoding, callback) {
            var contents = file.contents.toString();
            var replaced = contents.replace(
              // Regex based on MakeHasteCssModuleTransform: ignores comments,
              // strings, and URLs
              /\/\*.*?\*\/|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|url\([^)]*\)|(\.(?:public\/)?[\w-]*\/{1,2}[\w-]+)/g,
              function(match, cls) {
                if (cls) {
                  return cls.replace(/\//g, '-');
                } else {
                  return match;
                }
              },
            );
            replaced = replaced.replace(
              // MakeHasteCssVariablesTransform
              /\bvar\(([\w-]+)\)/g,
              function(match, name) {
                var vars = {
                  'fig-secondary-text': '#9197a3',
                  'fig-light-20': '#bdc1c9',
                };
                if (vars[name]) {
                  return vars[name];
                } else {
                  throw new Error('Unknown CSS variable ' + name);
                }
              },
            );
            file.contents = Buffer.from(replaced);
            callback(null, file);
          }),
        )
        .pipe(concatCSS('Draft.css'))
        // Avoid rewriting rules *just in case*, just compress
        .pipe(cleanCSS({advanced: false}))
        .pipe(header(COPYRIGHT_HEADER, {version: packageData.version}))
        .pipe(gulp.dest(paths.dist))
    );
  }),
);

gulp.task(
  'dist',
  gulp.series('modules', 'css', function() {
    var opts = {
      debug: true,
      output: 'Draft.js',
    };
    return gulp
      .src('./lib/Draft.js')
      .pipe(buildDist(opts))
      .pipe(derequire())
      .pipe(
        gulpif(
          '*.js',
          header(COPYRIGHT_HEADER, {version: packageData.version}),
        ),
      )
      .pipe(gulp.dest(paths.dist));
  }),
);

gulp.task(
  'dist:min',
  gulp.series('modules:min', function() {
    var opts = {
      debug: false,
      output: 'Draft.min.js',
    };
    return gulp
      .src('./lib/Draft.js')
      .pipe(buildDist(opts))
      .pipe(
        gulpif(
          '*.js',
          header(COPYRIGHT_HEADER, {version: packageData.version}),
        ),
      )
      .pipe(gulp.dest(paths.dist));
  }),
);

gulp.task(
  'check-dependencies',
  gulp.series(function() {
    return gulp.src('package.json').pipe(gulpCheckDependencies());
  }),
);

gulp.task(
  'watch',
  gulp.series(function() {
    gulp.watch(paths.src, gulp.parallel('modules'));
  }),
);

gulp.task(
  'dev',
  gulp.series(function() {
    gulp.watch(paths.src, gulp.parallel('dist'));
  }),
);

gulp.task(
  'default',
  gulp.series(
    'check-dependencies',
    'clean',
    gulp.parallel('modules'),
    gulp.parallel('dist', 'dist:min'),
  ),
);
