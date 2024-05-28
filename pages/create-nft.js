import { useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import { providerOptions } from "./providerOptions";
import { networkParams } from './networks';
import { toHex, truncateAddress } from "./utils";
import Web3Modal from 'web3modal'


// const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
const client = ipfsHttpClient(new URL(process.env.NEXT_PUBLIC_IPFS_HTTP_CLIENT))


import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [viewUrl, setViewUrl] = useState(null)
  const [imgCid, setimgCid] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const [walletText, setWalletText] = useState('Connect Wallet')
  const [library, setLibrary] = useState('')
  const [fileName, setFileName] = useState('');
  const router = useRouter()
  console.log(fileName)

  // useEffect(() => {
  //   connectWallet()
  // }, [])

  async function onChange(e) {
    const file = e.target.files[0]
    setFileName(file)
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      // alert("File uploaded to ipfs with cid: " + added.path)
      setimgCid(added.path)
      const url = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${added.path}`
      const localviewurl = `${process.env.NEXT_PUBLIC_LOCAL_GATEWAY}/ipfs/${added.path}`
      setFileUrl(url)
      setViewUrl(localviewurl)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  async function uploadToIPFS() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${added.path}`
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
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
    setWalletText("Connected: " + croppedAddress)
    const network = await provider.getNetwork()
    console.log("Network chain id is " + network.chainId)
    // if(network.chainId!=80001){
    //   await switchNetwork(80001)
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
    } catch (switchError) {
      console.error(switchError)
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[toHex(network)]]
          });
        } catch (err) {
          console.error(err)
        }
      }
    }
  };

  async function listNFTForSale() {
    const url = await uploadToIPFS()
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    connectWallet()

    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    let transaction = await contract.createToken(url, price, { value: listingPrice })
    await transaction.wait()
   
    router.push('/')
  }

  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    
    <div className="flex justify-center">
      <div className="md:w-1/2 sm:w-3/4 flex flex-col pb-12">
        <div style={{textAlign:"right", marginTop:"50px"}}>
      <button style={{backgroundColor:"black", width:"230px", padding:"20px", borderRadius:"10px", color:"white", fontSize:"large"}} onClick={connectWallet}> {walletText} </button>
        </div>
      <h1 style={{fontSize:"30px", fontWeight:"bold", marginTop:"50px"}}>Mint your NFT</h1>
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Matic"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
          <div className="my-4 flex ">
          <input
            type="file"
            name="Asset"
            id="fileInput"
            className="hidden"
            onChange={onChange}
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upload File
          </label>
          {fileName && (
            <p className="mt-2 ml-2 text-sm text-gray-700">
              Selected file: {fileName.name}
            </p>
          )}
        </div>
        {/* <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        /> */}
        {
          fileUrl && imgCid && (
            <>
            <h5>Metadata IPFS URL: <a href={fileUrl}><u>{fileUrl}</u></a></h5>
            <img className="rounded mt-4" width="350" src={viewUrl} />
            </>
          )
        }
        <button onClick={listNFTForSale} className="font-bold mt-4 bg-blue-700 text-white rounded p-4 shadow-lg">
          Create and List NFT
        </button>
      </div>
    </div>
  )
}