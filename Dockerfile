FROM node:lts AS dependencies


WORKDIR /app
COPY package.json ./
RUN yarn

FROM node:lts AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Web Push (VAPID) — NEXT_PUBLIC_* ต้องมีตอน build เพราะถูก inline เข้า bundle
ARG VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG VAPID_SUBJECT
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN echo "DATABASE_URL=$DATABASE_URL"
RUN echo "DATABASE_URL=$DATABASE_URL" >> .env
RUN echo "VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY" >> .env
RUN echo "VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY" >> .env
RUN echo "VAPID_SUBJECT=$VAPID_SUBJECT" >> .env
RUN echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY" >> .env

RUN npx prisma generate
RUN yarn build

FROM node:lts AS deploy

WORKDIR /app

ENV NODE_ENV production

COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]