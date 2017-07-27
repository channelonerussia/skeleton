# GeoLite2 

Используется база и API Maxmind [GeoLite2 City](http://dev.maxmind.com/geoip/geoip2/geolite2/).


## Загрузка и обновление базы

В корневой папке проекта выполнить следующую команду:

```
$ composer run-script geolite
```



## Как пользоваться

```php
$geoip = $this->lib->geoip2;
$r = $geoip->city('90.151.44.128');
echo $r->city->name . ', ' . $r->country->name . ', ' . $r->continent->name;
```
