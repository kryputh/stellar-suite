# Kit Studio by Stellar Kit

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/0xVida.stellar-kit-studio?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=0xVida.stellar-kit-studio)
[![License](https://img.shields.io/github/license/0xVida/stellar-suite?style=flat-square)](LICENSE.md)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-black?style=flat-square&logo=stellar)](https://stellar.org)

- **Extension:** [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=0xVida.stellar-kit-studio) · **Manage:** [Publisher Hub](https://marketplace.visualstudio.com/manage/publishers/0xVida/extensions/stellar-kit/hub)

**Kit Studio** is a developer toolkit for building, deploying, and managing smart contracts on the Stellar network — directly from your editor. Build, deploy, and simulate Soroban contracts from VS Code without jumping between the terminal and the editor: the Stellar CLI is wired into a sidebar and commanded s so you can stay in the flow.

---

## What it does

- **Build and deploy** contracts with a few clicks. The extension runs the CLI, captures contract IDs, and stores deployment metadata.
- **Sidebar** for your workspace: see contracts, build status, deployment history, and run Build / Deploy / Simulate from there.
- **Simulate transactions** against the network and get formatted results, resource usage, and storage diffs in the editor.
- **Signing** is built in: interactive prompt, keypair file, VS Code secure storage, or paste a signature from a hardware wallet.
- **Errors and progress** from the CLI are streamed and parsed so you get clear feedback when something fails.

<img width="1440" height="900" alt="Screenshot 2026-03-09 at 12 07 44" src="https://github.com/user-attachments/assets/d4289221-7f6c-4d7f-aa8d-835ec3eaa5fd" />

*Screenshot of the current Stellar Kit Studio MVP. The project and repo were originally released as Stellar Suite; the product is now named Stellar Kit Studio with parent brand retaining Stellar Kit.*

---

## Install and run

Install **Kit Studio** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=0xVida.stellar-kit-studio) (Extensions view, `Ctrl+Shift+X` / `Cmd+Shift+X`).

1. Open a workspace that has a Soroban contract (e.g. a `Cargo.toml` with `soroban-sdk`).
2. Open the **Kit Studio** sidebar from the Activity Bar.
3. Use **Build** on a contract, then **Deploy** or **Simulate** as needed.

**Build from source:** clone the repo, run `npm install` and `npm run compile`, then press `F5` in VS Code to launch the Extension Development Host.

---

## Main workflows

**Deploy:** Command Palette → **Stellar Kit: Deploy Contract**. Pick WASM, network, source account, and signing method. The extension runs the CLI, handles signing, and shows the result and contract ID.

**Build:** Command Palette → **Stellar Kit: Build Contract**, or use the sidebar. Chooses the contract folder if you have more than one.

**Simulate:** Command Palette → **Stellar Kit: Simulate Soroban Transaction**. Enter contract ID, function, and arguments; results show in a panel with return values and resource usage.

---

### Using the Sidebar

The Stellar Kit sidebar provides a visual interface for managing contracts:

- View all detected contracts in your workspace
- See build status at a glance
- View previously deployed contracts
- Access quick actions (Build, Deploy, Simulate)
- Manage CLI identities and networks
- Generate TypeScript bindings for contracts
- View execution history

---

## Contributing

Fork the repo, clone it, run `npm install` and `npm run compile`. Use `npm test` to run the test suite and `F5` in VS Code to try your changes in the Extension Development Host. Keep changes focused, handle errors clearly, and update docs when you change behavior.

---

## Support

Open an issue on GitHub for bugs or feature ideas.
