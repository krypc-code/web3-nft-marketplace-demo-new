import WalletConnect from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

export const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
    rpc: {
        80001: 'https://matic-mumbai.chainstacklabs.com"',
        80002:'https://polygon-amoy-dev-node.krypcore.com/api/v0/rpc?apiKey=32ab4479-75d4-4eb7-a5b6-a453e12bf0df&token=98275b26-ec32-48a9-acc2-ff079d9d32c3',
          },
      appName: "Web 3 Modal Demo", // Required
    }
  },
  walletconnect: {
    package: WalletConnect, // required
    options: {

        rpc: {
        80001: 'https://matic-mumbai.chainstacklabs.com"',
        80002:'https://polygon-amoy-dev-node.krypcore.com/api/v0/rpc?apiKey=32ab4479-75d4-4eb7-a5b6-a453e12bf0df&token=98275b26-ec32-48a9-acc2-ff079d9d32c3',
              },
              appName: "Web 3 Modal Demo", // Required
    }
  }
};
