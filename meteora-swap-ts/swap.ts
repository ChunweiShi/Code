import DLMM from '@meteora-ag/dlmm'
import BN from "bn.js"

import {
    Connection,
    PublicKey
} from '@solana/web3.js'

const BASE_MINT = 'So11111111111111111111111111111111111111112'
const QUOTE_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
const amount = '0.00001'

const USDC_USDT_POOL = new PublicKey('ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq') // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all

async function swapQuote(
    poolAddress: PublicKey,
    swapAmount: BN,
    swapYtoX: boolean,
    isPartialFill: boolean
  ) {
    let rpc = "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpc, "finalized");
    const dlmmPool = await DLMM.create(connection, poolAddress, {
      cluster: "mainnet-beta",
    });
  
    const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
    const swapQuote = await dlmmPool.swapQuote(
      swapAmount,
      swapYtoX,
      new BN(10),
      binArrays,
      isPartialFill
    );
    console.log("🚀 ~ swapQuote:", swapQuote);
    console.log(
      "consumedInAmount: %s, outAmount: %s",
      swapQuote.consumedInAmount.toString(),
      swapQuote.outAmount.toString()
    );
  }
  
async function main() {
    await swapQuote(
      new PublicKey("8kCbYxnF8ggdJACxz4NLYtVhEEz6EBvN5NQcKAazpkEY"),
      new BN(1_000_000_000),
      true,
      true
    );
  }
  
main();