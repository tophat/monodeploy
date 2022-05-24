FROM node:16

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV LOCAL_REGISTRY "http://0.0.0.0:4873"

RUN apt-get update

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

WORKDIR /home/node
RUN chown -R node: /home/node

USER node

RUN npm i -g yarn \
    && yarn set version berry \
    && yarn set version 3.2.1
RUN yarn dlx -p verdaccio@5.1.0 binarydoesntexist || true
RUN yarn dlx -p npm-cli-login binarydoesntexist || true

COPY ./docker/ /home/node/

CMD /home/node/init.sh
