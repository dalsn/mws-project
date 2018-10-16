const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const browserSync = require("browser-sync").create();

gulp.task("default", ["styles", "copy-html", "copy-images", "scripts"], function() {
	gulp.watch("sass/**/*.scss", ["styles"]);
	gulp.watch("js/**/*.js", ["scripts"]);
	gulp.watch("./dist/*.html")
		.on("change", browserSync.reload);

	browserSync.init({
		server: "./dist"
	});
});

gulp.task("dist", [
	"styles",
	"copy-html",
	"copy-images",
	"scripts-dist"
]);

gulp.task("styles", function() {
	gulp.src(["sass/**/*.scss"])
		.pipe(sass({outputStyle: 'compressed'}))
		.pipe(sass().on("error", sass.logError))
		.pipe(gulp.dest("dist/css"))
		.pipe(browserSync.stream());
});

gulp.task("scripts-dist", function() {
	gulp.src(["js/**/*.js"])
		.pipe(babel())
		.pipe(concat("mws.js"))
		.pipe(uglify())
		.pipe(gulp.dest("dist/js"));
});

gulp.task("scripts", function() {
	gulp.src(["js/**/*.js"])
		.pipe(babel())
		.pipe(concat("mws.js"))
		.pipe(gulp.dest("dist/js"));
});

gulp.task("copy-html", function() {
	gulp.src("./*.html")
		.pipe(gulp.dest("./dist"));
});

gulp.task("copy-images", function() {
	gulp.src("img/*")
		.pipe(gulp.dest("dist/img"));
});