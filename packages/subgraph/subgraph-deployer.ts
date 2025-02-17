import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env"
});

import subgraphConfig from "./config/subgraph-config.json";

type DeploySettings = {
  GITHUB_USERNAME?: string;
  SUBGRAPH_NAME_OR_SLUG: string;
};

type YAMLSettings = {
  daoFactoryAddress: string;
  daoFactoryStartBlock: number;
  couponOnboardingAddress?: string | undefined;
  couponOnboardingStartBlock?: number | undefined;
  network: string;
};

type SubgraphSettings = DeploySettings & YAMLSettings;

// Execute Child Processes
const srcDir = path.join(__dirname);
export const exec = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

const getYAML = ({
  daoFactoryAddress,
  daoFactoryStartBlock,
  couponOnboardingAddress,
  couponOnboardingStartBlock,
  network,
}: YAMLSettings): string => {
  return ` 
  specVersion: 0.0.2
  description: Tribute DAO Framework Subgraph
  repository: https://github.com/openlawteam/tribute-contracts
  schema:
    file: ./schema.graphql
  dataSources:
    # ====================================== DaoFactory ====================================
    - kind: ethereum/contract
      name: DaoFactory
      network: ${network}
      source:
        address: "${daoFactoryAddress}"
        abi: DaoFactory
        startBlock: ${daoFactoryStartBlock}
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - TributeDao
        abis:
          - name: DaoFactory
            file: ./contracts/DaoFactory.json
        eventHandlers:
          - event: DAOCreated(address,string)
            handler: handleDaoCreated
        file: ./mappings/core/dao-factory-mapping.ts

${couponOnboardingYAML({
    network,
    couponOnboardingAddress,
    couponOnboardingStartBlock,
  })}

  templates:
    # ====================================== DaoRegistry ====================================
    - kind: ethereum/contract
      name: DaoRegistry
      network: ${network}
      source:
        abi: DaoRegistry
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - Adapter
          - Extension
          - Proposal
          - Member
          - Vote
        abis:
          - name: DaoRegistry
            file: ./contracts/DaoRegistry.json
          - name: OnboardingContract
            file: ./contracts/OnboardingContract.json
          - name: DistributeContract
            file: ./contracts/DistributeContract.json
          - name: TributeContract
            file: ./contracts/TributeContract.json
          - name: TributeNFTContract
            file: ./contracts/TributeNFTContract.json
          - name: ManagingContract
            file: ./contracts/ManagingContract.json
          - name: GuildKickContract
            file: ./contracts/GuildKickContract.json
          - name: FinancingContract
            file: ./contracts/FinancingContract.json
          - name: OffchainVotingContract
            file: ./contracts/OffchainVotingContract.json
          - name: VotingContract
            file: ./contracts/VotingContract.json
          - name: IVoting
            file: ./contracts/IVoting.json
          - name: ERC20Extension
            file: ./contracts/ERC20Extension.json
        eventHandlers:
          - event: SubmittedProposal(bytes32,uint256)
            handler: handleSubmittedProposal
          - event: SponsoredProposal(bytes32,uint256,address)
            handler: handleSponsoredProposal
          - event: ProcessedProposal(bytes32,uint256)
            handler: handleProcessedProposal
          - event: AdapterAdded(bytes32,address,uint256)
            handler: handleAdapterAdded
          - event: AdapterRemoved(bytes32)
            handler: handleAdapterRemoved
          - event: ExtensionAdded(bytes32,address)
            handler: handleExtensionAdded
          - event: ExtensionRemoved(bytes32)
            handler: handleExtensionRemoved
          - event: UpdateDelegateKey(address,address)
            handler: handleUpdateDelegateKey
          - event: ConfigurationUpdated(bytes32,uint256)
            handler: handleConfigurationUpdated
          - event: AddressConfigurationUpdated(bytes32,address)
            handler: handleAddressConfigurationUpdated
        file: ./mappings/core/dao-registry-mapping.ts
    # ====================================== BankExtension ====================================
    - kind: ethereum/contract
      name: BankExtension
      network: ${network}
      source:
        abi: BankExtension
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - TokenHolder
          - Token
          - Member
        abis:
          - name: BankExtension
            file: ./contracts/BankExtension.json
          - name: ERC20
            file: ./contracts/ERC20.json
          - name: ERC20Extension
            file: ./contracts/ERC20Extension.json
        eventHandlers:
          - event: NewBalance(address,address,uint160)
            handler: handleNewBalance
          - event: Withdraw(address,address,uint160)
            handler: handleWithdraw
        file: ./mappings/extensions/bank-extension-mapping.ts
    # ====================================== NFTExtension ====================================
    - kind: ethereum/contract
      name: NFTExtension
      network: ${network}
      source:
        abi: NFTExtension
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - NFTCollection
          - NFT
        abis:
          - name: NFTExtension
            file: ./contracts/NFTExtension.json
        eventHandlers:
          - event: CollectedNFT(address,uint256)
            handler: handleCollectedNFT
          - event: TransferredNFT(address,uint256,address,address)
            handler: handleTransferredNFT
          - event: WithdrawnNFT(address,uint256,address)
            handler: handleWithdrawnNFT
        file: ./mappings/extensions/nft-extension-mapping.ts

        
`;
};

type CouponOnboardingYAML = {
  network: string;
  couponOnboardingAddress: string | undefined;
  couponOnboardingStartBlock: number | undefined;
};

function couponOnboardingYAML({
  network,
  couponOnboardingAddress,
  couponOnboardingStartBlock,
}: CouponOnboardingYAML) {
  if (!couponOnboardingAddress) return ``;

  return `
    # ====================================== Adapter: CouponOnboarding ====================================
    - kind: ethereum/contract
      name: CouponOnboarding
      network: ${network}
      source:
        address: "${couponOnboardingAddress}"
        abi: CouponOnboardingContract
        startBlock: ${couponOnboardingStartBlock}
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - Coupon
        abis:
          - name: CouponOnboardingContract
            file: ./contracts/CouponOnboardingContract.json
        eventHandlers:
          - event: CouponRedeemed(address,uint256,address,uint256)
            handler: handleCouponRedeemed
        file: ./mappings/adapters/coupon-onboarding-mapping.ts
  `;
}

(function () {
  // Compile the solidity contracts
  //console.log("📦 ### 1/3 Compiling the smart contracts...");
  //exec(`cd ../contracts && npx truffle compile`);

  // Create the graph code generation files
  console.log("📦 ### 2/3 Creating the graph scheme...");
  exec(`graph codegen`);

  // Building the graph scheme
  console.log("📦 ### 3/3 Building the graph scheme...");
  exec(`graph build`);

  console.log("📦 ### Build complete, preparing deployment...");

  let executedDeployments: number = 0;

  console.log(
    `==== READY TO DEPLOY ${subgraphConfig.length} SUBGRAPHS... ====
    
    `
  );

  subgraphConfig.forEach((subgraph: SubgraphSettings, index: number) => {
    console.log(`📦 ### DEPLOYMENT ${index + 1}/${subgraphConfig.length}...
    
    `);

    console.log("🛠 ### Preparing subgraph template for...");
    console.log(`
    GITHUB_USERNAME: ${subgraph.GITHUB_USERNAME || "n/a"}
    SUBGRAPH_NAME_OR_SLUG: ${subgraph.SUBGRAPH_NAME_OR_SLUG}
    Network: ${subgraph.network}
    Address: ${subgraph.daoFactoryAddress}
    Start Block: ${subgraph.daoFactoryStartBlock}
    `);

    subgraph.couponOnboardingAddress &&
      console.log(
        `CouponOnboarding: Address - ${subgraph.couponOnboardingAddress}, Start Block - ${subgraph.couponOnboardingStartBlock}`
      );

    // Write YAML file
    fs.writeFileSync(
      "subgraph.yaml",
      getYAML({
        daoFactoryAddress: subgraph.daoFactoryAddress,
        daoFactoryStartBlock: subgraph.daoFactoryStartBlock,
        couponOnboardingAddress: subgraph.couponOnboardingAddress,
        couponOnboardingStartBlock: subgraph.couponOnboardingStartBlock,
        network: subgraph.network,
      })
    );

    // Deploy subgraph <GITHUB_USERNAME/SUBGRAPH_NAME_OR_SLUG>
    console.log("🚗 ### Deploying subgraph...");

    exec(`graph auth --studio ${process.env.GRAPH_DEPLOYMENT_KEY}`);
    exec(`graph deploy --studio ${subgraph.SUBGRAPH_NAME_OR_SLUG}`);

    console.log("👏 ### Done.");

    // Increment deployment counter
    executedDeployments++;
  });

  console.log(`🎉 ### ${executedDeployments} Deployment(s) Successful!`);
})();
