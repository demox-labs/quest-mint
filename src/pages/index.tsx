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
import Button from '@/components/ui/button';
import MintCountdown from '@/components/mint/countdown';
import { getNextUnclaimedTokenId } from '@/utils/NextTokenIds';
import { useRouter } from 'next/router';

const enum MintStep {
  CONNECT = 'CONNECT YOUR WALLET',
  MINT = 'MINT YOUR NFT',
  WAIT = 'GET READY',
}

const DEFAULT_IMAGES = [
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/1.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/2.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/3.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/4.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/5.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/6.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/7.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/8.png'
]

const MintPage: NextPageWithLayout = () => {
  const { wallet, publicKey, requestRecords } = useWallet();
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
    setSubMessage('Privately mint your nft now.')
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

  let timeToMint = 0;
  if (height && mintBlock) {
    timeToMint = (mintBlock.block - height) * 15_000; // 15 seconds per block
  }

  let sliderImages = DEFAULT_IMAGES;

  return (
    <>
      <NextSeo
        title="Leo Wallet | Mint NFTs"
        description="Mint an NFT using the Leo Wallet"
      />
      <div className="mx-auto max-w-md px-4 mt-12 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-14 text-lg font-medium uppercase text-center tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl">
          JOIN THE PRIDE
        </h2>
        {timeToMint > 0 && (
          <div className='flex justify-center mb-6'>
            <MintCountdown date={Date.now() + timeToMint} />
          </div>
        )}
        <ImageSlider images={sliderImages} interval={5000} />
        {settingsNum !== undefined && (
          <div className='flex justify-center my-8'>
            <Button
              className="text-xl shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              size='large'
              disabled={!settings?.active || !publicKey || mintStep === MintStep.WAIT}
              onClick={() => handleButtonClick()}
            >
                {mintStep}
            </Button>
          </div>
        )}
        {transactionId && (
          <div className='text-white text-center'>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
        {publicKey && !transactionId && (
          <div className='text-white text-center'>
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
