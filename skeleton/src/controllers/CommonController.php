<?php

namespace {{siteCode}}\controllers;

use pkvs\controllers\Controller;

class CommonController extends Controller
{
    public function getData()
    {
        $data = [
            'name' => 'World'
        ];
        return $data;
    }
}
