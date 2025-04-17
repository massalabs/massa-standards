# Massa Standard Definition

Welcome to the Massa Standard Definition project!

This project aims to establish a common set of standards for the Massa blockchain ecosystem. The standards defined here will help to promote interoperability and ease of use for Massa-based applications and services.

If you're interested in learning more about Massa and its capabilities, check out the following resources:

- [Massa website](https://massa.net): This is the official website for the Massa blockchain. Here, you can learn more about Massa's features and use cases, as well as explore the Massa ecosystem and community.
- [Massa documentation](https://docs.massa.net/): This is the official documentation for Massa. Here, you can find detailed guides and tutorials for developing on the Massa blockchain, as well as API reference documentation for the Massa SDK and other tools.

## Fungible Token

The [Fungible Token standard implementation](smart-contracts/assembly/contracts/MRC20) defines a common set of rules for creating and managing Massa-based tokens that are fungible (i.e. interchangeable).

This is MassaLabs implementation of [the ERC20](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/).

## Non-Fungible Token

The [Non-Fungible Token standard implementation](smart-contracts/assembly/contracts/MRC721) defines a common set of rules for creating and managing Massa-based tokens that are non-fungible (i.e. unique).

This is MassaLabs implementation of [the ERC721](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/).

## Massa Domain Name Service

The [Massa Domain Name Service standard](smart-contracts/assembly/contracts/dns/dns.ts) defines a common set of rules for creating and managing Massa-based domain names.

This is MassaLabs implementation of [the ENS](https://docs.ens.domains/).

## MRC1155 Token

The [MRC1155](smart-contracts/assembly/contracts/MRC1155/token.ts) standard defines a common set of rules for creating and managing Massa-based tokens that can represent multiple types of assets, both fungible and non-fungible, within a single contract.

This is MassaLabs implementation of [the ERC1155](https://eips.ethereum.org/EIPS/eip-1155).

## Contract utils

### Deployer

The [Deployer smart contract](smart-contracts/assembly/contracts/deployer/deployer.ts) automates the deployment of multiple smart contracts in a single operation. It retrieves the necessary information (bytecode, constructor arguments, and coins) from the operation datastore, deploys the contracts, and calls their constructor functions if available.

This utility simplifies the process of deploying and initializing multiple smart contracts in a single transaction and allow to call a constructor function in the deployed contract(s).

For more details, refer to the [Deployer Documentation](smart-contracts/assembly/contracts/deployer/README.md).

### Ownable

The [Ownable standard implementation](smart-contracts/assembly/contracts/utils/ownership.ts) defines a common set of rules for ownership management of Massa-based contracts. It provides basic authorization control functions, simplifying the implementation of user permissions.

This is MassaLabs implementation of [the Ownable pattern](https://docs.openzeppelin.com/contracts/4.x/access-control#ownership-and-ownable).

### Role-Based Access Control

The [Role-Based Access Control standard implementation](smart-contracts/assembly/contracts/utils/accessControl.ts) defines a common set of rules for managing permissions using roles. It allows for the assignment of specific permissions to different roles, which can then be granted to users or other entities.

This is MassaLabs implementation of [the RBAC pattern](https://docs.openzeppelin.com/contracts/4.x/access-control#role-based-access-control).

## Massa Units

The [Massa Units standard](units.md) defines a set of common units of measurement for use on the Massa blockchain.

These units include:

- Massa coin
- Gas
- Rolls

## DApps <> Wallet Provider Communication

The [DApps <> Wallet Provider Communication standard](wallet/dapps-communication.md) defines a common interface for communication between Massa-based decentralized applications (DApps) and wallet providers.

This standard aims to simplify the process of integrating Massa-based DApps with various wallet providers, making it easier for end-users to access and use these applications.

## Contributing

To contribute to the Massa Standard Definition project, please refer to the document [contributing](CONTRIBUTING.md).

## License

This project is licensed under the MIT license. For more information, please refer to the [LICENSE file](LICENCE).
