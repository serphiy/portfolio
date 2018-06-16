/*jshint esversion: 6 */

const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const uglifyes     = require('uglify-es');
const composer     = require('gulp-uglify/composer');
const uglify       = composer(uglifyes, console);
const plumber      = require('gulp-plumber');
const plumberNotif = require('gulp-plumber-notifier');
const concat       = require('gulp-concat');
const browserSync  = require('browser-sync').create();
const pug          = require('gulp-pug');
const sass         = require('gulp-sass');
const rimraf       = require('rimraf');
const rename       = require('gulp-rename');
const imagemin     = require('gulp-imagemin');
const pngquant     = require('imagemin-pngquant');
const buffer       = require('vinyl-buffer');
const cache        = require('gulp-cache');
const spritesmith  = require('gulp.spritesmith');
const sourcemaps   = require('gulp-sourcemaps');

const path = {
    build: {
        html:      'build/',
        css:       'build/css/',
        js:        'build/js/',
        imagesCSS: 'build/css/images/',
        sprite:    'build/css/images/',
        spriteRel: './images/',
        spriteCSS: 'source/style/partial/',
        img:       'build/img/',
        fonts:     'build/fonts/'
    },
    src: {
        template:  'source/template/*.pug',
        style:     'source/style/main.scss',
        js:        ['source/js/**/*.js'],
        imagesCSS: 'source/style/images/**/*.*',
        sprite:    'source/style/icons/**/*.png',
        img:       'source/img/**/*.*',
        fonts:     'source/fonts/**/*.*'
    },
    watch: {
        template:  'source/template/**/*.pug',
        style:     'source/style/**/*.scss',
        js:        'source/js/**/*.js',
        imagesCSS: 'source/style/images/**/*.*',
        sprite:    'source/style/icons/**/*.png',
        img:       'source/img/**/*.*',
        fonts:     'source/fonts/**/*.*'
    },
    clean: './build'
};

/* -------- Server -------- */
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "build"
        }
    });
    gulp.watch('build/**/*').on('change', browserSync.reload);
});

/* ------------- Pug build -------------- */
gulp.task('template:build', function buildHTML() {
    return gulp.src(path.src.template)
        .pipe(plumberNotif())
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest(path.build.html));
});

/* ------------ Style build ------------- */
gulp.task('style:build', function () {
    return gulp.src(path.src.style)
        .pipe(plumberNotif())
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(autoprefixer({
            browsers: ['last 3 versions', '> 5%', 'Firefox ESR'],
            cascade: false,
            add: true
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css));
});

/* --------- JavaScript build ----------- */
gulp.task('js:build', function () {
    return gulp.src(path.src.js, { allowEmpty: true })
        .pipe(plumberNotif())
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(uglify().on('error', function(err) {
            console.error('Error from uglify,', err.toString());
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js));
});

/* ----------- Images build ------------- */
gulp.task('image:build', function() {
    return gulp.src(path.src.img)
        .pipe(cache(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false}
                ]
            })
        ], {
            use: [pngquant({quality: '80-90', speed: 4})]
        })))
        .pipe(gulp.dest(path.build.img));
});

/* ----------- Images in CSS build ------------- */
gulp.task('imagesCSS:build', function() {
    return gulp.src(path.src.imagesCSS)
        .pipe(cache(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false}
                ]
            })
        ], {
            use: [pngquant({quality: '80-90', speed: 4})]
        })))
        .pipe(gulp.dest(path.build.imagesCSS));
});

/* ------------------ Sprite ------------------- */
gulp.task('sprite:build', function(cb) {
    const spriteData = gulp.src(path.src.sprite).pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: path.build.spriteRel + 'sprite.png',
        cssName: '_sprite.scss',
        cssFormat: 'scss',
        cssVarMap: function(sprite) {
                    sprite.name = 'icon-' + sprite.name;
        },
        algorithm: 'binary-tree',
        padding: 2
    }));
    spriteData.img
        .pipe(buffer())
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false}
                ]
            })
        ], {
            use: [pngquant({quality: '80-90', speed: 4})]
        }))
        .pipe(gulp.dest(path.build.sprite));
    spriteData.css
        .pipe(gulp.dest(path.build.spriteCSS));
    cb();
    return spriteData;
});

/* --------------- Delete ---------------- */
gulp.task('clean', function del(cb) {
    return rimraf(path.clean, cb);
});

/* ------------- Copy fonts -------------- */
gulp.task('fonts:copy', function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});


/* -------------- Watchers --------------- */
gulp.task('watch', function() {
    gulp.watch(path.watch.template, gulp.series('template:build'));
    gulp.watch(path.watch.style, gulp.series('style:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.imagesCSS, gulp.series('imagesCSS:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:copy'));
    gulp.watch(path.watch.sprite, gulp.series('sprite:build'));
});

/* --------------- Build ----------------- */
gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
        'template:build',
        'style:build',
        'sprite:build',
        'js:build',
        'image:build',
        'imagesCSS:build',
        'fonts:copy'
    )
));

/* -------------- Default ---------------- */
gulp.task('default', gulp.series(
    'build',
    gulp.parallel('watch', 'server')
));