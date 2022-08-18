FROM node:16-alpine as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./
COPY src ./src
COPY public ./public
COPY tsconfig.json ./tsconfig.json

RUN npm install --silent
RUN npm run build

COPY entrypoint.sh ./entrypoint.sh
CMD ["sh", "-c", "/app/entrypoint.sh" ]
