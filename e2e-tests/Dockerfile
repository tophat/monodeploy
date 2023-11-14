FROM node:21-slim

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV LOCAL_REGISTRY "http://0.0.0.0:4873"

RUN apt-get update && \
    apt-get install -yq git && \
    corepack enable

WORKDIR /home/node
RUN chown -R node: /home/node

USER node

RUN yarn dlx -p verdaccio@5.26.2 binarydoesntexist || true
RUN yarn dlx -p npm-cli-login binarydoesntexist || true

COPY ./docker/ /home/node/

CMD /home/node/init.sh
