FROM node:16-alpine as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./

RUN npm install --silent

COPY src ./src
COPY scripts ./scripts
COPY public ./public
COPY tsconfig.json ./tsconfig.json
COPY entrypoint.sh ./entrypoint.sh

RUN npm run build

USER node

CMD ["sh", "-c", "/app/entrypoint.sh" ]
