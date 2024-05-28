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

export default function Home() {
  const [nfts, setNfts] = useState([])
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
    console.log(data)
    
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
      <div class="flex  flex-wrap justify-center p-4 md:p-60">
    <button disabled type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
<svg aria-hidden="true" role="status" class="inline mr-2 w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
</svg>
Loading...
</button>
</div>
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