import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import useSWR from 'swr';
import { TESTNET3_API_URL, getHeight, getMintBlock, getNFTs, getSettingsStatus } from '@/aleo/rpc';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { getSettingsFromNumber } from '@/lib/util';
import { random } from 'lodash';
import { NextSeo } from 'next-seo';
import { ImageSlider } from '@/components/ui/image-slider';
import MintCountdown from '@/components/mint/countdown';
import { getNextUnclaimedTokenId } from '@/utils/NextTokenIds';
import { useRouter } from 'next/router';
import Button from '@/components/ui/button';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import Logo from '@/components/ui/logo';

const enum MintStep {
  CONNECT = 'CONNECT YOUR WALLET',
  MINT = 'Mint the Nft',
  WAIT = 'GET READY',
}

const MintPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data: settingsNum, error, isLoading } = useSWR('getSettingsStatus', () => getSettingsStatus(TESTNET3_API_URL));
  const { data: height, error: heightError, isLoading: heightIsLoading } = useSWR('height', () => getHeight(TESTNET3_API_URL));
  const { data: mintBlock, error: mintBlockError, isLoading: mintBlockIsLoading } = useSWR('getMintBlock', () => getMintBlock(TESTNET3_API_URL));
  const router = useRouter();

  let [settings, setSettings] = useState<any | undefined>(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);
  let [transactionId, setTransactionId] = useState<string | undefined>();
  let [status, setStatus] = useState<string | undefined>();
  let [mintStep, setMintStep] = useState<MintStep>(MintStep.CONNECT);
  let [subMessage, setSubMessage] = useState<string>('');
  let [nextTokenId, setNextTokenId] = useState<string>('');

  useEffect(() => {
    setSettings(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);
  }, [settingsNum]);

  useEffect(() => {
    initialize();
  }, [settings, publicKey]);

  const mintingActive = (settings: any, height: number | undefined, block: number | undefined) => {
    return settings?.active && height != undefined && block != undefined && block <= height;
  };

  const initialize = async () => {
    if (!publicKey) {
      setMintStep(MintStep.CONNECT);
      return;
    }

    if (!mintingActive(settings, height, mintBlock?.block)) {
      setMintStep(MintStep.WAIT);
      setSubMessage('Minting is not active yet.');
      return;
    }

    setMintStep(MintStep.MINT);
    setSubMessage(`Your Wallet ${publicKey.slice(0, 7)}...${publicKey.slice(-4)}`);
    if (nextTokenId === '') {
      const nextTokenId = await getNextUnclaimedTokenId();
      setNextTokenId(nextTokenId);
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    setSettings(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId!);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  const handleButtonClick = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    let aleoTransaction: Transaction | null = null;

    if (mintStep === MintStep.MINT) {
      aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NFTProgramId,
        'mint',
        [nextTokenId],
        200_000,
      );
    };

    if (aleoTransaction) {
      const txId =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
      setTransactionId(txId);
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
    setStatus(status);

    // Check if the transaction is successful, then redirect
    if (status === 'Completed') {
      router.push({
        pathname: '/success',
        query: { transactionId: txId, nextTokenId: nextTokenId.slice(0, -4) }}
      ); // Redirect to the success page
    }
  };

  return (
    <>
      <NextSeo
        title="Leo Wallet | Mint NFTs"
        description="Mint an NFT using the Leo Wallet"
      />
      <div className="mx-auto max-w-md px-4 sm:px-6 sm:pt-4 lg:px-8 xl:px-10 2xl:px-0">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.svg" alt="Leo Wallet Logo" className="h-8 w-8 mr-2" />
          <h2 className="text-gray-900 dark:text-white text-xl">
            Leo Wallet
          </h2>
        </div>
        <h1 className="mb-6 font-semibold text-center text-gray-900 dark:text-white text-3xl">
          Quest name
        </h1>
        <h3 className='flex justify-center mb-6 text-sm'>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry
        </h3>
        {settingsNum !== undefined && (
          <div className='flex justify-center my-8'>
            {publicKey && (
              <button
                className="font-medium text-xl shadow-card dark:bg-violet-500 dark:hover:enabled:bg-violet-700 md:h-10 md:px-5 xl:h-12 xl:px-7 rounded-md"
                // size='large'
                disabled={!settings?.active || !publicKey || mintStep === MintStep.WAIT}
                onClick={() => handleButtonClick()}
              >
                  {mintStep}
              </button>
            )}
            {!publicKey && (
              <WalletMultiButton startIcon={undefined} className="font-medium text-xl shadow-card dark:bg-violet-500 dark:hover:enabled:bg-violet-700 md:h-10 md:px-5 xl:h-12 xl:px-7 rounded-md">Connect Your Wallet</WalletMultiButton>
            )}
            
          </div>
        )}
        {publicKey && !transactionId && (
          <div className='text-gray-200 text-center text-xs'>
            <div>{subMessage}</div>
          </div>
        )}
      </div>
    </>
  );
};

MintPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default MintPage;
