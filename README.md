<img alt="SignHash Logomark" src="https://raw.githubusercontent.com/SignHash/signhash-graphics/master/logomark/signhash-logomark-large.png" width="100">

# SignHash Ethereum Smart Contracts

[![Codeship](https://img.shields.io/codeship/b2775490-8e71-0135-ad13-029922ea22f6/master.svg)](https://app.codeship.com/projects/249795)

The repository contains Ethereum Smart Contracts implementing core SignHash functionality, identity management and donations.
You can read more about SignHash project in the [whitepaper](https://github.com/signhash/signhash-whitepaper).

## Getting started

The project uses NPM and [Truffle Framework](http://truffleframework.com).

Contracts are written in Solidity. Everything else (migrations, tests, scripts) is written in TypeScript.

Contracts code resides in [contracts directory](https://github.com/SignHash/signhash-contracts/tree/master/contracts).

You can find compiled ABI and network addresses in [build directory](https://github.com/SignHash/signhash-contracts/tree/master/build/contracts).

## Developing

Clone repository and install dependencies

```shell
git clone https://github.com/SignHash/signhash-contracts.git
cd signhash-contracts
npm install
```

### Building

Compile contracts

```shell
npm run compile
```

Run tests

```shell
npm test
```

Run linters

```shell
npm run lint
```

### Deploying / Publishing

Run migrations on testrpc

```shell
npm run migrate
```

Setup testrpc with deployed contracts

```shell
npm run seed
```

## Configuration

Configuration is documented in [Truffle docs](http://truffleframework.com/docs/advanced/configuration).

## Contributing

Significant changes to SignHash smart contracts, architecture or functionality should be proposed in the [proposals repository](https://github.com/SignHash/signhash-proposals).

Please follow [tslint](https://github.com/SignHash/signhash-contracts/blob/master/tslint.json) and [solhint](https://github.com/SignHash/signhash-contracts/blob/master/.solhint.json) configurations.
TypeScript code is auto-formatted in git pre-commit hook and follow [prettier configuration](https://github.com/SignHash/signhash-contracts/blob/master/.prettierrc).

## Licensing

The code in this project is licensed under the MIT license.
