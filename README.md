# Agent Performance
Project by: Ivan Alcuino<br/>
Evaluates the agent performance based on the uploaded csv.<br/>
The dashboard page will display a graphical detail information how much each much it perform over the months.<br/>

# Libraries
Remixjs<br/>
radix-ui<br/>
zod<br/>
prisma<br/>
postgresql<br/>

Host server: Vercel<br/>
[agent-performance](https://agent-performance.vercel.app/)<br/>

Dashboard:<br/>
![Image](https://github.com/user-attachments/assets/e9545aef-4d18-470d-b819-b531d4dca7da)

# Installation
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
