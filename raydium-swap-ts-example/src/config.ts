import dotenv from 'dotenv'
import https from 'https'
dotenv.config()

if (!process.env.QUICKNODE_URL) {
    throw new Error('QUICKNODE_URL is not set in the environment variables') 
}

if (!process.env.WALLET_SECRET_KEY) {
    throw new Error('WALLET_SECRET_KEY is not set in the environment variables')
}

interface PriorityFeeResponse {
    jsonrpc: string,
    result: {
        per_compute_unit: {
            extreme: number,
            high: number,
            medium: number,
            low: number,
        },
        per_transaction: {
            extreme: number,
            high: number,
            medium: number,
            low: number, 
        }
    }
    id: number,
}

function httpsRequest(url: string, options: https.RequestOptions, data: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = ''
            res.on('data', (chunk) => body += chunk.toString())
            res.on('end', () => resolve(body))
        })
        req.on('error', reject)
        req.write(data)
        req.end()
    })
}

async function fetchPriorityFee(): Promise<number> {
    if (!process.env.QUICKNODE_URL) {
        throw new Error('QUICKNODE_URL is not set in the environment variables') 
    }

    const url = new URL(process.env.QUICKNODE_URL)

    const options: https.RequestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 
            'application/json'
        }
    }

    const requestBody = JSON.stringify(
        {
            jsonrpc: '2.0', 
            id: 1,
            method: 'qn_estimatePriorityFees',
            params: {
                last_n_blocks: 100,
                account: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                api_version: 2
            }
        }
    )

    const response = await httpsRequest(url.href, options, requestBody);
    const data: unknown = JSON.parse(response)

    if (!isPriorityFeeResponse(data)) {
        throw new Error('Unexpected response format from priority fee API')
    }

    const extremePriorityFee = data.result.per_transaction.extreme ?? 0
    const highPriorityFee = data.result.per_transaction.high ?? 0
    const mediumPriorityFee = data.result.per_transaction.medium ?? 0
    const lowPriorityFee = data.result.per_transaction.low ?? 0
    const test = data.result.per_compute_unit.low

    const currentFee = lowPriorityFee

    const priorityFeeInSOL = currentFee / 1e15

    return Math.max(priorityFeeInSOL, 0.0000001)
}

function isPriorityFeeResponse(data: unknown): data is PriorityFeeResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'jsonrpc' in data &&
        'result' in data &&
        typeof data.result === 'object' &&
        data.result !== null &&
        'per_compute_unit' in data.result &&
        'per_transaction' in data.result &&
        typeof data.result.per_compute_unit === 'object' &&
        typeof data.result.per_transaction === 'object' &&
        data.result.per_compute_unit !== null &&
        'extreme' in data.result.per_compute_unit &&
        'high' in data.result.per_compute_unit &&
        'medium' in data.result.per_compute_unit &&
        'low' in data.result.per_compute_unit &&
        /*'extreme' in data.result.per_transaction &&
        'high' in data.result.per_transaction &&
        'medium' in data.result.per_transaction &&
        'low' in data.result.per_transaction &&*/
        typeof data.result.per_compute_unit.extreme === 'number' &&
        typeof data.result.per_compute_unit.high === 'number' &&
        typeof data.result.per_compute_unit.medium === 'number' &&
        typeof data.result.per_compute_unit.low === 'number' /*&&
        typeof data.result.per_transaction.extreme === 'number' &&
        typeof data.result.per_transaction.high === 'number' &&
        typeof data.result.per_transaction.medium === 'number' &&
        typeof data.result.per_transaction.low === 'number'*/
    )
}

export const CONFIG = {
    RPC_URL: process.env.QUICKNODE_URL,
    WALLET_SECRET_KEY: process.env.WALLET_SECRET_KEY,
    BASE_MINT: 'So11111111111111111111111111111111111111112',
    QUOTE_MINT: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    TOKEN_A_AMOUNT: 0.0001,
    EXECUTE_SWAP: true,
    USE_VERSIONED_TRANSACTION: true,
    SLIPPAGE: 5,
    getPriorityFee: fetchPriorityFee,
}
