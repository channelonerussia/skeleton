# Установка

## Требования к установленному ПО

 * [PHP >= 5.4](http://www.php.net/)
 * [Composer](https://getcomposer.org/download/)
 * [Node.js](https://nodejs.org/en/download/)
 * [Ruby](http://rubyinstaller.org/)
 * [SASS](http://sass-lang.com/)
 * [Gulp](http://gulpjs.com/)

Для доступа Composer к [git.1tv.com](https://git.1tv.com/), настройте ключи SSH по [инструкции](https://git.1tv.com/help/ssh/README).


## Настройка

Скопировать config/base.php.dist в config/base.php и настроить параметры доступа к БД.

Проверить настройки в composer.json, package.json, gulpconfig.js и fontello-config.json.

Если нужен расширенный набор иконок Fontello, зайти на [fontello.com](http://fontello.com/), 
выбрать нужные иконки и в выпадающем меню "Download webfont" выбрать "Get config only".


## Первый запуск

Установка JS и CSS зависимостей:

```
npm install
```

Первый запуск Gulp (сборка css, js, favicons, шрифтов и картинок проекта):

```
gulp init 
```

Установка PHP зависимостей:

```
composer update
```



 
