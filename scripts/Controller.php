<?php

namespace pkvs\scripts;

use Composer\Script\Event;

class Controller
{
    public static function make(Event $event)
    {
        // $event->getName(); // имя события
        // $event->getComposer->getPackage()->getName() // имя пакета

        // $event->getArguments()

        $config = include "config/base.php";

        $replaces = [];
        foreach ($config as $key => $value) {
            $replaces['{{ ' . $key . ' }}'] = $value;
            $replaces['{{' . $key . '}}'] = $value;
        }

        file_put_contents(
            'src/controllers/helloController.php',
            strtr(
                file_get_contents(__DIR__ . '/controllers/Controller.php'),
                $replaces
            )
        );

    }



}