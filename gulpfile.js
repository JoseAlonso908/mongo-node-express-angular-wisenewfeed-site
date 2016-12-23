var gulp = require('gulp'),
	compass = require('gulp-compass'),
	cleanCSS = require('gulp-clean-css'),
	concat = require('gulp-concat'),
	watch = require('gulp-watch'),
	uglify = require('gulp-uglifyjs'),
	browserify = require('gulp-browserify'),
	ngAnnotate = require('gulp-ng-annotate'),
	plumber = require('gulp-plumber'),
	gulpUtil = require('gulp-util'),
	htmlmin = require('gulp-htmlmin'),
	clean = require('gulp-clean')

gulp.task('css', () => {
	gulp.src('./sass/*.scss')
	.pipe(compass({
		config_file: './compass-config.rb',
		css: './assets/css',
		sass: './sass',
	}).on('error', gulpUtil.log))
	.pipe(gulp.dest('./assets/css'))
})

gulp.task('browserify', () => {
	gulp.src('./js/app.js')
	.pipe(browserify({
		insertGlobals: true,
		debug: true,
	}))
	.pipe(ngAnnotate().on('error', gulpUtil.log))
	.pipe(uglify('angular.js', {
		outSourceMap: true,
		mangle: true
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('js', () => {
	gulp.src(['./js/*.js', '!./js/app.js'])
	.pipe(ngAnnotate().on('error', gulpUtil.log))
	.pipe(uglify('app.js', {
		outSourceMap: true,
		mangle: true
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('html', () => {
	gulp.src(['./views/**/*.htm', './views/**/*.html'])
	.pipe(htmlmin({
		collapseWhitespace: true,
		removeComments: true
	}).on('error', gulpUtil.log))
	.pipe(gulp.dest('./assets/views'))
})

gulp.task('watch', () => {
	gulp.watch('./sass/*.scss', () => {
		gulp.run(['css'])
	})

	gulp.watch('./js/app.js', () => {
		gulp.run('browserify')
	})

	gulp.watch(['./js/*.js', '!./js/app.js'], () => {
		gulp.run('js')
	})

	gulp.watch(['./views/**/*.htm', './views/**/*.html'], () => {
		gulp.run('html')
	})
})

gulp.task('default', ['watch'], () => {
	gulp.start(['css', 'browserify', 'js', 'html'])
})