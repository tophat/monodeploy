#!/bin/bash

yarn dlx verdaccio &

sleep 1;

npm config set registry http://localhost:4873;
npm adduser < /home/node/docker-context.txt;

tail -f /dev/null
