import {
    Connection,
    PublicKey,
    Keypair,
    VersionedTransaction,
    GetProgramAccountsResponse,
    LAMPORTS_PER_SOL,
    SystemProgram,
} from '@solana/web3.js'

import {
    Liquidity,
    Token,
    Market,
    LIQUIDITY_STATE_LAYOUT_V4,
    LiquidityPoolKeys,
    MARKET_STATE_LAYOUT_V3,
} from '@raydium-io/raydium-sdk'

import {
    NATIVE_MINT,
} from '@solana/spl-token'

import dotenv from 'dotenv'
dotenv.config()

if (!process.env.QUICKNODE_URL) {
    throw new Error("QUICKNODE_URL is undefined")
}

const url: string = process.env.QUICKNODE_URL
const RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
const BASE_MINT = 'So11111111111111111111111111111111111111112'
const QUOTE_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
const amount = '0.00001'

const connection = new Connection(url, 'confirmed')

async function getProgramAccounts(baseMint: string, quoteMint: string): Promise<GetProgramAccountsResponse> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4
    return connection.getProgramAccounts(new PublicKey(RAYDIUM_V4_PROGRAM_ID), {
        filters: [
            {dataSize: layout.span},
            {
                memcmp: {
                    offset: layout.offsetOf('baseMint'),
                    bytes: new PublicKey(baseMint).toBase58(),
                },
            },
            {
                memcmp: {
                    offset: layout.offsetOf('quoteMint'),
                    bytes: new PublicKey(quoteMint).toBase58(),
                },
            }
        ]
    })
}

async function findRaydiumPoolInfo(baseMint: string, quoteMint: string): Promise<LiquidityPoolKeys | null> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4
    const programData = await getProgramAccounts(baseMint, quoteMint)
    const collectedPoolResults = programData.map((info) => ({
        id: new PublicKey(info.pubkey), 
        version: 4, 
        programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID), ...layout.decode(info.account.data)
    }))
    .flat()

    const pool = collectedPoolResults[0]
    if (!pool) return null

    const market = await connection.getAccountInfo(pool.marketId).then((item) => {
        if (!item){
            throw new Error('Market account not found')
        }
        return {
            programId: item.owner, 
            ...MARKET_STATE_LAYOUT_V3.decode(item.data),
        }
    })

    const marketProgramId = market.programId;

    const authority = Liquidity.getAssociatedAuthority({
        programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID),
      }).publicKey;

    return {
        id: pool.id,
        baseMint: pool.baseMint,
        quoteMint: pool.quoteMint,
        lpMint: pool.lpMint,
        baseDecimals: Number.parseInt(pool.baseDecimal.toString()),
        quoteDecimals: Number.parseInt(pool.quoteDecimal.toString()),
        lpDecimals: Number.parseInt(pool.baseDecimal.toString()),
        version: pool.version,
        programId: pool.programId,
        openOrders: pool.openOrders,
        targetOrders: pool.targetOrders,
        baseVault: pool.baseVault,
        quoteVault: pool.quoteVault,
        marketVersion: 3,
        authority: authority,
        marketProgramId,
        marketId: market.ownAddress,
        marketAuthority: Market.getAssociatedAuthority({
          programId: marketProgramId,
          marketId: market.ownAddress,
        }).publicKey,
        marketBaseVault: market.baseVault,
        marketQuoteVault: market.quoteVault,
        marketBids: market.bids,
        marketAsks: market.asks,
        marketEventQueue: market.eventQueue,
        withdrawQueue: pool.withdrawQueue,
        lpVault: pool.lpVault,
        lookupTableAccount: PublicKey.default,
    } as LiquidityPoolKeys;
} 

async function getSwapTransaction(toToken: string, amount: number, poolKeys: LiquidityPoolKeys, 
useVersionedTransaction = true, slippage: number = 5): Promise<VersionedTransaction> {
    const poolInfo = await Liquidity.fetchInfo({connection, poolKeys})
    const fromToken = poolKeys.baseMint.toString() === NATIVE_MINT.toString() ? NATIVE_MINT.toString() : poolKeys.quoteMint.toString()
}

async function main(){
    const results = await findRaydiumPoolInfo(BASE_MINT, QUOTE_MINT)
    console.log(results)
}

main()