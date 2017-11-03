import gulp from 'gulp';
import del from 'del';
import sequence from 'run-sequence'; // запуск задач в указанном порядке (начиная с gulp 4.0 можно использовать нативные средства)
import watch from 'gulp-watch';
import changed from 'gulp-changed';
import gulpIf from 'gulp-if';
import fs from 'fs';
import crypto from 'crypto';
import concat from 'gulp-concat';
import print from 'gulp-print';
import sass from 'gulp-sass';
import prefixer from 'gulp-autoprefixer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import cleanCss from 'gulp-clean-css';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';
import fontello from 'gulp-fontello';
import realFavicon from 'gulp-real-favicon';
import cssBase64 from 'gulp-css-base64';
import gutil from 'gulp-util';
import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'gulp-buffer';
import source from 'vinyl-source-stream';

import config from './gulpconfig';


function cleanDirs() {
  return del(config.clean).then((paths) => {
    gutil.log('Removed files and folders:\n', paths.join('\n'));
  });
}

gulp.task('clean', cleanDirs);

/**
 *  Создаются задачи copy:* для копирования файлов
 *  и директорий прописанных в конфиге copyPaths
 *  @param from string|array - откуда копировать файлы,
 *  это может быть массив файлов, маска или один файл
 *  @param to string - куда копировать файлы.
 *  Папка - если копируются файлы из массива или по маске,
 *  название файла - если копируем 1 файл.
 */
function copyCallBack(from, to) {
  return () => {
    if (fs.existsSync(from) && fs.lstatSync(from).isFile()) {
      gutil.log(`Copy ${from} -> ${to}`);
      fs.writeFileSync(to, fs.readFileSync(from));
    } else {
      let files;
      let name = '';
      let dest = '';
      let merge = false;
      if (from instanceof Array) {
        merge = from instanceof Array;
        files = from;
        const slashPos = to.lastIndexOf('/');
        name = to.slice(slashPos + 1);
        dest = to.slice(0, slashPos);
      } else {
        files = [from];
        dest = to;
      }
      gutil.log('Copy', files.join('\n'), '->', dest)
      if (merge) {
        return gulp.src(files)
          .pipe(gulpIf(merge, concat(name)))
          .pipe(gulp.dest(dest));
      }
      return gulp.src(files)
        .pipe(gulp.dest(dest));
    }
    return null;
  };
}

const copyCallBackStorage = [];
Object.keys(config.copyPaths).forEach((copyFileName) => {
  if ({}.hasOwnProperty.call(config.copyPaths, copyFileName)) {
    copyCallBackStorage.push(`copy:${copyFileName}`);
    const copyPaths = config.copyPaths[copyFileName];
    gulp.task(`copy:${copyFileName}`, copyCallBack(copyPaths.from, copyPaths.to));
  }
});
gulp.task('copy-all', () => sequence(copyCallBackStorage));


gulp.task('init', (done) => {
  sequence('clean', 'copy-all', ['glyph', 'favicons'], ['js-dev', 'css-dev'], ['js-production', 'css-production'], 'cache-busting', 'images', done);
});

// во время деплоя удалять css+js+fonts+images нельзя,
// т.к. это происходит на рабочем сайте и во время деплоя у посетителей могут быть глюки
gulp.task('deploy', (done) => {
  sequence('copy-all', ['glyph', 'favicons'], ['js-production', 'css-production'], 'cache-busting', 'images', done);
});

gulp.task('build-production', (done) => {
  sequence('copy-all', 'glyph', ['js-production', 'css-production'], 'cache-busting', done);
});

gulp.task('build-dev', (done) => {
  sequence('copy-all', 'glyph', ['js-dev', 'css-dev'], done);
});


gulp.task('glyph', () => gulp.src('fontello-config.json')
  .pipe(fontello())
  .pipe(gulp.dest(config.path.dst.fonts)));


/**
 * Построить CSS файлы
 * @param files string|array - scss или css файл или массив файлов, которые надо обработать
 * @param fileName string - имя файла на выходе (name + '.css')
 * @param isProduction boolean - true, если парсим для production, false - для dev
 */
function cssCallBack(files, fileName, isProduction) {
  return () => {
    const merge = files instanceof Array && files.length > 1;
    return gulp.src(files)
      .pipe(gulpIf(merge, concat(`${fileName}.scss`)))
      .pipe(gulpIf(!isProduction, sourcemaps.init()))
      .pipe(sass().on('error', sass.logError))
      .pipe(prefixer({
        browsers: ['last 2 versions', 'ie 10', 'ie 11', 'last 3 ios versions'],
      }))
      .pipe(gulpIf(isProduction, cleanCss()))
      .pipe(gulpIf(isProduction, rename({ suffix: '.min' })))
      .pipe(gulpIf(!isProduction, sourcemaps.write('./maps')))
      .pipe(cssBase64({
        baseDir: 'www',
        maxWeightResource: 4096,
        extensionsAllowed: ['.gif', '.jpg', '.png', '.svg'],
      }))
      .pipe(gulp.dest(config.path.dst.css))
      .pipe(print((filepath) => {
        return `Finished: ${filepath}`;
      }));
  };
}

const cssDevCallBackStorage = [];
const cssProductionCallBackStorage = [];
Object.keys(config.cssFiles).forEach((cssFileName) => {
  if ({}.hasOwnProperty.call(config.cssFiles, cssFileName)) {
    const cssFilesArray = config.cssFiles[cssFileName];
    cssDevCallBackStorage.push(`css-dev:${cssFileName}`);
    cssProductionCallBackStorage.push(`css-production:${cssFileName}`);
    gulp.task(`css-dev:${cssFileName}`, cssCallBack(cssFilesArray, cssFileName, false));
    gulp.task(`css-production:${cssFileName}`, cssCallBack(cssFilesArray, cssFileName, true));
  }
});

gulp.task('css-dev', () => sequence(cssDevCallBackStorage));
gulp.task('css-production', () => sequence(cssProductionCallBackStorage));


/**
 * Build images
 *
 * @param images array - массив картинок, которые надо минифицировать
 * @param force boolean - если задано и == true, пересжать все картинки, иначе только новые
 *
 */
function buildImages(images, force) {
  // если images - 1 файл, который находится в подпапке внутри path.src.img, то gulp
  // не знает что сохранять файл надо в подкаталог и просто выкидывает этот файл
  // в корень path.dst.img,
  // поэтому надо указать базовый каталог исходников картинок

  const isForce = typeof force !== 'undefined' ? force : false;

  return gulp.src(images, { base: config.path.src.img }) // выберем наши картинки
    .pipe(gulpIf(!isForce, changed(config.path.dst.img)))
    .pipe(imagemin([
      imagemin.gifsicle(),
      imagemin.jpegtran(),
      imagemin.svgo({ removeViewBox: false }),
      pngquant({
        floyd: 1,
        nofs: false,
        posterize: 3,
        quality: '1-95',
        speed: 2,
        verbose: true,
      })], { // и сожмем их
      progressive: true,
      interlaced: true,
    }))
    .pipe(gulp.dest(config.path.dst.img));
}

gulp.task('images', () => buildImages(`${config.path.src.img}**/*.*`));
gulp.task('images-force', () => buildImages(`${config.path.src.img}**/*.*`, true));


/*
 Cache busting
 */
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function replaceAll(str, mapObj) {
  let strReturn = str;
  Object.keys(mapObj).forEach((from) => {
    if ({}.hasOwnProperty.call(mapObj, from)) {
      const to = mapObj[from];
      const re = new RegExp(from, 'gi');
      strReturn = strReturn.replace(re, to);
    }
  });
  return strReturn;
}

function updateHashes(hashes) {
  Object.keys(hashes).forEach((fileName) => {
    if ({}.hasOwnProperty.call(hashes, fileName)) {
      const files = hashes[fileName];
      const replaces = {};
      const clean = {};
      Object.keys(files).forEach((assetFile) => {
        if ({}.hasOwnProperty.call(files, assetFile)) {
          const hash = files[assetFile];
          const escapedAssetFile = escapeRegExp(assetFile);
          clean[`${escapedAssetFile}\\?v=[a-z0-9]+`] = assetFile;
          replaces[escapedAssetFile] = `${assetFile}?v=${hash}`;
          gutil.log(`Cache busting ${assetFile} -> ${assetFile}?v=${hash}`);
        }
      });

      fs.readFile(fileName, 'utf-8', (err, data) => {
        if (err) {
          gutil.log(`Error: ${err}`);
        }
        let result = data;
        result = replaceAll(result, clean);
        result = replaceAll(result, replaces);
        fs.writeFile(fileName, result, 'utf-8', (writeError) => {
          if (writeError) {
            gutil.log(`Error: ${writeError}`);
          }
        });
      });
    }
  });
}

function getHash(filename) {
  let hash = false;
  const data = fs.readFileSync(filename, {encoding: 'utf-8'});
  if (data) {
    hash = crypto.createHash('md5').update(data).digest('hex');
  }
  return hash;
}

gulp.task('cache-busting', (callback) => {
  const hashes = {};
  Object.keys(config.cacheBustingConfig).forEach((fileName) => {
    if ({}.hasOwnProperty.call(config.cacheBustingConfig, fileName)) {
      const files = config.cacheBustingConfig[fileName];
      hashes[fileName] = {};
      files.forEach((assetFile) => {
        const hash = getHash(config.path.dst.www + assetFile);
        if (hash) {
          hashes[fileName][assetFile] = hash;
        }
      });
    }
  });
  updateHashes(hashes);
  callback();
  gutil.log('Finished: cache busting');
});


/**
 * Build favicons
 */
const FAVICON_DATA_FILE = 'faviconData.json'; // File where the favicon markups are stored

function buildFavicons(callback) {
  gutil.log('Favicons: start');
  realFavicon.generateFavicon({
    masterPicture: config.logo,
    dest: config.path.dst.icons,
    iconsPath: config.path.web.icons,
    design: {
      ios: {
        pictureAspect: 'noChange',
        assets: {
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false,
          declareOnlyDefaultIcon: true,
        },
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: config.color,
        onConflict: 'override',
        assets: {
          windows80Ie10Tile: true,
          windows10Ie11EdgeTiles: {
            small: false,
            medium: true,
            big: false,
            rectangle: false,
          },
        },
      },
      androidChrome: {
        pictureAspect: 'noChange',
        themeColor: config.color,
        manifest: {
          name: config.name,
          display: 'browser',
          orientation: 'notSet',
          onConflict: 'override',
          declared: true,
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        },
      },
    },
    settings: {
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: false,
    },
    markupFile: FAVICON_DATA_FILE,
  }, () => {
    gutil.log('Favicons: writing meta to HTML');
    fs.writeFileSync(config.path.views.icons,
      JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code
    );
    callback();
  });
}

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('favicons', callback => buildFavicons(callback));

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('favicon-check-update', (callback) => {
  const currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
  realFavicon.checkForUpdates(currentVersion, (err) => {
    if (err) {
      return buildFavicons(callback);
    }
    return callback();
  });
});


/**
 *  Создаются задачи js:* для генерации js-файлов
 */
function jsCallBackDev(jsFileName, files) {
  return () => browserify(files, { debug: true, noparse: ['jquery'] })
    .transform(babelify)
    .transform({
      global: true,
    }, 'browserify-shim')
    .bundle()
    .pipe(source(`${jsFileName}.js`))
    .pipe(buffer()) // transform streaming contents into buffer contents
    .pipe(sourcemaps.init({ loadMaps: true })) // load and init sourcemaps
    .pipe(sourcemaps.write('.')) // write sourcemaps
    .pipe(gulp.dest(config.path.dst.js));
}

function jsCallBackProduction(jsFileName, files) {
  return () => browserify(files, { debug: false, noparse: ['jquery'] })
    .transform(babelify)
    .transform({
      global: true,
    }, 'browserify-shim')
    .bundle()
    .pipe(source(`${jsFileName}.min.js`))
    .pipe(buffer())
    .pipe(uglify({
      compress: { drop_console: true },
    }))
    .pipe(gulp.dest(config.path.dst.js));
}

const jsCallBackDevStorage = [];
const jsCallBackProductionStorage = [];

Object.keys(config.jsFiles).forEach((dstJsFileName) => {
  if ({}.hasOwnProperty.call(config.jsFiles, dstJsFileName)) {
    const srcJsFiles = config.jsFiles[dstJsFileName];
    jsCallBackDevStorage.push(`js-dev:${dstJsFileName}`);
    jsCallBackProductionStorage.push(`js-production:${dstJsFileName}`);
    gulp.task(`js-dev:${dstJsFileName}`, jsCallBackDev(dstJsFileName, srcJsFiles));
    gulp.task(`js-production:${dstJsFileName}`, jsCallBackProduction(dstJsFileName, srcJsFiles));
  }
});

gulp.task('js-dev', jsCallBackDevStorage);
gulp.task('js-production', jsCallBackProductionStorage);

function isPathInFiles(path, filesToCheck) {
  let filesArray;
  let found = false;
  if (!(filesToCheck instanceof Array)) {
    filesArray = [filesToCheck];
  } else {
    filesArray = filesToCheck;
  }
  filesArray.forEach((file) => {
    const fixedPath = path.split('\\').join('/');
    const pos = fixedPath.indexOf(file);
    if (pos > 0 && pos + file.length === fixedPath.length) {
      found = true;
      return found;
    }
    return found;
  });
  return found;
}


/**
 * Watch
 *
 */
gulp.task('watch', () => {
  gulp.watch(`${config.path.src.js}**/*.js`, (file) => {
    gutil.log(`Changed ${file.path}`);
    gulp.start('js-dev');
  });

  // пройти в цикле по измененным файлам
  gulp.watch(`${config.path.src.scss}**/*.scss`, (file) => {
    if (file.type === 'deleted') {
      gutil.log(`Removed ${file.path}`);
      gutil.log(`Файл в ${config.path.dst.css}`);
    } else {
      gutil.log(`Changed ${file.path}`);
      let isFound = false;
      Object.keys(config.cssFiles).forEach((cssFileName) => {
        if ({}.hasOwnProperty.call(config.cssFiles, cssFileName)) {
          if (isPathInFiles(file.path, config.cssFiles[cssFileName])) {
            gulp.start(`css-dev:${cssFileName}`);
            isFound = true;
          }
        }
      });
      if (!isFound) {
        gulp.start('css-dev');
      }
    }
  });

  gulp.watch(`${config.path.src.img}**/*.*`, (file) => {
    if (file.type === 'deleted') {
      gutil.log(`Removed ${file.path}`);
      gutil.log(`Файл в ${config.path.dst.img} не удален`);
      // console.log('Removing ' + path.dst.img + file.base);
      // fs.unlinkSync(path.dst.img + file.base);
    } else {
      gutil.log(`Changed ${file.path}`);
      buildImages(file.path);
    }
  });

  gulp.watch(config.path.views.layout, ['copy:layout', 'cache-busting']);
});

gulp.task('default', ['favicon-check-update', 'build-dev', 'watch']);
