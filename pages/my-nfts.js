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

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const router = useRouter()
  useEffect(() => {
    connectWallet()
  }, [])

  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketplaceContract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    const data = await marketplaceContract.fetchMyNFTs()

    const items = await Promise.all(data.map(async i => {
      const tokenURI = await marketplaceContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenURI)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        tokenURI
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  function listNFT(nft) {
    console.log('nft:', nft)
    router.push(`/resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`)
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


  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFTs owned</h1>)
  return (
    <div>
      
      <div   className="p-4" >
      {loadingState=='not-loaded'?
      <Loader/>
      :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border bg-gray-200 shadow rounded-xl overflow-hidden">
                <div className="p-4 flex justify-center">
                <img style={{ height: '210px' }} className='rounded' src={nft.image} />
                </div>
                <div className="p-4 bg-black">
                  <p className="text font-bold text-white">{nft.name}</p>
                  <p className="text-xl font-bold text-white">Purchase Price: {nft.price} Eth</p>
                  <button className="mt-4 w-full bg-blue-700 text-white font-bold py-2 px-12 rounded" onClick={() => listNFT(nft)}>List</button>
                  <button className="mt-4 w-full bg-blue-700 text-white font-bold py-2 px-12 rounded" onClick={() => {var openSeaLink = "https://testnets.opensea.io/assets/mumbai/" + marketplaceAddress.toLowerCase() + "/" + nft.tokenId;
                  window.location.href = openSeaLink
                }}>View NFT on Opensea</button>
                     <button className="mt-4 w-full bg-blue-700 text-white font-bold py-2 px-12 rounded" onClick={() => {var raribleLink = "https://testnet.rarible.com/token/polygon/" + marketplaceAddress.toLowerCase() + ":" + nft.tokenId + "?tab=overview";
                  window.location.href = raribleLink
                }}>View NFT on Rarible</button>
                </div>
              </div>
            ))
          }
        </div>}
      </div>
    </div>
  )
}