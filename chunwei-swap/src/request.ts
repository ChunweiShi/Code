import dotenv from 'dotenv';
import { solanaWeb3, Solana } from "@quicknode/sdk";

dotenv.config();

// ✅ Export QuickNode URL & Wallet Secret Key
export const QUICKNODE_URL = process.env.QUICKNODE_URL as string;
export const WALLET_SECRET_KEY = process.env.WALLET_SECRET_KEY as string;

if (!QUICKNODE_URL) {
    throw new Error("missing QUICKNODE_URL");
}
if (!WALLET_SECRET_KEY) {
    throw new Error("missing WALLET_SECRET_KEY");
}

const { PublicKey } = solanaWeb3;
const programToSearch = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
const numBlocks = 100;
const endpoint = new Solana({
    endpointUrl: QUICKNODE_URL,
});

// ✅ Function to Fetch Fees Dynamically
export async function getFees() {
    try {
        const response = await endpoint.fetchEstimatePriorityFees({
            last_n_blocks: numBlocks,
            account: programToSearch.toBase58(),
        });

        const fees = response.result;

        return {
            extremeTxFee: fees.per_transaction.extreme,
            highTxFee: fees.per_transaction.high,
            mediumTxFee: fees.per_transaction.medium,
            lowTxFee: fees.per_transaction.low,
            extremeComputeFee: fees.per_compute_unit.extreme,
            highComputeFee: fees.per_compute_unit.high,
            mediumComputeFee: fees.per_compute_unit.medium,
            lowComputeFee: fees.per_compute_unit.low,
        };
    } catch (error) {
        console.error("❌ Error fetching priority fees:", error);
        return null; // Return null on error
    }
}
