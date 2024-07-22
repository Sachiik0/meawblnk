import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from '@solana/actions';
import { PublicKey, Connection, clusterApiUrl, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createMintToInstruction } from '@solana/spl-token';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const MINT_AUTHORITY_SECRET_KEY_STRING = process.env.MINT_AUTHORITY_PRIVATE_KEY;
const MINT_ADDRESS = process.env.MINT_ADDRESS;

if (!MINT_AUTHORITY_SECRET_KEY_STRING || !MINT_ADDRESS) {
    throw new Error("Missing environment variables: MINT_AUTHORITY_PRIVATE_KEY or MINT_ADDRESS");
}

// Convert the secret key from string to Uint8Array
const MINT_AUTHORITY_SECRET_KEY = Uint8Array.from(JSON.parse(MINT_AUTHORITY_SECRET_KEY_STRING));

// Convert mint address to PublicKey
const mintPublicKey = new PublicKey(MINT_ADDRESS);

export async function GET(request: Request): Promise<Response> {
    try {
        const payload: ActionGetResponse = {
            icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLT7i1KaPG3JWvgdPnWK9h3h3IxUxumVQsEA&s",
            description: " Testing mint tokens",
            title: "Mint tokens ",
            label: 'Mint'
        };
        return new Response(JSON.stringify(payload), { headers: ACTIONS_CORS_HEADERS });
    } catch (err) {
        console.error(err);
        const message = typeof err === "string" ? err : "An unknown error occurred";
        return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
        });
    }
};

export async function POST(request: Request): Promise<Response> {
    try {
        const connection = new Connection(clusterApiUrl('devnet'));
        const requestBody: ActionPostRequest = await request.json();
        const userPubkey = new PublicKey(requestBody.account);

        // Mint authority keypair
        const mintAuthority = Keypair.fromSecretKey(MINT_AUTHORITY_SECRET_KEY);

        // Ensure the mintPublicKey is defined
        if (!mintPublicKey) {
        throw new Error("Invalid mint address");
        }

        // Get or create the user's associated token account
        const userATA = await getOrCreateAssociatedTokenAccount(
            connection,
            mintAuthority,
            mintPublicKey,
            userPubkey
        );

        // Create the mint instruction
        const amount = 1000000000; // Adjust the amount as needed
        const mintToInstruction = createMintToInstruction(
            mintPublicKey,
            userATA.address,
            mintAuthority.publicKey,
            amount
        );

        // Create a transaction and add the mint instruction
        const transaction = new Transaction().add(mintToInstruction);

        // Sign and send the transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [mintAuthority]
        );

        const response: ActionPostResponse = {
            transaction: signature,
            message: `Hello ${userPubkey.toString()}. This will help Me-Aw so much. Thank you very much.🤙🏿🤙🏿🤙🏿`,
        };

        return new Response(JSON.stringify(response), { headers: ACTIONS_CORS_HEADERS });
    } catch (err) {
        console.error(err);
        const message = typeof err === "string" ? err : "An unknown error occurred";
        return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
        });
    }
};
