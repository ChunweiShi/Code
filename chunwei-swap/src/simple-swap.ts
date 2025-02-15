import dotenv from 'dotenv';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Liquidity, LiquidityPoolKeys, TokenAmount, Percent, Token, TOKEN_PROGRAM_ID, LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
import base58 from 'bs58';
import { getFees, QUICKNODE_URL, WALLET_SECRET_KEY } from './request';

dotenv.config();

// ✅ Raydium Program ID
const RAYDIUM_PROGRAM_ID = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

// ✅ SOL and BONK Token Addresses
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const BONK_MINT = new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");

// ✅ Create Solana Connection
const connection = new Connection(QUICKNODE_URL, 'confirmed');

// ✅ Decode Wallet Secret Key
const secretKey = base58.decode(WALLET_SECRET_KEY);
const wallet = Keypair.fromSecretKey(secretKey);

console.log("✅ Wallet initialized:", wallet.publicKey.toBase58());

// ✅ Function to Get Token Accounts Owned by the Wallet
async function getUserTokenAccounts(): Promise<any[]> {
    const accounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID,
    });

    return accounts.value.map((account) => ({
        pubkey: account.pubkey,
        programId: account.account.owner,
        accountInfo: account.account.data,
    }));
}

// ✅ Function to Find the Raydium Pool for SOL → BONK
async function findRaydiumPool(): Promise<LiquidityPoolKeys | null> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4
    const pools = await connection.getProgramAccounts(RAYDIUM_PROGRAM_ID, {
        filters: [
            { dataSize: layout.span }, // Standard Raydium Liquidity Pool Size
            {
                memcmp: {
                    offset: layout.offsetOf(`${BONK_MINT}`), // Offset for baseMint in the Raydium layout
                    bytes: SOL_MINT.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: 40, // Offset for quoteMint in the Raydium layout
                    bytes: BONK_MINT.toBase58(),
                },
            },
        ],
    });

    if (pools.length === 0) {
        console.error("❌ No Raydium pool found for SOL → BONK");
        return null;
    }

    console.log("✅ Found Raydium Pool:", pools[0].pubkey.toBase58());

    return {
        id: new PublicKey(pools[0].pubkey),
        baseMint: SOL_MINT,
        quoteMint: BONK_MINT,
        programId: RAYDIUM_PROGRAM_ID,
    } as LiquidityPoolKeys;
}

// ✅ Function to Execute the Swap
async function swapSolToBonk() {
    console.log("🔄 Fetching Raydium Pool...");
    const poolKeys = await findRaydiumPool();
    if (!poolKeys) return;

    console.log("💰 Fetching priority fee...");
    const fees = await getFees();
    if (!fees) {
        console.error("❌ Failed to get fees");
        return;
    }
    const priorityFee = fees.mediumTxFee / 1e9; // Convert to SOL

    console.log("📈 Fetching pool reserves...");
    const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

    const solToken = new Token(TOKEN_PROGRAM_ID, SOL_MINT, 9);
    const bonkToken = new Token(TOKEN_PROGRAM_ID, BONK_MINT, 5);

    const amountIn = new TokenAmount(solToken, 0.0001 * 1e9, false);
    const slippage = new Percent(5, 100); // 5% slippage

    console.log("🔢 Computing swap amounts...");
    const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
        poolKeys,
        poolInfo,
        amountIn,
        currencyOut: bonkToken,
        slippage,
    });

    console.log(`💵 Expected BONK Output: ${amountOut.toExact()}`);
    console.log(`🛑 Minimum BONK Output (after slippage): ${minAmountOut.toExact()}`);

    console.log("📥 Fetching user token accounts...");
    const userTokenAccounts = await getUserTokenAccounts();

    console.log("📝 Constructing transaction...");
}

// Run the swap function
swapSolToBonk();
