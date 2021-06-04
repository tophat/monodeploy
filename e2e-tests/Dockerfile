FROM node:16

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

RUN apt-get update

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

WORKDIR /home/node/app
RUN chown -R node: /home/node/app

USER node

RUN npm i -g yarn && yarn set version berry && yarn set version 3.0.0-rc.2

COPY ./docker/ /home/node/

CMD /home/node/init.sh
