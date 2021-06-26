const { src, dest, task, series, watch, parallel } = require('gulp')
const { DIST_PATH, SRC_PATH, STYLES_LIBS, JS_LIBS } = require('./gulp.config')
const rm = require('gulp-rm')
const sass = require('gulp-sass')
const concat = require('gulp-concat')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
const sassGlob = require('gulp-sass-glob')
const autoprefixer = require('gulp-autoprefixer')
const px2rem = require('gulp-smile-px2rem')
const gcmq = require('gulp-group-css-media-queries')
const cleanCss = require('gulp-clean-css')
const sourcemaps = require('gulp-sourcemaps')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const svgo = require('gulp-svgo')
const svgSprite = require('gulp-svg-sprite')
const gulpIf = require('gulp-if')
const webp = require('gulp-webp')
const imagemin = require('gulp-imagemin')


sass.compiler = require('node-sass')

const env = process.env.NODE_ENV

task('clean', () => {
    return src([
        `${DIST_PATH}/**/*`, 
        `!${DIST_PATH}/img/**/*`,
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

task('copy:fonts', () => {
    return src(`${SRC_PATH}/webfonts/**/*`)
        .pipe(dest(`${DIST_PATH}/webfonts`))
})

task('scss', () => {
    return src([...STYLES_LIBS, `${SRC_PATH}/scss/main.scss`])
        .pipe(gulpIf(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.min.scss'))
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
        // .pipe(px2rem())
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

task('js', () => {
    return src([...JS_LIBS, `${SRC_PATH}/js/*.js`])
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

task('default', 
    series(
        'clean', 
        parallel('copy:html', 'scss', 'js'), 
        parallel('watch', 'server')
    )
)

task('build', 
    series(
        'clean', 
        parallel('copy:html', 'scss', 'js', 'img', 'img:webp', 'copy:fonts')
    ) 
)
