# Поиск Sphinx

## Установка

### Установить Sphinx в ОС

Ubuntu
```bash
sudo add-apt-repository ppa:builds/sphinxsearch-rel22
sudo apt-get update
sudo apt-get install sphinxsearch
```

RedHat / CentOS
```bash
cd /tmp
sudo wget http://sphinxsearch.com/files/sphinx-2.2.11-1.rhel7.x86_64.rpm
sudo yum install sphinx-2.2.11-1.rhel7.x86_64.rpm
```

Mac OS X
```bash
brew install sphinx
```

[Инструкции для других ОС](http://sphinxsearch.com/docs/current/installation.html).

> **Внимание!** 
> У всех файлов и каталогов, в которых будет работать Sphinx,
> должен быть владелец sphinxsearch или sphinx (в зависимости от ОС). 


### Пример конфигурации для Ubuntu Linux

`/etc/sphinxsearch/sphinx.conf`

> **Внимание!**
> Часовой пояс Mysql должен быть равен Europe/Moscow. 
> Если это не так, новости в индексе поиска могут появится могут 
> появится в неправильное время. 
 

```ini

#######################
# Индекс для Поехали! #
#######################

source pkvs_poehali_all : pkvs {
    sql_query = \
        ( \
            SELECT \
                CRC32(CONCAT("announce:", a.id)) AS id, \
                "announce" AS entity, \
                a.id AS real_id, \
                a.title, \
                a.short_text, \
                a.full_text \
            FROM \
                announces AS a \
            WHERE \
                a.active = 1 AND \
                a._sites LIKE '%poehali%' \
        ) UNION ( \
            SELECT \
                CRC32(CONCAT("news:", n.id)) AS id, \
                "news" AS entity, \
                n.id AS real_id, \
                n.title, \
                n.short_text, \
                n.full_text \
            FROM \
                news AS n \
            WHERE \
                n.`date` <= NOW() AND \
                n.active = 1 AND \
                n.nl_id = 39 \
        ) UNION ( \
            SELECT \
                CRC32(CONCAT("video:", v.id)) AS id, \
                "video" AS entity, \
                v.id AS real_id, \
                CONCAT(v.title, " ", p.title) AS title, \
                v.description AS short_text, \
                p.text AS full_text \
            FROM \
                video AS v \
            INNER JOIN \
                relations AS r \
                ON \
                    v.id = r.relation_id \
            INNER JOIN \
                playlist AS p \
                ON \
                    p.id = r.item_id \
            WHERE \
                r.item_entity_id = 41 AND \
                r.relation_entity_id = 28 AND \
                v.active = 1 AND \
                p.active = 1 AND \
                v._sites LIKE '%poehali%' AND \
                p._sites LIKE '%poehali%' \
            GROUP BY \
                v.id \
        )

    sql_attr_string  = entity
    sql_attr_uint    = real_id

    sql_field_string = title
    sql_field_string = short_text
    sql_field_string = full_text
}

index pkvs_poehali_all {
    source = pkvs_poehali_all
    path = /var/lib/sphinxsearch/pkvs_poehali_all
    morphology = stem_ru, stem_en
    min_word_len = 3
    charset_table = 0..9, A..Z->a..z, a..z, U+410..U+42F->U+430..U+44F, U+430..U+44F, U+401->U+435, U+451->U+435
}

```


Прописать `START=yes` в файл `/etc/default/sphinxsearch` 

После настройки файла конфигурации запустить
```bash
sudo indexer --rotate --all
sudo service sphinxsearch start
```


### Прописать запуск индексатора в crontab
```
*/5 * * * * root indexer --rotate --all > /var/log/sphinx_rotate.log
```