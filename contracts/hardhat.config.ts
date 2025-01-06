import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  zksolc: {
    version: "1.3.13",
    settings: {
      isSystem: true,
    }
  },
  defaultNetwork: "lensTestnet",
  networks: {
    lensTestnet: {
      url: "https://rpc.testnet.lens.dev",
      ethNetwork: "sepolia",
      zksync: true,
      accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : [],
    },
    hardhat: {
      zksync: true
    }
  }
};

export default config;
