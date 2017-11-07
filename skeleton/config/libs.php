<?php

return [
    'pdo' => ['\PDO', $this->pdo, $this->pdoUser, $this->pdoPass, [\PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'UTF8'"]],
];
