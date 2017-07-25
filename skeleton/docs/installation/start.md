# Установка

## Требования к установленному ПО

 * [PHP >= 5.4](http://www.php.net/)
 * [Composer](https://getcomposer.org/download/)
 * [Ruby](http://rubyinstaller.org/)
 * [Node.js](https://nodejs.org/en/download/)
 * [SASS](http://sass-lang.com/)
 * [Gulp](http://gulpjs.com/)

Для доступа Composer к [git.1tv.com](https://git.1tv.com/), настройте ключи SSH по [инструкции](https://git.1tv.com/help/ssh/README).

Установка JS и CSS зависимостей:

```
npm install
```

Первый запуск Grunt (сборка css, js, favicons, шрифтов и картинок проекта):

```
gulp build-init 
```

Установка PHP зависимостей:

```
composer install
```


## Настройка

Скопировать config/base.php.dist в config/base.php и настроить параметры доступа к БД.

 
## Запуск проект после установки или обновления

```
php www/index.php -r init
```
