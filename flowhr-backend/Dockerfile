FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Applies pending migrations before starting, so a Render deploy is "push and it's live" —
# no separate manual migration step required.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
