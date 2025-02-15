import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
    GetProgramAccountsResponse,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
    SystemProgram,
    SimulatedTransactionResponse,
    TransactionConfirmationStrategy,
} from '@solana/web3.js'

import {
    Liquidity,
    LiquidityPoolKeys,
    jsonInfo2PoolKeys,
    TokenAccount,
    Token,
    TokenAmount,
    TOKEN_PROGRAM_ID,
    Percent,
    SPL_ACCOUNT_LAYOUT,
    LIQUIDITY_STATE_LAYOUT_V4,
    MARKET_STATE_LAYOUT_V3,
    Market,
} from '@raydium-io/raydium-sdk'
import {Wallet} from '@project-serum/anchor'
import base58 from 'bs58'
import {existsSync} from 'fs'
import {readFile} from 'fs/promises'
import {
    NATIVE_MINT,
    createInitializeAccountInstruction,
    createCloseAccountInstruction,
    getMinimumBalanceForRentExemptAccount,
    createSyncNativeInstruction,
} from '@solana/spl-token'
import {CONFIG} from './config'

type SwapSide = 'in' | 'out'

export class RaydiumSwap {
    static RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'

    allPoolKeysJson: any[] = [];
    connection: Connection;
    wallet: Wallet;

    constructor(RPC_URL: string, WALLET_SECRET_KEY: string) {
        if(!RPC_URL.startsWith('http://') && !RPC_URL.startsWith('https://')){
            throw new Error("Invalid RPC URL. Must start with http:// or https://")
        }
        this.connection = new Connection(RPC_URL, 'confirmed')

        try {
            if (!WALLET_SECRET_KEY) {
                throw new Error("WALLET_SECRET_KEY is not provided")
            }
            const secretKey = base58.decode(WALLET_SECRET_KEY)
            if (secretKey.length !== 64) {
                throw new Error("Invalid secret key length. Expected 64 bytes")
            }
            this.wallet = new Wallet(Keypair.fromSecretKey(secretKey))
            console.log('Wallet initialized with public key:', this.wallet.publicKey.toBase58())
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create wallet: $(error.message)`)
            }
            else {
                throw new Error("Failed to create wallet: Unknown error")
            }
        }
    }

    async loadPoolKeys() {
        try {
            if (existsSync('mainnet.json')){
                const data = JSON.parse(((await readFile('mainnet.json')).toString()))
                this.allPoolKeysJson = data.official
                return
            }
            throw new Error('mainnet.json file not found')
        }
        catch(error) {
            this.allPoolKeysJson = []
            console.log('mainnet.json exists, but it\'s empty')
        }
    }

    findPoolInfoForTokens(mintA: string, mintB: string): LiquidityPoolKeys | null {
        const poolData = this.allPoolKeysJson.find(
            (i) => (i.basemint === mintA && i.quoteMint === mintB) || (i.basemint === mintB && i.quoteMint === mintA)
        )
        return poolData ? jsonInfo2PoolKeys(poolData) as LiquidityPoolKeys : null
    }

    async getProgramAccounts(baseMint: string, quoteMint: string): Promise<GetProgramAccountsResponse> {
        const layout = LIQUIDITY_STATE_LAYOUT_V4;
        return this.connection.getProgramAccounts(new PublicKey(RaydiumSwap.RAYDIUM_V4_PROGRAM_ID)),{
            //filter is a method that belongs to getProgramAccounts, it is NOT a built-in typescript method
            filters: [
                {dataSize: layout.span},
                {
                    memCmp: {
                        offset: layout.offsetOf('basemint')
                        bytes: layout.
                    },
                }
            ]
        }
    }
}