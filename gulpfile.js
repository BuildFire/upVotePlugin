const gulp = require('gulp');
const del = require('del');
const minHTML = require('gulp-htmlmin');
const minifyCSS = require('gulp-csso');
const concat = require('gulp-concat');
const htmlReplace = require('gulp-html-replace');
const minify = require('gulp-minify');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');

const version = new Date().getTime();
const destinationFolder = releaseFolder();

function releaseFolder() {
  const arr = __dirname.split('/');
  const fldr = arr.pop();
  arr.push(`${fldr}_release`);
  return arr.join('/');
}


const cssTasks = [
  { name: 'controlContentCSS', src: 'control/content/**/*.css', dest: '/control/content' },
  { name: 'controlAssetsCSS', src: 'control/assets/**/*.css', dest: '/control/assets' },
  { name: 'controlSettingsCSS', src: 'control/settings/**/*.css', dest: '/control/settings' },
  { name: 'widgetCSS', src: ['widget/**/*.css', '!widget/layouts/*.css'], dest: '/widget' },
];

cssTasks.forEach((task) => {
  /*
     Define a task called 'css' the recursively loops through
     the widget and control folders, processes each CSS file and puts
     a processes copy in the 'build' folder
     note if the order matters you can import each css separately in the array
    
     */
  gulp.task(task.name, () => gulp.src(task.src, { base: '.' })

    /// minify the CSS contents
    .pipe(minifyCSS())

    /// merge
    .pipe(concat('styles.min.css'))

    /// write result to the 'build' folder
    .pipe(gulp.dest(destinationFolder + task.dest)));
});

gulp.task('sharedJS', () => gulp.src(['widget/global/**/*.js'], { base: '.' })
  .pipe(concat('scripts.shared.js'))
  .pipe(babel({
    presets: ['@babel/env'],
    plugins: ['@babel/plugin-proposal-class-properties'],
  }))
  .pipe(minify())
  .pipe(gulp.dest(`${destinationFolder}/widget/global`)));

const jsTasks = [
  { name: 'widgetJS', src: ['widget/js/*.js', 'widget/js/**/*.js', 'widget/pages/**/*.js'], dest: '/widget' },
  { name: 'controlContentJS', src: ['control/content/**/*.js'], dest: '/control/content' },
  { name: 'controlSettingsJS', src: ['control/settings/**/*.js', '!control/settings/js/duration-picker.js'], dest: '/control/settings' },
  { name: 'controlTestsDataJS', src: ['control/tests/**/*.js'], dest: '/control/tests' },
];

jsTasks.forEach((task) => {
  gulp.task(task.name, () => gulp.src(task.src, { base: '.' })
    /// merge all the JS files together. If the
    /// order matters you can pass each file to the function
    /// in an array in the order you like
    .pipe(concat('scripts.js'))
    .pipe(babel({
      presets: ['@babel/env'],
      plugins: ['@babel/plugin-proposal-class-properties'],
    }))
    .pipe(minify())
    /// output here
    .pipe(gulp.dest(destinationFolder + task.dest)));
});

gulp.task('clean', () => del([destinationFolder], { force: true }));

/*
 Define a task called 'html' the recursively loops through
 the widget and control folders, processes each html file and puts
 a processes copy in the 'build' folder
 */
gulp.task('controlHTML', () => gulp.src(['control/**/*.html'], { base: '.' })
  .pipe(htmlReplace({
    bundleSharedJSFiles: `../../widget/global/scripts.shared-min.js?v=${version}`,
    bundleJSFiles: `scripts-min.js?v=${version}`,
    bundleCSSFiles: `styles.min.css?v=${version}`,
    bundleControlAssetsCSSFiles: `../assets/styles.min.css?v=${new Date().getTime()}`,
  }))
  .pipe(minHTML({ removeComments: true, collapseWhitespace: true }))
  .pipe(gulp.dest(destinationFolder)));

gulp.task('widgetHTML', () => gulp.src(['widget/*.html'], { base: '.' })
  .pipe(htmlReplace({
    bundleSharedJSFiles: `global/scripts.shared-min.js?v=${version}`,
    bundleJSFiles: `scripts-min.js?v=${version}`,
    bundleCSSFiles: `styles.min.css?v=${version}`,
  }))
  .pipe(minHTML({ removeComments: true, collapseWhitespace: true }))
  .pipe(gulp.dest(destinationFolder)));

gulp.task('resources', () => gulp.src(['resources/*', 'resources/**', 'plugin.json'], { base: '.' })
  .pipe(gulp.dest(destinationFolder)));

gulp.task('images', () => gulp.src(['**/images/**'], { base: '.' })
  .pipe(imagemin())
  .pipe(gulp.dest(destinationFolder)));

gulp.task('assets', () => gulp.src(['control/assets/**/*']).pipe(gulp.dest(`${destinationFolder}/control/assets`)));

gulp.task('fonts', () => gulp.src('control/orders/css/fonts/**/*.{eot,svg,ttf,woff,woff2}').pipe(gulp.dest(`${destinationFolder}/control/orders/css/fonts`)));

gulp.task('copyCSS', () => gulp.src('widget/layouts/layout1.css', { base: '.' })
  .pipe(gulp.dest(destinationFolder)));

const buildTasksToRun = ['controlHTML', 'widgetHTML', 'resources', 'images', 'sharedJS', 'assets', 'fonts', 'copyCSS'];
cssTasks.forEach((task) => { buildTasksToRun.push(task.name); });
jsTasks.forEach((task) => { buildTasksToRun.push(task.name); });

gulp.task('build', gulp.series('clean', ...buildTasksToRun));
