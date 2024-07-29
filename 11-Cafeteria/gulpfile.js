const { src, dest, watch, series, parallel} = require('gulp');

// CSS Y SASS
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer')
const sourcemaps = require('gulp-sourcemaps');
const cssnano = require('cssnano');

//Imagenes
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const avif = require('gulp-avif');




function css(done){
    //compila sass
    // pasos: 1- identificar archivo, 2- compilarlo, 3- guardar el .css

    src('src/scss/app.scss')
        .pipe( sourcemaps.init() )
        .pipe( sass())
        .pipe( postcss( [autoprefixer(), cssnano()] ))
        .pipe( sourcemaps.write('.'))
        .pipe( dest('build/css'))
    
    done();  
}

function imagenes(){
    return src ('src/img/**/*')
        .pipe(imagemin({ optimizationLevel: 3 }))
        .pipe(dest('build/img'))

}

function versionWebp(){
    const opciones = {
        quality: 50
    }

    return src ('src/img/**/*.{png,jpg}')
        .pipe(webp(opciones))
        .pipe(dest('build/img'))
}

function versionAvif(){
    const opciones = {
        quality: 50
    }

    return src ('src/img/**/*.{png,jpg}')
        .pipe( avif(opciones) )
        .pipe( dest('build/img') )
}

function dev(){

    watch('src/scss/**/*.scss', css);
    watch('src/img/**/*', imagenes);

}


exports.css = css;
exports.dev = dev;
exports.imagenes = imagenes;
exports.versionWebp = versionWebp;
exports.versionAvif = versionAvif;
exports.default = series(css, dev);

// series - Se inicia una tarea después de que la anterior haya terminado
// parallel - Se inician tareas al mismo tiempo