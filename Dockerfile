FROM node:26-alpine AS build

RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --production

FROM node:26-alpine

WORKDIR /app
COPY --chown=node:node --from=build /app/build build/
COPY --chown=node:node --from=build /app/node_modules node_modules/
COPY --chown=node:node --from=build /app/migrations migrations/
COPY --chown=node:node package.json .

ENV NODE_ENV=production
USER node
CMD ["sh", "-c", "node migrations/migrate.mjs up && node build"]