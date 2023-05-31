FROM node:lts AS dependencies


WORKDIR /app
COPY package.json ./
RUN yarn

FROM node:lts AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# ARG DATABASE_URL
# ENV DATABASE_URL="mongodb://pasuk-pn-tarangwen-user:IB98uQsN0164p3c7@128.199.79.240:27017,167.71.218.166:27017,167.71.220.110:27017/pasuk-pn-tarangwen-db?authSource=admin&replicaSet=me_mongodb"

# RUN echo "DATABASE_URL=$DATABASE_URL"
# RUN echo "DATABASE_URL=$DATABASE_URL" >> .env

RUN npx prisma generate
RUN yarn build

FROM node:lts AS deploy

WORKDIR /app

ENV NODE_ENV production

COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]