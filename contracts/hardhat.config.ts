import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@matterlabs/hardhat-zksync";
import { HardhatUserConfig } from "hardhat/config";
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
    version: "1.5.8",
    settings: {
      enableEraVMExtensions: true
    }
  },
  networks: {
    hardhat: {
      zksync: false // Use regular hardhat network for testing
    },
    lensTestnet: {
      chainId: 37111,
      ethNetwork: "sepolia",
      url: "https://rpc.testnet.lens.dev",
      verifyURL:
        "https://block-explorer-verify.testnet.lens.dev/contract_verification",
      zksync: true,
    },
  }
};

export default config;
