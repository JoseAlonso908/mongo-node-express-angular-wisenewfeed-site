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
	clean = require('gulp-clean'),
	runSequence = require('run-sequence'),
	browserSync = require('browser-sync').create()

gulp.task('css', () => {
	gulp.src('./sass/*.scss')
	.pipe(compass({
		config_file: './compass-config.rb',
		css: './assets/css',
		sass: './sass',
	}).on('error', gulpUtil.log))
	.pipe(gulp.dest('./assets/css'))
	.pipe(browserSync.stream())
})

gulp.task('browserify', () => {
	gulp.src('./js/app.js')
	.pipe(browserify({
		insertGlobals: true,
		debug: false,
	}))
	.pipe(ngAnnotate().on('error', gulpUtil.log))
	.pipe(uglify('angular.js', {
		outSourceMap: true,
		mangle: false
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('browserify-watch', ['browserify'], (done) => {
	browserSync.reload()
	done()
})

gulp.task('js', () => {
	gulp.src(['./js/*.js', '!./js/app.js'])
	.pipe(ngAnnotate().on('error', gulpUtil.log))
	.pipe(uglify('app.js', {
		outSourceMap: true,
		mangle: false
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('js-watch', (done) => {
	runSequence('js', 'browserify', () => {
		// browserSync.reload()
		done()
	})
})

gulp.task('html', () => {
	gulp.src(['./views/**/*.htm', './views/**/*.html'])
	.pipe(htmlmin({
		collapseWhitespace: true,
		removeComments: true
	}).on('error', gulpUtil.log))
	.pipe(gulp.dest('./assets/views'))
})

gulp.task('serve', () => {
	// browserSync.init({
	// 	proxy: {
	// 		target: 'http://localhost:8006',
	// 		ws: true,
	// 	}
	// })

	gulp.watch('./sass/*.scss', ['css'])
	gulp.watch('./js/app.js', ['browserify-watch'])
	gulp.watch(['./js/*.js', '!./js/app.js'], ['js-watch'])
	gulp.watch(['./views/**/*.htm', './views/**/*.html'], ['html']).on('change', browserSync.reload)
})

gulp.task('build', () => {
	runSequence('css', 'js', 'html')
})

gulp.task('default', ['serve'], () => {
	gulp.start(['css', 'browserify', 'js', 'html'])
})
