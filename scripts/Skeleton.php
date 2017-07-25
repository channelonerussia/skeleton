<?php

namespace pkvs\scripts;

use Composer\Script\Event;

class Skeleton
{

    const GIT_PATH = './.git';

    const PATH = './skeleton';
    const TEMP = './skeleton.temp';
    const VENDOR = './vendor';

    const CONFIG = '/config/base.php';
    const CONFIG_DIST = '/config/base.php.dist';

    const DIR_CHMOD = 0775;
    const FILE_CHMOD = 0664;


    public static function makeTemp(Event $event)
    {
        // $event->getName(); // имя события
        // $event->getComposer()->getPackage()->getName() // имя пакета
        self::cleanTemp();
        @mkdir(self::PATH);
        @chmod(self::PATH, self::DIR_CHMOD);
        $replaces = self::getReplaces($event);
        self::copyWithReplace(self::PATH, self::TEMP, $replaces);
        copy(self::TEMP . self::CONFIG_DIST, self::TEMP . self::CONFIG);
    }


    public static function makeConfig(Event $event)
    {
        $replaces = self::getReplaces($event);
        self::copyWithReplace(self::PATH . self::CONFIG_DIST, self::CONFIG_DIST, $replaces);
    }

    public static function cleanAll()
    {
        self::cleanTemp();
        self::cleanPath();
        self::cleanGit();
//        self::removeDirectory(self::VENDOR);
    }


    public static function showMessage(Event $event)
    {
        $event->getIO()->write("\n\nDone.\n");
        $event->getIO()->write("Next steps:
 * Add dev domain to c:\\Windows\\System32\\drivers\\etc\\ or /etc/hosts
 * Add VirtualHost to Apache configuration or server to Nginx
 * Create new project at git.1tv.com
 * Initialize Git in project directory (follow the instructions from previous step, see \"Existing folder\")
 * Verify config/base.php, gulpconfig.js, package.json, composer.json
 * Change src/images/logo.png
 Run:
 $ composer install
 $ npm install
 $ gulp build-init
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
            '{{cacheNamespace}}' => 'pkvstest',

            '{{locale}}' => 'ru_RU.UTF-8',
            '{{codepage}}' => 'UTF-8',
        ];

        $event->getIO()->write('Installing new project "'.$event->getComposer()->getPackage()->getName().'"...' . "\n");
        $event->getIO()->write("Basic configuration.\n");

        $replaces['{{debug}}'] = $event->getIO()->askConfirmation("Debug? [Y/n]: ", $replaces['{{debug}}']);
//        $replaces['{{debug}}'] = self::askBoolean(true, ['y' => true, 'n' => false]);

        $replaces['{{dbhost}}'] = $event->getIO()->ask('Database host [localhost]: ', 'localhost');

        $replaces['{{dbname}}'] = $event->getIO()->ask("Database name [new]: ", 'new');

        $replaces['{{dbcharset}}'] = $event->getIO()->ask("Database charset [cp1251]: ", 'cp1251');

        $replaces['{{dbuser}}'] = $event->getIO()->ask("Database user [root]: ", 'root');

        $replaces['{{dbpass}}'] = $event->getIO()->ask("Database password []: ", '');

        $code = basename(getcwd());
        $replaces['{{siteName}}'] = $event->getIO()->ask("Site name, human readable text [".$code." tv channel]: ", $code." tv channel");

        $replaces['{{siteCode}}'] = $event->getIO()->ask("Site code, unique alphanumeric code [".$code."]: ", $code);

        $code = $replaces['{{siteCode}}'];
        $url = "http://www.".$code.".tv";
        $replaces['{{siteURL}}'] = $event->getIO()->ask("Site URL [".$url."]: ", $url);

        $cacheNamespace = preg_replace('/[^a-z0-9]/', '', strtolower($code));
        $replaces['{{cacheNamespace}}'] = $event->getIO()->ask("PSR-16 cache namespace, [a-z0-9]+ [".$cacheNamespace."]: ", $cacheNamespace);

        $replaces['{{locale}}'] = $event->getIO()->ask("System locale [ru_RU.UTF-8]: ", 'ru_RU.UTF-8');

        $replaces['{{codepage}}'] = $event->getIO()->ask("Site codepage [UTF-8]: ", 'UTF-8');

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

        $dest = realpath(__DIR__ . '/..');

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(self::TEMP, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($files as $file) {
            if ($file->isDir()){
                $dirName = $dest . DIRECTORY_SEPARATOR . $files->getSubPathName();
                $event->getIO()->write("Directory: " . $dirName);
                @mkdir($dirName, self::DIR_CHMOD);
            } else {
                $fileName = $dest . DIRECTORY_SEPARATOR . $files->getSubPathName();
                $event->getIO()->write('  File: ' . $file->getRealPath() . ' -> ' .$fileName);
                @copy($file, $fileName);
                @chmod($fileName, self::FILE_CHMOD);
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
        if (is_dir($dir)) {
            $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
            $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::CHILD_FIRST);
            foreach ($files as $file) {
                if ($file->isDir()) {
                    rmdir($file->getRealPath());
                } else {
                    unlink($file->getRealPath());
                }
            }
            rmdir($dir);
        } elseif (file_exists($dir)) {
            unlink($dir);
        }
    }

}