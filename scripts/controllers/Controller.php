<?php

namespace {{siteCode}}\controllers;

use pkvs\controllers\Controller;

class helloController extends Controller
{

    public function actionIndex()
    {
        return $this->renderTwig('hello.twig.html', null);
    }

}