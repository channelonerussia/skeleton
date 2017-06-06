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


    public static function makeTemp(Event $event)
    {
        // $event->getName(); // имя события
        // $event->getComposer()->getPackage()->getName() // имя пакета
        self::cleanTemp();
        $replaces = self::getReplaces($event);
        self::copyWithReplace(self::PATH, self::TEMP, $replaces);
    }


    public static function makeConfig(Event $event)
    {
        $replaces = self::getReplaces($event);
        self::copyWithReplace(self::PATH . self::CONFIG, self::CONFIG, $replaces);
    }


    public static function cleanAll()
    {
        self::cleanTemp();
        self::cleanPath();
        self::cleanGit();
    }


    public static function showMessage(Event $event)
    {
        $event->getIO()->write("\n\nDone.\n");
        $event->getIO()->write("Next steps:
 * Add dev domain to c:\\Windows\\System32\\drivers\\etc\\ or /etc/hosts
 * Add VirtualHost to Apache configuration or server to Nginx
 * Create new project at git.1tv.com
 * Initialize Git in project directory (follow the instructions from previous step, see \"Existing folder\")
 * composer install
 * npm install
 * gulp build-init
");
    }


    private static function getReplaces(Event $event)
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
        $replaces['{{codepage}}'] = self::askText('UTF-8');

        $extendedReplaces = $replaces;
        foreach ($replaces as $name => $value) {
            $extendedReplaces[strtr($name, ['{{' => '{{ ', '}}' => ' }}'])] = $value;
        }
        return $extendedReplaces;
    }

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


    public static function moveTemp(Event $event)
    {

        $currentDir = __DIR__ . '/..';

        $basePath = realpath($currentDir);

        $it = new \RecursiveDirectoryIterator(self::TEMP, \RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::SELF_FIRST);
        foreach ($files as $file) {
            if ($file->isDir()){
                $currentDir = str_replace(realpath(self::TEMP), $basePath, $file->getRealPath());
                $event->getIO()->write("Directory: " . $currentDir);
                @mkdir($currentDir, self::DIR_CHMOD);
            } else {
                $filePath = str_replace(realpath(self::TEMP), $basePath, $file->getRealPath());
                $event->getIO()->write('  File: ' . $file->getRealPath() . ' -> ' . $filePath);
                @copy($file->getRealPath(), $currentDir . '/' . $file->getFilename());
                @chmod($currentDir . '/' . $file->getFilename(), self::FILE_CHMOD);
            }
        }

    }

    public static function cleanTemp()
    {
        self::removeDirectory(self::TEMP);
    }

    public static function cleanPath()
    {
        self::removeDirectory(self::PATH);
    }

    public static function cleanGit()
    {
        self::removeDirectory(self::GIT_PATH);
    }


    private static function removeDirectory($dir)
    {
        $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $file) {
            if ($file->isDir()){
                rmdir($file->getRealPath());
            } else {
                unlink($file->getRealPath());
            }
        }
        rmdir($dir);
    }

}