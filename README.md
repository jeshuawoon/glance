<div align="center">
  <img src="samples/icon.svg" width="80" height="80" alt="Glance Logo" />
  <h1>Glance</h1>
</div>

Welcome to **Glance**, a sleek, minimal, zero-setup local file previewer designed specifically for modern web developers.

Glance runs seamlessly from your terminal, allowing you to instantly boot up live, interactive previews of single-file components (`.tsx`, `.jsx`), rich documents (`.md`, `.mdx`), and markup strings (`.html`, `.svg`) straight from your local file system — without needing to meticulously bootstrap or configure custom environments just to look at an isolated file!

## Features

- **Live TSX & JSX Previews:** Hooks into the CodeSandbox runtime (Sandpack) to instantly bundle and actively render React components locally. Say goodbye to dummy placeholder files! Simply browse to a component on your hard drive, toggle the `Show Code` panel, and interact directly.
- **Rich Markdown Formatting:** Reads your local `.md` and `.mdx` files and renders them natively using Github-flavored markdown styling logic.
- **Native Browser Integrations:** Glance automatically delegates folder selection universally across OS environments (macOS, Windows, and Linux). Simply hit the `...` dashboard button, and a native filesystem dialog will seamlessly hook into your machine's directories to pinpoint whichever codebase you want to inspect.

## Quick Start

Glance runs completely completely detached from your primary application codebase. Because it proxies your filesystem securely through a local Express API, you never need to install Glance natively onto your production projects!

```bash
# 1. Clone the repository anywhere broadly accessible on your system
git clone https://github.com/jeshuawoon/glance.git

# 2. Navigate and install dependencies
cd glance
npm install

# 3. Fire up the development engine
npm run dev
```

By default, the concurrently running servers spin up a frontend view deployed at `http://localhost:5174/`.

1. Open your browser directly to the localhost origin.
2. Click the `...` outline button inside the top preview header.
3. A native file dialog will securely pop open on your computer allowing you to lock onto wherever your current projects are hiding to instantly preview them!

## Stack

- **React 19 & Vite** - High performance frontend bundler.
- **Express.js** - Securely acts as natively exposed API traversing local disk volumes.
- **Sandpack React (`@codesandbox/sandpack-react`)** - Zero-configuration React ecosystem parsing logic.
- **Vanilla CSS** - Minimalist variable-based grid themes.
