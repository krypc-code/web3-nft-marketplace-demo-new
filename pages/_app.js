/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {

  const router = useRouter();

  const linkClass = (path) => {
    return router.pathname === path ? 'text-blue-700  mr-6' : 'text-gray-500 mr-6';
  };

  return (
    <div>
      <nav className="border-b p-6">
        <img style={{width:"100px"}} src="https://krypc.com/static/krypc_New/img/logo.svg" />
        <br/>
        <p className="text-4xl font-bold text-purple-500">NFT Marketplace</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className={linkClass('/')}>
              Home
            </a>
          </Link>
          <Link href="/create-nft">
            <a className={linkClass('/create-nft')}>
              List new NFT
            </a>
          </Link>
          <Link href="/my-nfts">
            <a className={linkClass('/my-nfts')}>
              My Owned NFTs
            </a>
          </Link>
          <Link href="/dashboard">
            <a className={linkClass('/dashboard')}>
              Manage Listed NFTs
            </a>
          </Link>
          {/* <Link href="/premint">
            <a className="mr-6  text-dark-500 ">
              Pre-mint NFT
            </a>
          </Link>
          <Link href="/customtoken">
            <a className="mr-6  text-dark-500 ">
              Custom Token
            </a>
          </Link>
          <Link href="/wrappedtoken">
            <a className="mr-6  text-dark-500 ">
              Wrapped Token
            </a>
          </Link> */}
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp