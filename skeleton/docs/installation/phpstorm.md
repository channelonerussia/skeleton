# Настройка PhpStorm

## Включение проверки JS

 * Установить [ESLint](https://eslint.org/docs/user-guide/getting-started)
 * Settings -> Languages & Frameworks -> Javascript: Выбрать ECMAScript 6
 * Settings -> Languages & Frameworks -> Code Quality Tools -> ESLint -> Enable

## Включение Stylelint
 * Установить [Stylelint](https://stylelint.io/)  
 * Settings -> Languages & Frameworks ->Stylesheets->Stylelint->Enable

> Внимание! При работе через WSL (Windows Subsystem for Linux), 
> Node.js и Stylelint должны быть установлены в Linux. 
> Путь к Stylelint в настройках должен быть указан в подсистеме Linux, 
> но относительно домашней папки Windows.
> Пример: `~\AppData\Local\lxss\rootfs\usr\lib\node_modules\stylelint`  