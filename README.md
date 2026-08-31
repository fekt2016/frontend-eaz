This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

Deployed to a **Namecheap cPanel reseller plan** (LiteSpeed, AutoSSL) at `eazworld.co`,
running under Phusion Passenger via cPanel's *Setup Node.js App*. Deploys go through
cPanel Git Version Control using `.cpanel.yml`.

Build **over SSH, in place** — `.next/` is gitignored, so a local build never reaches the
server's checkout:

```bash
ssh <cpanel-user>@<server>.web-hosting.com
cd ~/repositories/frontend-eaz && npm ci && npm run build
```

Then Deploy HEAD Commit in cPanel.

See **`docs/HOSTING.md`** for DNS, the registrar API, and the open items.
