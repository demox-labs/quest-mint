import { TESTNET3_API_URL, getAleoTransactionsForProgram, getNextQuestMintId, getTransactionsCount, getTransactionsForProgram } from "@/aleo/rpc";
import { NFTProgramId } from '@/aleo/nft-program';
import { asciiBinaryToString, convertBinaryToU128, convertStringToAsciiBinary, convertU128ToBinary, nftExtLength } from "./AsciiConverter";

const pageSize = 1000;
const latestTransactionCount = 100;

export const getLastMintedTokenIds = async (): Promise<string[]> => {
  const txCount = await getTransactionsCount(NFTProgramId, 'mint');
  const lastPage = Math.floor(txCount / pageSize);
  let latestTransactions: any[] = [];
  const lastPageTxs = await getAleoTransactionsForProgram(NFTProgramId, 'mint', TESTNET3_API_URL, lastPage);
  latestTransactions = latestTransactions.concat(lastPageTxs);
  if (latestTransactions.length < latestTransactionCount && lastPage > 0) {
    const earlierTransactions = await getAleoTransactionsForProgram(NFTProgramId, 'mint', TESTNET3_API_URL, lastPage - 1);
    latestTransactions = latestTransactions.concat(earlierTransactions);
  }

  return latestTransactions.map((tx: any) => getU128FutureFromAleoTransaction(tx));
};

export const getU128FutureFromAleoTransaction = (tx: any): string => {
  const outputs: { type: string, value: string }[] = tx.transaction.execution.transitions[0].outputs;
  const futureOutput = outputs.filter(o => o.type === 'future')[0];
  const u128Pattern = /(\d+)u128/;
  const match = futureOutput.value.match(u128Pattern);

  const u128Future = match ? match[1] : "";
  return u128Future;
};

export const getNextUnclaimedTokenId = async (): Promise<string> => {
  const lastMintedTokenIds = await getLastMintedTokenIds();
  const mintedIdsAsAsciiBinary = lastMintedTokenIds.map((id: string) => convertU128ToBinary(id));
  // need to shave off the extension
  const mintedIdsAsInts = mintedIdsAsAsciiBinary.map((id: string) => BigInt(asciiBinaryToString(id).slice(0, -nftExtLength)));
  mintedIdsAsInts.sort((a: bigint, b: bigint) => {
    if(a > b) {
      return 1;
    } else if (a < b){
      return -1;
    } else {
      return 0;
    }
  });

  const nextUnclaimedTokenIds: bigint[] = [];

  let nextIdToCheck = mintedIdsAsInts.length > 0 ? mintedIdsAsInts[0] : BigInt(0);
  while (nextUnclaimedTokenIds.length < 100) {
    if (!mintedIdsAsInts.includes(nextIdToCheck)) {
      nextUnclaimedTokenIds.push(nextIdToCheck);
    }
    nextIdToCheck++;
  }

  const nextUnclaimedTokenIdsAsAscii = nextUnclaimedTokenIds.map((id: bigint) => convertStringToAsciiBinary(id.toString()));

  const nextUnclaimedTokenId = await getNextQuestMintId(TESTNET3_API_URL, nextUnclaimedTokenIdsAsAscii);

  const nextUnclaimedTokenIdAsU128 = convertBinaryToU128(nextUnclaimedTokenId);

  return nextUnclaimedTokenIdAsU128.toString();
};