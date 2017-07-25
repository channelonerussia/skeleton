module.exports.url = '{{siteURL}}';
module.exports.name = '{{siteName}}';
module.exports.color = '#fff';
module.exports.description = '{{siteName}}';

var dstCSSPath = 'css/',
    dstJSPath = 'js/',
    dstFontsPath = 'fonts/',
    dstImgPath = 'images/',
    dstIconsPath = 'images/icons/';

var path = {
    web: {
        icons: '/' + dstIconsPath,
        js: '/' + dstJSPath,
        css: '/' + dstCSSPath,
        img: '/' + dstImgPath,
        fonts: '/' + dstFontsPath
    },
    src: {
        js: 'src/js/',
        scss: 'src/scss/',
        img: 'src/images/'
    },
    dst: {
        www: 'www/',
        js: 'www/' + dstJSPath,
        css: 'www/' + dstCSSPath,
        img: 'www/' + dstImgPath,
        icons: 'www/' + dstIconsPath,
        fonts: 'www/' + dstFontsPath
    },
    views: {
        layout: 'src/views/layout/layout.orig.twig',
        icons: 'src/views/layout/icons.html'
    }
};

path.views.layoutOut = path.views.layout.replace('.orig', '');

module.exports.logo = path.src.img + 'logo.png';

module.exports.path = path;




module.exports.cssFiles = {

    'css': path.src.scss + 'css.scss'

};





module.exports.jsFiles = {
    'js': [ // js.js и js.min.js
        'node_modules/jquery/dist/jquery.min.js',
        path.src.js + 'common.js'
    ]

//    'example' :  path.src.js + 'example.js',

};



module.exports.copyPaths = {
/*    'video': {
        from: './video/!**!/!*',
        to: path.dst.www + 'video'
    },*/

    'layout' : {
        from: path.views.layout,
        to: path.views.layoutOut
    }
};




var cacheBustingConfig = {};
cacheBustingConfig[path.views.layoutOut] = [
    dstCSSPath + 'css.min.css',
    dstJSPath + 'js.min.js'
];

module.exports.cacheBustingConfig = cacheBustingConfig;

