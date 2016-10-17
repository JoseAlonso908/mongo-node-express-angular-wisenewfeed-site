var gulp = require('gulp'),
	livereload = require('gulp-livereload'),
	compass = require('gulp-compass'),
	watch = require('gulp-watch')

gulp.task('compass', () => {
	gulp.src('./assets/sass/*.scss')
	.pipe(compass({
		config_file: './assets/config.rb',
		css: './assets/stylesheets',
		sass: './assets/sass',
	}))
	.on('error', onError)
	.pipe(gulp.dest('./assets/stylesheets'))
	.pipe(livereload())
})

gulp.task('watch', () => {
	livereload.listen()
	gulp.watch('./assets/sass/*.scss', () => {
		gulp.run('compass')
	})
})

gulp.task('default', ['watch'], () => {
	gulp.start('compass')
})

function onError(err) {
	console.log(err);
	this.emit('end');
}