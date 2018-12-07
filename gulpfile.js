const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const imagemin = require("gulp-imagemin");
const imageminPngquant = require('imagemin-pngquant');
const browserSync = require("browser-sync").create();

gulp.task("default", ["styles", "copy-html", "copy-images", "scripts"], function() {
	gulp.watch("sass/**/*.scss", ["styles"]);
	gulp.watch(["js/**/*.js", "./sw.js"], ["scripts"]);
	gulp.watch("*.html", ["copy-html"]);
	gulp.watch("./dist/*.html")
		.on("change", browserSync.reload);

	browserSync.init({
		server: "./dist"
	});
});

gulp.task("dist", [
	"styles",
	"copy-html",
	"images-dist",
	"scripts-dist"
], function() {
	gulp.src("./manifest.json")
		.pipe(gulp.dest("./dist"));
});

gulp.task("styles", function() {
	gulp.src(["sass/**/*.scss"])
		.pipe(sass({outputStyle: 'compressed'}).on("error", sass.logError))
		.pipe(gulp.dest("dist/css"))
		.pipe(browserSync.stream());
});

gulp.task("scripts-dist", function() {
	gulp.src([
		"js/idb.js",
		"js/dbhelper.js"
	])
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve)
		}))
		.pipe(concat("db.js"))
		.pipe(uglify())
		.pipe(gulp.dest("dist/js"));

	gulp.src([
		"js/main.js",
		"js/restaurant_info.js",
		"js/worker.js"
	])
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve)
		}))
		.pipe(uglify())
		.pipe(gulp.dest("dist/js"));

	gulp.src("./sw.js")
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve),
			plugins: ["transform-runtime"]
		}))
		.pipe(gulp.dest("./dist"));
});

gulp.task("scripts", function() {
	gulp.src([
		"js/idb.js",
		"js/dbhelper.js"
	])
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve)
		}))
		.pipe(concat("db.js"))
		.pipe(gulp.dest("dist/js"));

	gulp.src([
		"js/main.js",
		"js/restaurant_info.js",
		"js/worker.js"
	])
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve)
		}))
		.pipe(gulp.dest("dist/js"));

	gulp.src("./sw.js")
		.pipe(babel({
			presets: ['babel-preset-env'].map(require.resolve),
			plugins: ["transform-runtime"]
		}))
		.pipe(gulp.dest("./dist"));
});

gulp.task("copy-html", function() {
	gulp.src("./*.html")
		.pipe(gulp.dest("./dist"));
});

gulp.task("images-dist", function() {
	gulp.src("img/*")
		.pipe(imagemin({
            progressive: true,
            use: [imageminPngquant()]
        }))
		.pipe(gulp.dest("dist/img"));
});

gulp.task("copy-images", function() {
	gulp.src("img/*")
		.pipe(gulp.dest("dist/img"));
});