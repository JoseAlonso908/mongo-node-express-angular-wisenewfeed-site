var gulp = require('gulp'),
	compass = require('gulp-compass'),
	watch = require('gulp-watch'),
	uglify = require('gulp-uglifyjs'),
	browserify = require('gulp-browserify'),
	ngAnnotate = require('gulp-ng-annotate')

gulp.task('compass', () => {
	gulp.src('./assets/sass/*.scss')
	.pipe(compass({
		config_file: './compass-config.rb',
		css: './assets/stylesheets',
		sass: './sass',
	}))
	.on('error', onError)
	.pipe(gulp.dest('./assets/css'))
	.pipe(livereload())
})

gulp.task('js', () => {
	gulp.src('./js/*.js')
	// .pipe(browserify({
	// 	insertGlobals: true,
	// 	debug: true,
	// }))
	.pipe(ngAnnotate())
	.pipe(uglify({
		outSourceMap: true,
		mangle: true
	}))
	.on('error', onError)
	.pipe(gulp.dest('./assets/scripts'))
})

gulp.task('watch', () => {
	livereload.listen()
	gulp.watch('./sass/*.scss', () => {
		gulp.run('compass')
	})

	gulp.watch('./js/*.js', () => {
		gulp.run('js')
	})
})

gulp.task('default', ['watch'], () => {
	gulp.start(['compass', 'js'])
})

function onError(err) {
	console.log(err);
	this.emit('end');
}