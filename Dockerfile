FROM node:16-alpine as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

RUN chown node:node /app

USER node

COPY --chown=node:node . ./

RUN npm install

CMD ["sh", "-c", "/app/entrypoint.sh" ]
