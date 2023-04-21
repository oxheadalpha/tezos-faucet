FROM node:16-alpine as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

RUN chown node:node /app

USER node

COPY --chown=node:node . ./
# COPY package.json ./
# COPY package-lock.json ./

RUN npm install

# COPY src ./src
# COPY scripts ./scripts
# COPY public ./public
# COPY tsconfig.json ./tsconfig.json
# COPY entrypoint.sh ./entrypoint.sh

# RUN npm run build
# RUN chown -R node:node build

CMD ["sh", "-c", "/app/entrypoint.sh" ]
