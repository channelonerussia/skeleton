# Сборка проекта 

## Что нужно для сборки
 * [NPM](https://www.npmjs.com/get-npm)
 * [Gulp](https://gulpjs.com/) (`npm install -g gulp gulp-cli`)
 * [Babel](https://babeljs.io/), babel-cli (`npm install -g babel-cli`)
 
## Сборка на dev-компьютере 

Запуск сборки и переход в задачу watch:
```bash
gulp
```

Только собрать проект:

```bash
gulp build-dev
```

Если вносились правки в код или добавлялись/изменялись картинки в проекте, 
до запуска gulp'а запустить 
```bash
composer install
npm install
gulp init
```

## Сборка в production

### CI/CD ( ͡° ͜ʖ ͡°)

На dev-компьютере в корне проекта запустить
```bash
npm version <patch | minor | major>
```

Эта команда добавит новый тег в репозиторий, 
запушит в гитлаб и обновит версию в package.json.

> Подробней о [npm version](https://docs.npmjs.com/cli/version)

После пуша нового тега в гитлаб, запустится автодеплой на сервере.

Посмотреть статус деплоя можно в гитлабе https://git.1tv.com/pkvs/poehali.tv/pipelines

### На сервере, через ssh
В корне проекта запустить 
```bash
deploy.sh
```


### Олдскульный способ ¯\\\_(ツ)_/¯

Через проект, установленный в dev-среде 
 * В корне проекта запустить `deploy.sh`.
 * Скопировать на production-сервер папки `src`, `vendor`, 
 `www\css`, `www\js`, `www\images`, `www\fonts`.
 * Удалить содержимое папки `var\cache\twig`.
 * Очистить системный кеш через админку.
 
 
## Полезные команды

 * `gulp build-dev` - собрать проект для dev-среды
 * `gulp build-production` - собрать проект для production
 * `gulp init` - полная сборка проекта, с предварительной очисткой генерирумых папок в www/*
 * `gulp deploy` - сборка production
 * `gulp clean` - очистка генерирумых папок в www/*
 * `gulp glyph` - сгенерировать шрифты
 * `gulp favicons` - сгенерировать favicons
 * `gulp images` - сгенерировать недостающие картинки (сравниваются папки src/images и www/images)
 * `gulp images-force` - принудительно сгенерировать все картинки
