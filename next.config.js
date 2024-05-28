module.exports = {
  reactStrictMode: true,
  env: {
    IPFS_HTTP_CLIENT : process.env.IPFS_HTTP_CLIENT,
    LOCAL_GATEWAY : process.env.LOCAL_GATEWAY,
    IPFS_GATEWAY : process.env.IPFS_GATEWAY,
    POLYGON_RPC_URL : process.env.POLYGON_RPC_URL
  }
}