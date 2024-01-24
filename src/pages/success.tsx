import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import useSWR from 'swr';
import { TESTNET3_API_URL, getAleoTransactionsForProgram, getBaseURI, getHeight, getJSON, getMintBlock, getNFTs, getSettingsStatus, getTransactionsCount } from '@/aleo/rpc';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { ThreeCircles } from 'react-loader-spinner';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';

const SuccessPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const router = useRouter();
  let { transactionId, nextTokenId } = router.query; // Access transactionId from query

  let [nftImage, setNFTImage] = useState<string | undefined>();
  let [status, setStatus] = useState<string>('Completed');
  let [finalized, setFinzalized] = useState<boolean>(false);

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
    console.log(status);

    if (status === 'Finalized') {
      clearInterval(intervalId);
      setFinzalized(true);
      // const ascii = asciiBinaryToString(convertU128ToBinary(nextTokenId as string));
      const ascii = '00000000012.json';
      const baseUri = await getBaseURI(TESTNET3_API_URL);
      const nftData = await getJSON(`https://${baseUri}${ascii}`);
      setNFTImage(nftData.image);
    }
    
    setStatus(status);
  };

  const title = finalized ? 'Your NFT has been minted!' : 'Finalizing Private Mint';
  return (
    <>
      <NextSeo
        title="Leo Wallet | Mint NFTs"
        description="Mint an NFT using the Leo Wallet"
      />
      <div className="mx-auto max-w-md px-4 sm:px-6 sm:pt-4 lg:px-8 xl:px-10 2xl:px-0">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.svg" alt="Leo Wallet Logo" className="h-5 w-5 mr-2" />
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
        {!publicKey && (
          <div className='flex justify-center my-8'>
            <WalletMultiButton startIcon={undefined} className="font-medium text-xl shadow-card dark:bg-violet-500 dark:hover:enabled:bg-violet-700 md:h-10 md:px-5 xl:h-12 xl:px-7 rounded-md">Connect Your Wallet</WalletMultiButton>
          </div>
        )}
        {(!finalized && publicKey &&
          <>
            <div className='flex justify-center my-8'>
              <ThreeCircles
                visible={true}
                height="80"
                width="80"
                color="#634CFF"
                ariaLabel="three-circles-loading"
                wrapperStyle={{}}
                wrapperClass=""
                />
            </div>
            <div className='text-gray-200 text-center text-xs'>
              This may take a few minutes...
            </div>
          </>
        )}
        {(finalized && publicKey &&
          <>
            <div className='text-white text-center text-xs pb-4'>
                Your minted NFT
            </div>
            <div className="w-full flex flex-col mx-auto">
              <img className="rounded-lg mb-8" src={nftImage} />
              <a href={process.env.URL}
                className="font-medium text-xl flex items-center justify-center shadow-card dark:bg-gray-800 dark:hover:enabled:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7 rounded-md"
              >
                <span>Link to Privacy Pride</span>
              </a>
            </div>
            
          </>
        )}
      </div>
    </>
  );
};

SuccessPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default SuccessPage;
