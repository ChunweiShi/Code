import {
    Raydium,
    PoolFetchType,
} from "@raydium-io/raydium-sdk-v2";

import {
    Connection,
    PublicKey
} from '@solana/web3.js'

import dotenv from 'dotenv'
dotenv.config()

if (!process.env.QUICKNODE_URL) {
    throw new Error("QUICKNODE_URL is undefined")
}

const url: string = process.env.QUICKNODE_URL
const BASE_MINT = 'So11111111111111111111111111111111111111112'
const QUOTE_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
const amount = '0.00001'

const connection = new Connection(url, 'confirmed')

const owner = new PublicKey('65MdDw9Vy1qzNm5SZbpxUsWp7B9cjQafXtfnjzLaYF1Z')

async function main(){
    const raydium = await Raydium.load({
        connection,
        owner, // key pair or publicKey, if you run a node process, provide keyPair
        disableLoadToken: false, // default is false, if you don't need token info, set to true
    });

    const data1 = await raydium.api.fetchPoolByMints({
        mint1: BASE_MINT,
        mint2: QUOTE_MINT, // optional,
        type: PoolFetchType.All,
        sort: 'liquidity',
        order: 'desc',
        page: 1
        // extra params: https://github.com/raydium-io/raydium-sdk-V2/blob/master/src/api/type.ts#L249
    });

    // ids: join pool ids by comma(,)
    const data2 = await raydium.api.fetchPoolById({
        ids: "GtKKKs3yaPdHbQd2aZS4SfWhy8zQ988BJGnKNndLxYsN",
    });

    
    
    console.log(data2)
}

main()