<?php

namespace {{siteCode}}\controllers;

use pkvs\controllers\Controller;

class HelloController extends CommonController
{
    public function actionIndex()
    {
        $data = $this->getData();
        return $this->renderTwig('hello.twig', $data);
    }
}
