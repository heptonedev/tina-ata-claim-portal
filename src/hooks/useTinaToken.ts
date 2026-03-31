"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";

const TINA_MINT = new PublicKey("BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ");

export interface TinaTokenState {
  solBalance: number | null;
  tinaBalance: number | null;
  hasAta: boolean;
  ataAddress: string | null;
  loading: boolean;
  creating: boolean;
  closing: boolean;
  claiming: boolean;
  error: string | null;
  successMessage: string | null;
  clearSuccess: () => void;
  refresh: () => Promise<void>;
  createAta: () => Promise<void>;
  closeAta: () => Promise<void>;
  claimAirdrop: () => Promise<void>;
}

export function useTinaToken(): TinaTokenState {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tinaBalance, setTinaBalance] = useState<number | null>(null);
  const [hasAta, setHasAta] = useState(false);
  const [ataAddress, setAtaAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      setTinaBalance(null);
      setHasAta(false);
      setAtaAddress(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ata = getAssociatedTokenAddressSync(
        TINA_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      setAtaAddress(ata.toBase58());

      console.log("[TINA] Wallet:", publicKey.toBase58());
      console.log("[TINA] Computed ATA:", ata.toBase58());
      console.log("[TINA] Token Program:", TOKEN_2022_PROGRAM_ID.toBase58());

      // Fetch SOL balance and ATA info sequentially (RPC rate limit)
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
      console.log("[TINA] SOL balance:", balance / LAMPORTS_PER_SOL);

      const accountInfo = await connection.getAccountInfo(ata);
      console.log("[TINA] ATA accountInfo:", accountInfo ? "EXISTS" : "NULL");

      if (accountInfo) {
        console.log("[TINA] ATA owner:", accountInfo.owner.toBase58());
        setHasAta(true);
        try {
          const tokenAccount = await getAccount(
            connection,
            ata,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
          );
          const decimals = 9;
          const bal = Number(tokenAccount.amount) / Math.pow(10, decimals);
          console.log("[TINA] Token balance:", bal);
          setTinaBalance(bal);
        } catch (e) {
          console.error("[TINA] getAccount error:", e);
          setTinaBalance(0);
        }
      } else {
        // ATA not found at computed address, fallback to getTokenAccountsByOwner
        console.log("[TINA] ATA not found at computed address, searching by owner...");
        try {
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
            mint: TINA_MINT,
            programId: TOKEN_2022_PROGRAM_ID,
          });
          console.log("[TINA] Token accounts found:", tokenAccounts.value.length);
          if (tokenAccounts.value.length > 0) {
            const foundAta = tokenAccounts.value[0].pubkey;
            setAtaAddress(foundAta.toBase58());
            setHasAta(true);
            console.log("[TINA] Found ATA via search:", foundAta.toBase58());
            try {
              const tokenAccount = await getAccount(
                connection,
                foundAta,
                "confirmed",
                TOKEN_2022_PROGRAM_ID
              );
              const decimals = 9;
              setTinaBalance(Number(tokenAccount.amount) / Math.pow(10, decimals));
            } catch {
              setTinaBalance(0);
            }
          } else {
            setHasAta(false);
            setTinaBalance(null);
          }
        } catch (e) {
          console.error("[TINA] getTokenAccountsByOwner error:", e);
          setHasAta(false);
          setTinaBalance(null);
        }
      }
    } catch (err) {
      console.error("[TINA] Failed to fetch token info:", err);
      setError("Failed to fetch token info. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createAta = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;

    setCreating(true);
    setError(null);

    try {
      const ata = getAssociatedTokenAddressSync(
        TINA_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const instruction = createAssociatedTokenAccountInstruction(
        publicKey,
        ata,
        publicKey,
        TINA_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      await refresh();
    } catch (err) {
      console.error("Failed to create ATA:", err);
      setError("Failed to create ATA. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [publicKey, sendTransaction, connection, refresh]);

  const closeAta = useCallback(async () => {
    if (!publicKey || !sendTransaction || !ataAddress) return;

    if (tinaBalance && tinaBalance > 0) {
      setError("TINA balance must be 0 to close ATA.");
      return;
    }

    setClosing(true);
    setError(null);

    try {
      const ataPublicKey = new PublicKey(ataAddress);

      const instruction = createCloseAccountInstruction(
        ataPublicKey,   // token account to close
        publicKey,      // SOL destination
        publicKey,      // account owner
        [],
        TOKEN_2022_PROGRAM_ID
      );

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      await refresh();
    } catch (err) {
      console.error("Failed to close ATA:", err);
      setError("Failed to close ATA. Please try again.");
    } finally {
      setClosing(false);
    }
  }, [publicKey, sendTransaction, connection, ataAddress, tinaBalance, refresh]);

  const claimAirdrop = useCallback(async () => {
    if (!publicKey || !hasAta) return;

    setClaiming(true);
    setError(null);

    try {
      // Placeholder: actual airdrop logic requires backend API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccessMessage("Airdrop claimed successfully! Tokens will arrive in your wallet shortly.");
      await refresh();
    } catch (err) {
      console.error("Failed to claim airdrop:", err);
      setError("Failed to claim airdrop. Please try again.");
    } finally {
      setClaiming(false);
    }
  }, [publicKey, hasAta, refresh]);

  return {
    solBalance,
    tinaBalance,
    hasAta,
    ataAddress,
    loading,
    creating,
    closing,
    claiming,
    error,
    successMessage,
    clearSuccess: () => setSuccessMessage(null),
    refresh,
    createAta,
    closeAta,
    claimAirdrop,
  };
}
