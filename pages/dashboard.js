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
import Loader from './Loader';

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
      <Loader/>
      :

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