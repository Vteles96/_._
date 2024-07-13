const { src, dest, watch, series, parallel} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer')

function css(done){
    //compila sass
    // pasos: 1- identificar archivo, 2- compilarlo, 3- guardar el .css

    src('src/scss/app.scss')
        .pipe( sass())
        .pipe( postcss( [autoprefixer()] ))
        .pipe( dest('build/css'))
    
    done();  
}

function dev(){

    watch('src/scss/**/*.scss', css);


}

function tareaDefault(){
    console.log('compilando...');
}

exports.css = css;
exports.dev = dev;
exports.default = series(css, dev);

// series - Se inicia una tarea después de que la anterior haya terminado
// parallel - Se inician tareas al mismo tiempo