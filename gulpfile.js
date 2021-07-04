const { src, dest, task, series, watch, parallel }  = require('gulp')
const { DIST_PATH, SRC_PATH, STYLES_LIBS, JS_LIBS } = require('./gulp.config')
const rm            = require('gulp-rm')
const sass          = require('gulp-sass')
const concat        = require('gulp-concat')
const browserSync   = require('browser-sync').create()
const reload        = browserSync.reload
const autoprefixer  = require('gulp-autoprefixer')
const gcmq          = require('gulp-group-css-media-queries')
const cleanCss      = require('gulp-clean-css')
const sourcemaps    = require('gulp-sourcemaps')
const babel         = require('gulp-babel')
const uglify        = require('gulp-uglify')
const svgo          = require('gulp-svgo')
const svgSprite     = require('gulp-svg-sprite')
const gulpIf        = require('gulp-if')
const webp          = require('gulp-webp')
const imagemin      = require('gulp-imagemin')
const env           = process.env.NODE_ENV

sass.compiler = require('node-sass')

task('clean', () => {
    return src([
        `${DIST_PATH}/**/*`, 
        `!${DIST_PATH}/img/**/*`,
        `!${DIST_PATH}/fonts/**/*`,
        `!${DIST_PATH}/webfonts/**/*`,
    ], {read: false})
        .pipe(rm())
})

task('clean:all', () => {
    return src([
        `${DIST_PATH}/**/*`
    ], {read: false})
        .pipe(rm())
})

task('copy:html', () => {
    return src(`${SRC_PATH}/*.html`)
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({stream: true}))
})

task('copy:webfonts', () => {
    return src(`${SRC_PATH}/webfonts/**/*`)
        .pipe(dest(`${DIST_PATH}/webfonts`))
})

task('copy:fonts', () => {
    return src(`${SRC_PATH}/fonts/**/*`)
        .pipe(dest(`${DIST_PATH}/fonts`))
})

task('copy:css', () => {
    return src([...STYLES_LIBS])
        .pipe(dest(`${DIST_PATH}/css`))
})

task('scss', () => {
    return src(`${SRC_PATH}/scss/main.scss`)
        .pipe(gulpIf(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.min.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpIf(env === 'prod', autoprefixer({
            browsers: ['last 2 versions'],
            cascade: true
        })))
        .pipe(gulpIf(env === 'prod', gcmq()))
        .pipe(gulpIf(env === 'prod', cleanCss()))
        .pipe(gulpIf(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}/css`))
        .pipe(reload({stream: true}))
})

task('copy:js', () => {
    return src([...JS_LIBS])
        .pipe(dest(`${DIST_PATH}/js`))
})

task('js', () => {
    return src(`${SRC_PATH}/js/*.js`)
        .pipe(gulpIf(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.min.js', {newLine: ';'}))
        .pipe(gulpIf(env === 'prod', babel({
            presets: ["@babel/env"]
        })))
        .pipe(gulpIf(env === 'prod', uglify()))
        .pipe(gulpIf(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}/js`))
        .pipe(reload({stream: true}))
})

task('img', () => {
    return src(`${SRC_PATH}/img/**/*.{png,jpg,jpeg}`)
        .pipe(imagemin())
        .pipe(dest(`${DIST_PATH}/img`))
})

task('img:webp', () => {
    return src(`${SRC_PATH}/img/**/*.{png,jpg,jpeg}`)
        .pipe(webp())
        .pipe(dest(`${DIST_PATH}/img`))
})

task('img:svg', () => {
    return src(`${SRC_PATH}/img/i/*.svg`)
        .pipe(svgo({
            plugins: [
                {
                    removeAttrs: {
                        attrs: "(fill|stroke|style|width|data.*)"
                    }
                }
            ]
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg"
                }
            }
        }))
        .pipe(dest(`${DIST_PATH}/img/i`))
})

task('server', () => {
    browserSync.init({
        server: {
            baseDir: `./${DIST_PATH}`
        },
        open: false
    })
})

task('watch', () => {
    watch(`./${SRC_PATH}/scss/**/*.scss`, series('scss'))
    watch(`./${SRC_PATH}/js/**/*.js`, series('js'))
    watch(`./${SRC_PATH}/*.html`, series('copy:html'))
})

task('static',
    series(
        'clean:all',
        parallel('img', 'img:webp', 'copy:fonts', 'copy:webfonts')
    )
)

task('default', 
    series(
        'clean', 
        parallel('copy:html', 'copy:css', 'scss', 'copy:js', 'js'), 
        parallel('watch', 'server')
    )
)

task('build', 
    series(
        'clean', 
        parallel(
            'copy:html', 
            'copy:css', 
            'scss', 
            'copy:js', 
            'js', 
            'img', 
            'img:webp', 
            'copy:fonts', 
            'copy:webfonts'
        )
    ) 
)
