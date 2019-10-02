const gulp = require('gulp');
const del = require('del');
const minHTML = require('gulp-htmlmin');
const minifyCSS = require('gulp-csso');
const concat = require('gulp-concat');
const strip = require('gulp-strip-comments');
const htmlReplace = require('gulp-html-replace');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const imagemin = require('gulp-imagemin');
const gulpSequence = require('gulp-sequence');
const babel = require('gulp-babel');
const zip = require('gulp-zip');

const destinationFolder= releaseFolder();
var fldr; // moved outside to be able to use it in zip function (191002 - Marcela)
function releaseFolder() {
    var arr = __dirname.split("/");
    fldr = arr.pop();
    arr.push(fldr + "_release");
    return arr.join("/");
}

console.log(">> Building to " , destinationFolder);


const cssTasks=[
    {name:"widgetCSS",src:"widget/**/*.css",dest:"/widget"}
    ,{name:"controlAssetsCSS",src:"control/assets/**/*.css",dest:"/control/assets"}
    ,{name:"controlContentCSS",src:"control/content/**/*.css",dest:"/control/content"}
    ,{name:"controlDesignCSS",src:"control/design/**/*.css",dest:"/control/design"}
    ,{name:"controlSettingsCSS",src:"control/settings/**/*.css",dest:"/control/settings"}
];

cssTasks.forEach(function(task){
    /*
     Define a task called 'css' the recursively loops through
     the widget and control folders, processes each CSS file and puts
     a processes copy in the 'build' folder
     note if the order matters you can import each css separately in the array

     */
    gulp.task(task.name, function(){
        return gulp.src(task.src,{base: '.'})

        /// minify the CSS contents
            .pipe(minifyCSS())

            ///merge
            .pipe(concat('styles.min.css'))

            /// write result to the 'build' folder
            .pipe(gulp.dest(destinationFolder + task.dest))
    });
});

const jsTasks=[
    {name:"widgetJS",src:"widget/**/*.js",dest:"/widget"}
    ,{name:"controlContentJS",src:"control/content/**/*.js",dest:"/control/content"}
    ,{name:"controlDesignJS",src:"control/design/**/*.js",dest:"/control/design"}
    ,{name:"controlSettingsJS",src:"control/settings/**/*.js",dest:"/control/settings"}
];



jsTasks.forEach(function(task){
    gulp.task(task.name, function() {

        return gulp.src(task.src,{base: '.'})
            .pipe(babel({
                presets: ['es2015']
            }))
             /// obfuscate and minify the JS files
            .pipe(uglify())

            /// merge all the JS files together. If the
            /// order matters you can pass each file to the function
            /// in an array in the order you like
            .pipe(concat('scripts.min.js'))

            ///output here
            .pipe(gulp.dest(destinationFolder + task.dest));

    });

});

gulp.task('clean',function(){
    return del([destinationFolder],{force: true});
});

/*
 Define a task called 'html' the recursively loops through
 the widget and control folders, processes each html file and puts
 a processes copy in the 'build' folder
 */
gulp.task('html', function(){
    return gulp.src(['widget/**/*.html','widget/**/*.htm','control/**/*.html','control/**/*.htm'],{base: '.'})
    /// replace all the <!-- build:bundleJSFiles  --> comment bodies
    /// with scripts.min.js with cache buster
        .pipe(htmlReplace({
            bundleJSFiles:"scripts.min.js?v=" + (new Date().getTime())
            ,bundleCSSFiles:"styles.min.css?v=" + (new Date().getTime())
        }))

        /// then strip the html from any comments
        .pipe(minHTML({removeComments:true,collapseWhitespace:true}))

        /// write results to the 'build' folder
        .pipe(gulp.dest(destinationFolder));
});

gulp.task('resources', function(){
    return gulp.src(['resources/*','plugin.json'],{base: '.'})
        .pipe(gulp.dest(destinationFolder ));
});


gulp.task('images', function(){
    return gulp.src(['**/*.png'],{base: '.'})
        .pipe(imagemin())
        .pipe(gulp.dest(destinationFolder ));
});

gulp.task('fonts', function(){
    return gulp.src(['widget/css/fonts/**/*.{ttf,woff,eot,svg}'],{base: '.'})
        .pipe(gulp.dest(destinationFolder));
});

gulp.task('icons', function(){
    return gulp.src(['widget/css/fonts/**/*.{ttf,woff,eot,svg}'])
        .pipe(gulp.dest(destinationFolder + '/widget/fonts'));
});

// added task to be able to zip by running gulp zipit (191001 - Marcela)
gulp.task('zip', function () {
    return gulp.src(destinationFolder + '/**/*')
        .pipe(zip(fldr + 'release.zip'))
        .pipe(gulp.dest('..'));
});

var buildTasksToRun=['html','resources','images','fonts','icons'];

cssTasks.forEach(function(task){  buildTasksToRun.push(task.name)});
jsTasks.forEach(function(task){  buildTasksToRun.push(task.name)});

gulp.task('build', gulpSequence('clean',buildTasksToRun) );
gulp.task('zipit', gulpSequence('zip'));// run by 'gulp zipit' (191001 - Marcela)