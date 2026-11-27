FROM node:22 AS dependencies


WORKDIR /app
COPY package.json ./
# node:lts เลื่อนไปเวอร์ชันที่ไม่แถม yarn มาด้วยแล้ว (build ล้มที่ "yarn: not found" ตั้งแต่ ก.ย. 2569)
# จึงตรึงเป็น node:22 และเปิด corepack ไว้ ถ้าอิมเมจไหนไม่มี corepack ให้ลง yarn 1 แทน
RUN corepack enable || npm install -g yarn@1
RUN yarn

FROM node:22 AS build

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

FROM node:22 AS deploy

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