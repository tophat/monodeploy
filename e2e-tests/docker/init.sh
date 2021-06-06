#!/bin/bash

tmp_registry_log=`mktemp`
DEBUG=1 yarn dlx verdaccio@5.1.0 --listen http://0.0.0.0:4873 --config ~/config.yaml 2>&1 | tee $tmp_registry_log &

grep -q 'http address' <(tail -f $tmp_registry_log);

yarn dlx npm-cli-login \
        -u test-user \
        -p test-password \
        -e test@example.com \
        -r $LOCAL_REGISTRY \
    && npm config set registry $LOCAL_REGISTRY

tail -f /dev/null
