var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var es = require('event-stream');
var gutil = require("gulp-util");
var order = require("gulp-order");
var cleanCSS = require('gulp-clean-css');
var replace = require('gulp-replace-task');

try {
    var config = require('./local.config.json');
} catch (e) {
    var config = require('./config.json');
}

gulp.task('default', ['dist','watch']);

gulp.task('dist', ['minify-css','minify-js','html']);

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.js','./src/**/*.css','./src/**/*.html'], ['dist']);
});

gulp.task('lint', function(done) {
    var failed = false;
    var failWatcher = es.map(function (file, cb) {
        //if (!file.jshint.success) return cb(new Error("JSHint failed"), file);
        if (!file.jshint.success) return cb(new gutil.PluginError({
            plugin: 'lint',
            message: "Ops! Veja os erros acima!"
        }), file);
        cb(null, file);
    });

    return gulp.src(['./src/**/*.js','!./src/**/*.min.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(failWatcher);
});

gulp.task('minify-css', function() {
    return gulp.src('./src/**/*.css')
        .pipe(concat('./dist'))
        .pipe(rename('app.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minify-js', ['lint'], function() {
    return gulp.src(['./node_modules/jinq/jinqjs.min.js', './src/**/*.js'])
        .pipe(order(['jinqjs.min.js','locations.js','map.js']))
        .pipe(concat('./dist'))
        .pipe(rename('app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('html', function() {
    return gulp.src(['./src/**/*.html'])
        .pipe(replace({
            patterns: [
                {
                    match: /YOUR_API_KEY/g,
                    replacement: config.Google.Maps.API.YOUR_API_KEY
                }
            ]
        }))
        .pipe(gulp.dest('./dist'));
});

