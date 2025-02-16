import {
    Connection,
    PublicKey,
    Keypair,
    VersionedTransaction,
    GetProgramAccountsResponse,
    LAMPORTS_PER_SOL,
    SystemProgram
} from '@solana/web3.js'

import {
    Liquidity,
    Token,
    Market,
    LIQUIDITY_STATE_LAYOUT_V4,
    MARKET_STATE_LAYOUT_V3
} from '@raydium-io/raydium-sdk'

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
const layout = LIQUIDITY_STATE_LAYOUT_V4

console.log(layout)