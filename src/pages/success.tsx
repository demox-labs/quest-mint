import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import useSWR from 'swr';
import { TESTNET3_API_URL, getAleoTransactionsForProgram, getBaseURI, getHeight, getJSON, getMintBlock, getNFTs, getSettingsStatus, getTransactionsCount } from '@/aleo/rpc';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { getSettingsFromNumber } from '@/lib/util';
import { random } from 'lodash';
import { NextSeo } from 'next-seo';
import { ImageSlider } from '@/components/ui/image-slider';
import Button from '@/components/ui/button';
import { getLastMintedTokenIds, getNextUnclaimedTokenId, getU128FutureFromAleoTransaction } from '@/utils/NextTokenIds';
import { asciiBinaryToString, convertU128ToBinary } from '@/utils/AsciiConverter';
import { useRouter } from 'next/router';

const DEFAULT_IMAGES = [
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/1.png'
];

const SuccessPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const router = useRouter();
  let { transactionId, nextTokenId } = router.query; // Access transactionId from query

  let [nftImage, setNFTImage] = useState<string | undefined>();
  let [status, setStatus] = useState<string>('Completed');

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId as string, intervalId);
      }, 1000);
    }

  }, [transactionId, publicKey]);

  const getTransactionStatus = async (txId: string, intervalId: any) => {
    let status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);

    if (status === 'Finalized') {
      clearInterval(intervalId);
      const ascii = asciiBinaryToString(convertU128ToBinary(nextTokenId as string));
      const baseUri = await getBaseURI(TESTNET3_API_URL);
      const nftData = await getJSON(`https://${baseUri}${ascii}`);
      setNFTImage(nftData.image);
    }
    
    status = status === 'Completed' ? 'Submitted & Finalizing' : status;
    setStatus(status);
  };

  let sliderImages = DEFAULT_IMAGES;
  if (nftImage) {
    sliderImages = [nftImage];
  }

  const title = status === 'Finalized' ? 'Your NFT has been minted!' : 'Finalizing Private Mint';
  return (
    <>
      <NextSeo
        title="Leo Wallet | Mint NFTs"
        description="Mint an NFT using the Leo Wallet"
      />
      <div className="mx-auto max-w-md px-4 mt-12 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-14 text-lg font-medium uppercase text-center tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl">
          {title}
        </h2>
        <ImageSlider images={sliderImages} interval={5000} />
        {transactionId && (
          <div className='text-white text-center'>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
      </div>
    </>
  );
};

SuccessPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default SuccessPage;
