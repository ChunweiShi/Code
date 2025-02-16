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
    TransactionConfirmationStrategy,  // Add this line
  } from '@solana/web3.js';
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
  } from '@raydium-io/raydium-sdk';
  import { Wallet } from '@project-serum/anchor';
  import base58 from 'bs58';
  import { existsSync } from 'fs';
  import { readFile } from 'fs/promises';
  import { 
    NATIVE_MINT,
    createInitializeAccountInstruction, 
    createCloseAccountInstruction,
    getMinimumBalanceForRentExemptAccount,
    createSyncNativeInstruction,
  } from '@solana/spl-token';

const RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

async function findRaydiumPoolInfo(
    baseMint: string,
    quoteMint: string,
    getProgramAccounts: (baseMint: string, quoteMint: string) => Promise<GetProgramAccountsResponse>,
    connection: Connection
  ): Promise<LiquidityPoolKeys | null> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4;
    const programData = await getProgramAccounts(baseMint, quoteMint);
  
    if (!programData || programData.length === 0) {
      return null;
    }
  
    const collectedPoolResults = programData.map((info) => {
      const decodedData = layout.decode(info.account.data);
      return {
        id: new PublicKey(info.pubkey),
        version: 4,
        programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID),
        ...decodedData,
      };
    });
  
    const pool = collectedPoolResults[0];
    if (!pool) return null;
  
    const marketInfo = await connection.getAccountInfo(pool.marketId);
    if (!marketInfo) {
      throw new Error('Market account not found');
    }
  
    const market = {
      programId: marketInfo.owner,
      ...MARKET_STATE_LAYOUT_V3.decode(marketInfo.data),
    };
  
    const authority = Liquidity.getAssociatedAuthority({
      programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID),
    }).publicKey;
  
    const marketProgramId = market.programId;
  
    return {
      id: pool.id,
      baseMint: new PublicKey(pool.baseMint),
      quoteMint: new PublicKey(pool.quoteMint),
      lpMint: new PublicKey(pool.lpMint),
      baseDecimals: Number(pool.baseDecimal),
      quoteDecimals: Number(pool.quoteDecimal),
      version: pool.version,
      programId: pool.programId,
      openOrders: new PublicKey(pool.openOrders),
      targetOrders: new PublicKey(pool.targetOrders),
      baseVault: new PublicKey(pool.baseVault),
      quoteVault: new PublicKey(pool.quoteVault),
      marketVersion: 3,
      authority,
      marketProgramId,
      marketId: new PublicKey(market.ownAddress),
      marketAuthority: Market.getAssociatedAuthority({
        programId: marketProgramId,
        marketId: new PublicKey(market.ownAddress),
      }).publicKey,
      marketBaseVault: new PublicKey(market.baseVault),
      marketQuoteVault: new PublicKey(market.quoteVault),
      marketBids: new PublicKey(market.bids),
      marketAsks: new PublicKey(market.asks),
      marketEventQueue: new PublicKey(market.eventQueue),
      withdrawQueue: new PublicKey(pool.withdrawQueue),
      lpVault: new PublicKey(pool.lpVault),
      lookupTableAccount: PublicKey.default,
    } as LiquidityPoolKeys;
  }


  (async () => {
    // Set up connection
    const RPC_URL = 'https://api.mainnet-beta.solana.com'; // Replace with your RPC URL if needed
    const connection = new Connection(RPC_URL, 'confirmed');
  
    // Function to simulate fetching program accounts (you should replace this with actual implementation)
    async function getProgramAccounts(
      baseMint: string,
      quoteMint: string
    ): Promise<GetProgramAccountsResponse> {
      return await connection.getProgramAccounts(new PublicKey(RAYDIUM_V4_PROGRAM_ID), {
        filters: [
          { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
          {
            memcmp: {
              offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
              bytes: new PublicKey(baseMint).toBase58(),
            },
          },
          {
            memcmp: {
              offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
              bytes: new PublicKey(quoteMint).toBase58(),
            },
          },
        ],
      });
    }
  
    // Example base and quote mint addresses (Replace with real token mints)
    const baseMint = 'So11111111111111111111111111111111111111112'; // Example SOL mint
    const quoteMint = 'USDCgLkA8wGc3JB9LkdBHzVNJUZZmBZGrFxCMZ8LxuoQ'; // Example USDC mint
  
    try {
      const poolInfo = await findRaydiumPoolInfo(baseMint, quoteMint, getProgramAccounts, connection);
      console.log('Pool Info:', poolInfo);
    } catch (error) {
      console.error('Error fetching pool info:', error);
    }
  })();
  