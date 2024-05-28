import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import { providerOptions } from "./providerOptions";
import { networkParams } from './networks';
import { toHex, truncateAddress } from "./utils";
import { useRouter } from 'next/router'


import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    connectWallet()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    const data = await contract.fetchItemsListed()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
      }
      return item
    }))

    setNfts(items)
    setLoadingState('loaded') 
  }

  async function delistNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
  
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)

    const transaction = await contract.delistNFT(nft.tokenId)
    await transaction.wait()
    loadNFTs()
  }

  async function connectWallet() {
    const web3Modal = new Web3Modal({
      network: "mumbai",
      providerOptions // required
    });    
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    console.log("Provider", provider)
    const signer = provider.getSigner()
    const account = await signer.getAddress()
    const croppedAddress = account.substring(0,6) + "..." + account.substring(account.length-4, account.length);
    // setWalletText("Connected: " + croppedAddress)
    const network = await provider.getNetwork()
    console.log("Network chain id is " + network.chainId)
    loadNFTs()
    // if(network.chainId!=80001){
    //   await switchNetwork(80001)
    // }
    // else{
    //   loadNFTs()
    // }
  }


  const switchNetwork = async (network) => {
    const web3Modal = new Web3Modal()  
    const connection = await web3Modal.connect()
    const library = new ethers.providers.Web3Provider(connection)
    try {
      console.log("Trying")
      console.log(network)
      console.log(toHex(network))
      console.log("library", library)
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(network) }]
      });
      window.location.reload()
    } catch (switchError) {
      console.error(switchError)
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[toHex(network)]]
          });
          window.location.reload()
        } catch (err) {
          console.error(err)
        }
      }
    }
  };

  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFTs listed</h1>)
  return (
    <div>

{loadingState=='not-loaded'?
      <div class="flex  flex-wrap justify-center p-4 md:p-60">
    <button disabled type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
<svg aria-hidden="true" role="status" class="inline mr-2 w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
</svg>
Loading...
</button>
</div>:

      <div className="p-4">
        <h2 className="text-2xl py-2">Items Listed</h2>
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border bg-gray-200 shadow rounded-xl overflow-hidden">
                <div className="p-4 flex justify-center">
                <img style={{ height: '210px' }} className='rounded' src={nft.image} />
                </div>
                <div className="p-4 bg-black">
                  <p className="text font-bold text-white">{nft.name}</p>
                  <p className="text-2xl font-bold text-white">Listed for {nft.price} MATIC</p>
                  <button className="mt-4 w-full bg-blue-700 text-white font-bold py-2 px-12 rounded" onClick={() => delistNft(nft)}>Delist NFT</button>
                </div>
              </div>
            ))
          }
        </div>
        </div>
      </div>}
    </div>
  )
}