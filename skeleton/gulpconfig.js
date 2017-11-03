import packageJSON from './package.json';

const config = {
  name: packageJSON.description,
  color: '#fff',
  dstCSSPath: 'css/',
  dstJSPath: 'js/',
  dstFontsPath: 'fonts/',
  dstImgPath: 'images/',
  dstIconsPath: 'images/icons/',
  dstVideo: 'video/',
};

Object.assign(config, packageJSON, config);

config.path = {
  web: {
    icons: `/${config.dstIconsPath}`,
    js: `/${config.dstJSPath}`,
    css: `/${config.dstCSSPath}`,
    img: `/${config.dstImgPath}`,
    fonts: `/${config.dstFontsPath}`,
  },
  src: {
    js: 'src/js/',
    scss: 'src/scss/',
    img: 'src/images/',
    video: 'src/video/',
  },
  dst: {
    www: 'www/',
    js: `www/${config.dstJSPath}`,
    css: `www/${config.dstCSSPath}`,
    img: `www/${config.dstImgPath}`,
    icons: `www/${config.dstIconsPath}`,
    fonts: `www/${config.dstFontsPath}`,
    video: `www/${config.dstVideo}`,
  },
  views: {
    layout: 'src/views/layout/layout.orig.twig',
    icons: 'src/views/layout/icons.html',
  },
};

config.clean = [
  `${config.path.dst.js}/**`,
  `${config.path.dst.css}/**`,
  `${config.path.dst.img}/**`,
  `${config.path.dst.icons}/**`,
  `${config.path.dst.fonts}/**`,
  `${config.path.dst.video}/**`,
  `${config.path.dst.www}/favicon.ico`,
  `${config.path.dst.www}/apple-touch-icon.png`,
];

config.path.views.layoutOut = config.path.views.layout.replace('.orig', '');

config.logo = `${config.path.src.img}logo.png`;

config.cssFiles = {
  css: `${config.path.src.scss}css.scss`,
};

config.jsFiles = {
  app: [
    `${config.path.src.js}app.js`,
  ],
};

config.copyPaths = {
  video: {
    from: `${config.path.src.video}**/*`,
    to: config.path.dst.video,
  },
  layout: {
    from: config.path.views.layout,
    to: config.path.views.layoutOut,
  },
  appletouchicon: {
    from: 'web/images/icons/apple-touch-icon.png',
    to: 'web/apple-touch-icon.png',
  },
  favicon: {
    from: 'web/images/icons/favicon.ico',
    to: 'web/favicon.ico',
  },
};

config.cacheBustingConfig = {};
config.cacheBustingConfig[config.path.views.layoutOut] = [
  `${config.dstCSSPath}css.min.css`,
  `${config.dstJSPath}app.min.js`,
];

export default config;
