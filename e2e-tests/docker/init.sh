#!/bin/bash

tmp_registry_log=`mktemp`
yarn dlx verdaccio --listen $LOCAL_REGISTRY --config ~/config.yaml | tee $tmp_registry_log &

grep -q 'http address' <(tail -f $tmp_registry_log);

yarn dlx npm-cli-login \
        -u test-user \
        -p test-password \
        -e test@example.com \
        -r $LOCAL_REGISTRY \
    && npm config set registry $LOCAL_REGISTRY

tail -f /dev/null
