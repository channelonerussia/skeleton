<?php

namespace pkvs\scripts;

use Composer\Script\Event;

class Skeleton
{

    const GIT_PATH = './.git';

    const PATH = './skeleton';
    const TEMP = './skeleton.temp';

    const CONFIG = '/config/base.php';

    const DIR_CHMOD = 0775;
    const FILE_CHMOD = 0664;

    private static function copyWithReplace($src, $dst, $replaces)
    {
        $dir = opendir($src);
        @mkdir($dst);
        @chmod($dst, self::DIR_CHMOD);
        while (false !== ($file = readdir($dir))) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    self::copyWithReplace($src . '/' . $file, $dst . '/' . $file, $replaces);
                } else {
                    // copy($src . '/' . $file, $dst . '/' . $file);
                    file_put_contents(
                        $dst . '/' . $file,
                        strtr(
                            file_get_contents($src . '/' . $file),
                            $replaces
                        )
                    );
                    @chmod($dst . '/' . $file, self::FILE_CHMOD);
                }
            }
        }
        closedir($dir);
    }


    public static function makeTemp(Event $event)
    {
        // $event->getName(); // имя события
        // $event->getComposer()->getPackage()->getName() // имя пакета
        $replaces = self::getReplaces();
        self::copyWithReplace(self::PATH, self::TEMP, $replaces);
/*        file_put_contents(
            'config/base.php',
            strtr(
                file_get_contents(__DIR__ . '/config/base.php'),
                $replaces
            )
        );*/
    }

    public static function makeConfig(Event $event)
    {
        $replaces = self::getReplaces();
        self::copyWithReplace(self::PATH . self::CONFIG, self::CONFIG, $replaces);
    }

    private static function getReplaces()
    {
        $replaces = [
            '{{debug}}' => true,

            '{{dbhost}}' => 'localhost',
            '{{dbname}}' => 'new',
            '{{dbcharset}}' => 'cp1251',
            '{{dbuser}}' => 'root',
            '{{dbpass}}' => '',

            '{{siteName}}' => 'pkvstest',
            '{{siteCode}}' => 'pkvstest',

            '{{locale}}' => 'ru_RU.UTF-8',
            '{{codepage}}' => 'UTF-8',
        ];
        /*
                $event->getIO()->write('Installing new project "'.$event->getComposer()->getPackage()->getName().'"...' . "\n");
                $event->getIO()->write("Basic configuration.\n");

                $event->getIO()->write("Dev? (true) y/n: ");
                $replaces['{{debug}}'] = self::askBoolean(true, ['y' => true, 'n' => false]);

                $event->getIO()->write("Database host (localhost): ");
                $replaces['{{dbhost}}'] = self::askText('localhost');

                $event->getIO()->write("Database name (new): ");
                $replaces['{{dbname}}'] = self::askText('new');

                $event->getIO()->write("Database charset (cp1251): ");
                $replaces['{{dbcharset}}'] = self::askText('cp1251');

                $event->getIO()->write("Database user (root): ");
                $replaces['{{dbuser}}'] = self::askText('root');

                $event->getIO()->write("Database password (): ");
                $replaces['{{dbpass}}'] = self::askText('');


                $event->getIO()->write("Site name, human readable text (): ");
                $replaces['{{siteName}}'] = self::askText('');

                $event->getIO()->write("Site code, unique alphanumeric code (): ");
                $replaces['{{siteCode}}'] = self::askText('');

                $event->getIO()->write("System locale (ru_RU.UTF-8): ");
                $replaces['{{locale}}'] = self::askText('ru_RU.UTF-8');

                $event->getIO()->write("Site codepage (UTF-8): ");
                $replaces['{{codepage}}'] = self::askText('UTF-8');*/
        return $replaces;
    }


    private static function askBoolean($default, $answers)
    {
        $stdin = fopen('php://stdin', 'r');
        $response = trim(fgets($stdin));
        return isset($answers[$response]) ? $answers[$response] : $default;
    }

    private static function askText($default)
    {
        $stdin = fopen('php://stdin', 'r');
        $response = trim(fgets($stdin));
        return strlen($response) == 0 ? $default : $response;
    }


    public static function move()
    {
        $projectPath = realpath(self::PATH . '/..');
        rename(self::TEMP, $projectPath);
    }


    public static function clean()
    {
        unlink(self::GIT_PATH);
        unlink(self::TEMP);
        unlink(self::PATH);
    }


}