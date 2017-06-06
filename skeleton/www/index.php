<?php

use pkvs\lib\Core;

$sitePath = realpath(__DIR__ . '/../');

include $sitePath . '/vendor/autoload.php';

$core = new Core($sitePath);

echo $core->render();
