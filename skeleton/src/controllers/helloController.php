<?php

namespace {{siteCode}}\controllers;

use pkvs\controllers\Controller;

class helloController extends Controller
{

    public function actionIndex()
    {
        $data = [
            'name' => 'World'
        ];
        return $this->renderTwig('hello.twig', $data);
    }

}