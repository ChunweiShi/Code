# How to use this repo:
## This scripts works on MacOS only

1. Install VS Code and git on your computer if you haven't already
2. `git clone https://github.com/ChunweiShi/Code.git`
3. Import mainnet.json pool using Raydium API token pools: https://api.raydium.io/v2/sdk/token/raydium.mainnet.json
4. Copy the content in install-dependencies.txt and paste it into your terminal to set up environment
5. First `cd raydium-swap-ts` , then `cd src` to move into the project directory
6. ts-node main.ts to run this project, make sure you export your phantom wallet secret key and put Quicknode RPC endpoint URL in .env

# NEVER SHARE YOUR SECRET KEY WITH ANYONE!
