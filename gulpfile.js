var gulp = require('gulp'),
	compass = require('gulp-compass'),
	watch = require('gulp-watch'),
	uglify = require('gulp-uglifyjs'),
	browserify = require('gulp-browserify'),
	ngAnnotate = require('gulp-ng-annotate'),
	plumber = require('gulp-plumber')
	gulpUtil = require('gulp-util')

gulp.task('compass', () => {
	gulp.src('./assets/sass/*.scss')
	.pipe(compass({
		config_file: './compass-config.rb',
		css: './assets/stylesheets',
		sass: './sass',
	}))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/css'))
})

gulp.task('browserify', () => {
	gulp.src('./js/app.js')
	.pipe(browserify({
		insertGlobals: true,
		debug: true,
	}))
	.pipe(ngAnnotate())
	.pipe(uglify('angular.js', {
		// outSourceMap: true,
		mangle: true
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('js', () => {
	gulp.src(['./js/*.js', '!./js/app.js'])
	.pipe(ngAnnotate())
	.pipe(uglify('app.js', {
		// outSourceMap: true,
		mangle: true
	}).on('error', gulpUtil.log))
	.pipe(plumber())
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('watch', () => {
	gulp.watch('./sass/*.scss', () => {
		gulp.run('compass')
	})

	gulp.watch('./js/app.js', () => {
		gulp.run('browserify')
	})

	gulp.watch(['./js/*.js', '!./js/app.js'], () => {
		gulp.run('js')
	})
})

gulp.task('default', ['watch'], () => {
	gulp.start(['compass', 'browserify', 'js'])
})