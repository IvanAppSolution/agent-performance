PR Management Tool by Rosely Inc. by: Ivan Alcuino

1. npm i -g pnpm // if pnpm is not yet installed
2. pnpm install
3. pnpm db:gen

# prisma db push
pnpm db:push

# prisma db seed
pnpm db:seed

# check: env typecheck prettier eslint stylelint prisma
pnpm check

# fix: prettier eslint stylelint prisma
pnpm fix

# Run in local
pnpm dev
npm run dev

# Start project in production
pnpm build
pnpm start

# db modifications
npx prisma db push