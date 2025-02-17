import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import DLMM from "@meteora-ag/dlmm";
import BN from "bn.js";
import { BinLiquidity, LbPosition, StrategyType } from "@meteora-ag/dlmm";
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.USER_PRIVATE_KEY) {
  throw new Error('Undefined User Private Key')
}

const user = Keypair.fromSecretKey(
  new Uint8Array(bs58.decode(process.env.USER_PRIVATE_KEY))
);
const RPC = process.env.RPC || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC, "finalized");

const poolAddress = new PublicKey(
  "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6"
);

/** Utils */
export interface ParsedClockState {
  info: {
    epoch: number;
    epochStartTimestamp: number;
    leaderScheduleEpoch: number;
    slot: number;
    unixTimestamp: number;
  };
  type: string;
  program: string;
  space: number;
}

let activeBin: BinLiquidity;
let userPositions: LbPosition[] = [];

const newBalancePosition = new Keypair();
const newImbalancePosition = new Keypair();
const newOneSidePosition = new Keypair();

async function swap(dlmmPool: DLMM) {
  const swapAmount = new BN(1000000);
  // Swap quote
  const swapYtoX = true;
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

  const swapQuote = await dlmmPool.swapQuote(swapAmount, swapYtoX, new BN(10), binArrays);

  console.log("🚀 ~ swapQuote:", swapQuote);

  // Swap
  const swapTx = await dlmmPool.swap({
    inToken: dlmmPool.tokenX.publicKey,
    binArraysPubkey: swapQuote.binArraysPubkey,
    inAmount: swapAmount,
    lbPair: dlmmPool.pubkey,
    user: user.publicKey,
    minOutAmount: swapQuote.minOutAmount,
    outToken: dlmmPool.tokenY.publicKey,
  });

  try {
    const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
      user,
    ]);
    console.log("🚀 ~ swapTxHash:", swapTxHash);
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

async function main() {
  const dlmmPool = await DLMM.create(connection, poolAddress, {
    cluster: "mainnet-beta",
  });

  await swap(dlmmPool);
}

main();