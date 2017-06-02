Установка
=========

Требования к установленному ПО:

 * [Ruby](http://rubyinstaller.org/)
 * [Node.js](https://nodejs.org/en/download/)
 * [SASS](http://sass-lang.com/)
 * [Composer](https://getcomposer.org/download/)
 * [Gulp](http://gulpjs.com/)

Установка SASS как GEM Ruby:

```
gem install sass
```

Установка Gulp:

```
npm install -g gulp-cli
```

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

> Для того чтобы [Composer](https://getcomposer.org/) мог качать зависимости из наших закрытых репозиториев необходимо
> создать файла с паролями `~/.composer/auth.json`:
>
> ```
> {
>     "http-basic": {
>         "bitbucket.org": {
>             "username": "YOUR_BITBUCKET_USERNAME",
>             "password": "YOUR_BITBUCKET_PASSWORD"
>         }
>     },
>     "github-oauth": {
>         "github.com": "YOUR_GITHUB_TOKEN"
>     }
> }
> ```


Установка Sass, npm, Grunt, Composer на OS X
--------------------------------------------
```
sudo gem install sass
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew install node
sudo npm install -g gulp-cli
```

Настройка
---------

Скопировать config/config.php.dist в config/config.php и настроить параметры доступа к БД.