#!/bin/bash

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

step() {
    LABEL=$@
    echo
    echo -e "${YELLOW}${LABEL}"
    for (( i=0; i<${#LABEL}; i++ )); do
        echo -ne "="
    done
    echo -e "${NC}"
}

try() {
    COMMAND=$@
    echo
    echo -e "$ ${GREEN}${COMMAND}${NC}"

    "$@"

    local EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        failure "Command '${COMMAND}' failed with exit code $EXIT_CODE." >&2
        exit 1
    fi

    return $EXIT_CODE
}

success() {
    MSG=$@
    echo
    echo -en "$(tput setab 2)       "
    for (( i=0; i<${#MSG}; i++ )); do
        echo -n " "
    done
    echo -e "$(tput sgr 0)"
    echo -e "$(tput setab 2)$(tput setaf 0) [OK] ${MSG} $(tput sgr 0)"
    echo -en "$(tput setab 2)       "
    for (( i=0; i<${#MSG}; i++ )); do
        echo -n " "
    done
    echo -e "$(tput sgr 0)"
    echo
}

failure() {
    MSG=$@
    echo
    echo -en "$(tput setab 1)          "
    for (( i=0; i<${#MSG}; i++ )); do
        echo -n " "
    done
    echo -e "$(tput sgr 0)"
    echo -e "$(tput setab 1)$(tput setaf 7) [ERROR] ${MSG} $(tput sgr 0)"
    echo -en "$(tput setab 1)          "
    for (( i=0; i<${#MSG}; i++ )); do
        echo -n " "
    done
    echo -e "$(tput sgr 0)"
    echo
}


step "Moving to deploy project directory"
try cd /var/www/player2.1tv.com

step "GIT pull"
try sudo -u apache git pull

step "Updating frontend dependencies"
try sudo -u apache npm install

step "Building css, js, images"
try sudo -u apache gulp deploy

step "Updating backend dependencies"
try sudo -u apache composer install --no-dev --prefer-dist --optimize-autoloader --classmap-authoritative

step "Clearing cache"
try sudo -u apache php bin/console cache:clear --env=prod --no-debug --no-warmup
try sudo -u apache php bin/console cache:warmup --env=prod

success "Complete"

