import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { toHex, truncateAddress } from "./utils";
import axios from 'axios'
import Web3Modal from 'web3modal'
import '../styles/Home.module.css'

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'
import Loader from './Loader';

export default function Home() {
  const [nfts, setNfts] = useState([])
  // console.log(nfts)
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_POLYGON_RPC_URL)
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider)
    console.log(contract)
    const data = await contract.fetchMarketItems()
    
    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      
      const tokenUri = await contract.tokenURI(i.tokenId)
      console.log(tokenUri)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        tokenUri
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const balance = await provider.getBalance(signer.getAddress())
    const balanceinEth = ethers.utils.formatEther(balance) 

    console.log("Balance is: ", balanceinEth)
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')  
    const priceinEth = ethers.utils.formatEther(price) 
    if(balanceinEth<=priceinEth){
      alert("Insufficient balance")
      return;
    }
    console.log(price)
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }

  function generateSellerLink(addr) {
    return "https://mumbai.polygonscan.com/address/" + addr;
  }


  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
    <div>
      {loadingState=='not-loaded'?
      <Loader/>
   :
    <div className="px-4" style={{ maxWidth: '1600px' }}>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      {
        nfts.map((nft, i) => (
          <div key={i} className="border bg-gray-200 shadow rounded-xl overflow-hidden">
            <div className="p-4 flex justify-center">
            <img style={{ height: '210px' }} className='rounded' src={nft.image} />
            </div>
            <div className="p-4">
              <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
              <div style={{ height: '60px', overflow: 'hidden' }}>
                <p className="text font-semibold">{nft.description}</p>
                <p className="text font-semibold">Seller: <a href={generateSellerLink(nft.seller)}>{truncateAddress(nft.seller)}</a></p>
              </div>
            </div>
            <div className="p-4 bg-black">
              <p className="text-2xl font-bold text-white">{nft.price} MATIC</p>
              <button className="mt-4 w-full bg-blue-700 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
            </div>
          </div>
        ))
      }
    </div>
  </div>
      }
      
    </div>
  )
}