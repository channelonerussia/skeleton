'use strict';

var config = require('./gulpconfig');

var gulp = require('gulp'),
    sequence = require('run-sequence'), // запуск задач в указанном порядке (начиная с gulp 4.0 можно использовать нативные средства)
    watch = require('gulp-watch'),
    changed = require('gulp-changed'),
    gulpIf = require('gulp-if'),
    pump = require('pump'),
    fs = require('fs'),
    crypto = require('crypto'),
    concat = require('gulp-concat'),
    print = require('gulp-print'),
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    minifier = require('gulp-uglify/minifier'),
    sourcemaps = require('gulp-sourcemaps'),
//    rigger = require('gulp-rigger'), //  позволяет импортировать один файл в другой простой конструкцией //= footer.html
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
//    rimraf = require('rimraf'), // очитска директорий с css, js, картинками
    uglifyjs = require('uglify-js'),
    fontello = require('gulp-fontello'),
    realFavicon = require('gulp-real-favicon'),
    cssBase64 = require('gulp-css-base64');


/**
 *  Создаются задачи copy:* для копирования файлов и директорий прописанных в конфиге copyPaths
 *  @param from string|array - откуда копировать файлы, это может быть массив файлов, маска или один файл
 *  @param to string - куда копировать файлы. Папка - если копируются файлы из массива или по маске, название файла - если копируем 1 файл.
 */
function copyCallBack(from, to) {
    return function() {
        print('Copy ' + from + ' -> ' + to);

        if (fs.existsSync(from) && fs.lstatSync(from).isFile()) {
            fs.writeFileSync(to, fs.readFileSync(from));
        } else {
            var files = [],
                name = '',
                dest = '',
                merge = false;
            if (from instanceof Array) {
                merge = from instanceof Array;
                files = from;
                var slashPos = to.lastIndexOf('/');
                name = to.slice(slashPos+1);
                dest = to.slice(0, slashPos);
            } else {
                files = [from];
                dest = to;
            }
            if (merge) {
                return gulp.src(files)
                    .pipe(gulpIf(merge, concat(name)))
                    .pipe(gulp.dest(dest));
            } else {
                return gulp.src(files)
                    .pipe(gulp.dest(dest));
            }
        }
    };
}
var copyCallBackStorage = [];
for (var name in config.copyPaths) {
    var paths = config.copyPaths[name];
    copyCallBackStorage.push('copy:' + name);
    gulp.task('copy:' + name, copyCallBack(paths.from, paths.to));
}
gulp.task('copy-all', copyCallBackStorage);


gulp.task('build-init', function (done) {
    sequence('copy-all', 'glyph', ['js-dev', 'css-dev'], ['js-production', 'css-production'], 'cache-busting', 'build-favicons', 'build-images', done);
});

gulp.task('build-production', function (done) {
    sequence('copy-all', 'glyph', ['js-production', 'css-production'], 'cache-busting', done);
});

gulp.task('build-dev', function (done) {
    sequence('copy-all', 'glyph', ['js-dev', 'css-dev'], done);
});

gulp.task('glyph', function () {
    return gulp.src('fontello-config.json')
        .pipe(fontello())
        .pipe(gulp.dest(config.path.dst.fonts))
});



/**
 * Построить CSS файлы
 * @param files string|array - scss или css файл или массив файлов, которые надо обработать
 * @param name string - имя файла на выходе (name + '.css')
 * @param isProduction boolean - true, если парсим для production, false - для dev
 */
function cssCallBack(files, name, isProduction) {
    return function() {
        var merge = files instanceof Array && files.length > 1;
/*        if (merge) {
            console.log('Building ' + config.path.dst.css + name + ".css from an array: " + files);
        } else {
            console.log('Building ' + config.path.dst.css + name + ".css from a file: " + files);
        }*/

        return gulp.src(files)
            .pipe(gulpIf(merge, concat(name + '.scss')))
            .pipe(gulpIf(!isProduction, sourcemaps.init()))
            .pipe(sass().on('error', sass.logError))
            .pipe(prefixer({
                browsers: ['last 2 versions', 'ie 10', 'ie 11', 'last 3 ios versions']
            }))
            .pipe(gulpIf(isProduction, cleanCss()))
            .pipe(gulpIf(isProduction, rename({suffix: '.min'})))
            .pipe(gulpIf(!isProduction, sourcemaps.write('./maps')))
            .pipe(cssBase64({
                baseDir: "www",
                maxWeightResource: 8192,
                extensionsAllowed: ['.gif', '.jpg', '.png', '.svg']
            }))
            .pipe(gulp.dest(config.path.dst.css))
            .pipe(print(function(filepath) {
                return "Finished: " + filepath;
            }));
    };
}
var cssDevCallBackStorage = [],
    cssProductionCallBackStorage = [];
for (var name in config.cssFiles) {
    var cssFiles = config.cssFiles[name];
    cssDevCallBackStorage.push('css-dev:' + name);
    cssProductionCallBackStorage.push('css-production:' + name);
    gulp.task('css-dev:' + name, cssCallBack(cssFiles, name, false));
    gulp.task('css-production:' + name, cssCallBack(cssFiles, name, true));
}
gulp.task('css-dev', cssDevCallBackStorage);
gulp.task('css-production', cssProductionCallBackStorage);




/**
 * Build images
 *
 * @param images array - массив картинок, которые надо минифицировать
 * @param force boolean - если задано и == true, пересжать все картинки, иначе только новые
 *
 */
function buildImages(images, force) {
    // если images - 1 файл, который находится в подпапке внутри path.src.img, то gulp
    // не знает что сохранять файл надо в подкаталог и просто выкидывает этот файл в корень path.dst.img,
    // поэтому надо указать базовый каталог исходников картинок

    force = typeof force !== 'undefined' ? force : false;

    return gulp.src(images, {base: config.path.src.img}) // выберем наши картинки
        .pipe(gulpIf(!force, changed(config.path.dst.img)))
        .pipe(imagemin(
            [
                imagemin.gifsicle(),
                imagemin.jpegtran(),
                imagemin.svgo({removeViewBox: false}),
                pngquant({
                    floyd: 1,
                    nofs: false,
                    posterize: 3,
                    quality: '1-95',
                    speed: 2,
                    verbose: true
                })
            ], { // и сожмем их
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(config.path.dst.img));
}

gulp.task('build-images', function () {
    buildImages(config.path.src.img + '**/*.*');
});

gulp.task('build-images-force', function () {
    buildImages(config.path.src.img + '**/*.*', true);
});



/*
 Cache busting
 */
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function replaceAll(str, mapObj) {
    for (var from in mapObj) {
        var to = mapObj[from],
            re = new RegExp(from, "gi");
        str = str.replace(re, function(matched) {
            return to;
        });
    }
    return str;
}

function updateHashes(hashes) {
    for (var fileName in hashes) {
        var files = hashes[fileName],
            replaces = {},
            clean = {};
        for (var assetFile in files) {
            var hash = files[assetFile],
                escapedAssetFile = escapeRegExp(assetFile);
            clean[escapedAssetFile + '\\?v=[a-z0-9]+'] = assetFile;
            replaces[escapedAssetFile] = assetFile + '?v=' + hash;
            print('Cache busting' + assetFile + ' -> ' + assetFile + '?v=' + hash);
        }

        fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) {
                process.stdout.write('Error: ' + err + "\n");
            }
            var result = data;
            result = replaceAll(result, clean);
            result = replaceAll(result, replaces);
            fs.writeFile(fileName, result, 'utf-8', function (err) {
                if (err) {
                    process.stdout.write('Error: ' + err + "\n");
                }
            });
        });
    }
}

function getHash(filename) {
    var hash = false,
        data = fs.readFileSync(filename, {encoding: 'utf-8'});
    if (data) {
        hash = crypto.createHash('md5').update(data).digest('hex');
    }
    return hash;
}

gulp.task('cache-busting', function () {
    var hashes = {};
    for (var fileName in config.cacheBustingConfig) {
        var files = config.cacheBustingConfig[fileName];
        hashes[fileName] = {};
        files.forEach(function(assetFile) {
            var hash = getHash(config.path.dst.www + assetFile);
            if (hash) {
                hashes[fileName][assetFile] = hash;
            }
        });
    }
    updateHashes(hashes);
    print('Finished: cache busting');
});






/*
 Build favicons
 */

// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

function buildFavicons() {
    print('Favicons: start');
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
                    declareOnlyDefaultIcon: true
                }
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
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: config.color,
                manifest: {
                    name: config.name,
                    display: 'browser',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false
        },
        markupFile: FAVICON_DATA_FILE
    }, function() {
        print('Favicons: writing meta to HTML');
        fs.writeFileSync(config.path.views.icons, JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code);
    });
}

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('build-favicons', function(done) {
    buildFavicons();
});


// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('favicon-check-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    realFavicon.checkForUpdates(currentVersion, function(err) {
        if (err) {
            buildFavicons();
        }
    });
});






/**
 *  Создаются задачи js:* для генерации js-файлов
 */
function jsCallBackDev(name, files) {
    return function() {
        return gulp.src(files)
            .pipe(concat(name + '.js'))
            .pipe(gulp.dest(config.path.dst.js));
    };
}
function jsCallBackProduction(name, files) {
    return function() {
        return pump([
                gulp.src(files),
                concat(name + '.min.js'),
                minifier({compress: {drop_console: true}}, uglifyjs),
                gulp.dest(config.path.dst.js)
            ]
        );
    };
}
var jsCallBackDevStorage = [];
var jsCallBackProductionStorage = [];
for (var name in config.jsFiles) {
    var files = config.jsFiles[name];
    jsCallBackDevStorage.push('js-dev:' + name);
    jsCallBackProductionStorage.push('js-production:' + name);
    gulp.task('js-dev:' + name, jsCallBackDev(name, files));
    gulp.task('js-production:' + name, jsCallBackProduction(name, files));
}

gulp.task('js-dev', jsCallBackDevStorage);
gulp.task('js-production', jsCallBackProductionStorage);





function isPathInFiles(path, files) {
    if (!(files instanceof Array)) {
        files = [files];
    }
    var found = false;
    files.forEach(function(file) {
        path = path.split('\\').join('/');
        var pos = path.indexOf(file);
        if (pos > 0 && pos + file.length == path.length) {
            found = true;
        }
    });
    return found;
}


/**
 * Watch
 *
 */
gulp.task('watch', function() {

    for (var name in config.jsFiles) {
        gulp.watch(config.jsFiles[name], ['js-dev:' + name]);
    }

    // пройти в цикле по измененным файлам
    gulp.watch(config.path.src.scss + '**/*.scss', function(file) {
        if (file.type == 'deleted') {
            console.log('Removed ' + file.path);
            console.log('Файл в ' + config.path.dst.css + ' не удален');
        } else {
            console.log('Changed ' + file.path);
            var isFound = false;
            for (var name in config.cssFiles) {
                var cssFiles = config.cssFiles[name];
                if (isPathInFiles(file.path, cssFiles)) {
                    gulp.start('css-dev:'+name);
                    isFound = true;
                }
            }
            if (!isFound) {
                gulp.start('css-dev');
            }
        }
    });

    gulp.watch(config.path.src.img + '**/*.*', function(file) {
        if (file.type == 'deleted') {
            console.log('Removed ' + file.path);
            console.log('Файл в ' + config.path.dst.img + ' не удален');
//            console.log('Removing ' + path.dst.img + file.base);
//                fs.unlinkSync(path.dst.img + file.base);
        } else {
            console.log('Changed ' + file.path);
            buildImages(file.path);
        }
    });

    gulp.watch(config.path.views.layout, ['copy:layout', 'cache-busting']);

});



gulp.task('default', ['build-dev', 'watch']);