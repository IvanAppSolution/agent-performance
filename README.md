Agent Performance Project by: Ivan Alcuino
Evaluates the agent performance based on the uploaded csv.
The dashboard page will display a graphical detail information how much each much it perform over the months.

Libraries:
Remixjs
radix-ui
zod
prisma
postgresql

Host server:
[vercel](https://agent-performance.vercel.app/)

Dashboard:
![Image](https://github.com/user-attachments/assets/e9545aef-4d18-470d-b819-b531d4dca7da)

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
