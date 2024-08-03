import { IBridgeRange, IDelayRange, IFixedRange } from './data/utils/interfaces';
import { defineChain } from 'viem';

export class Config {
    public static readonly isShuffleWallets: boolean = false; // перемешивать ли строки в текстовом файле для приватных ключей
    public static readonly maxGwei = 3; // до какого гвея будет использоваться скрипт
    public static readonly delayBetweenGweiCheck: IDelayRange = { minRange: 0.3, maxRange: 1 }; // задержка перед получением нового гвея (в минутах)
    public static readonly retryCount: number = 15; // сколько попыток будет, чтобы получить новую сеть, значение для бриджа
    public static readonly delayBetweenAction: IDelayRange = { minRange: 2.2, maxRange: 4 }; // задержка между действиями (в секундах) в случае ошибки
    public static readonly delayBetweenAccounts: IDelayRange = { minRange: 37, maxRange: 45 }; // задержка между аккаунтами (в минутах)
    public static readonly ethereumRpc = 'https://rpc.ankr.com/eth'; // RPC для Ethereum
    public static readonly dbkRpc = 'https://rpc.mainnet.dbkchain.io'; // RPC для DBK Chain
}

export const dbk = defineChain({
    id: 20240603,
    name: 'DBK Chain',
    network: 'dbk',
    nativeCurrency: {
        decimals: 18,
        name: 'DBK',
        symbol: 'DBK',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.mainnet.dbkchain.io'],
        },
        public: {
            http: ['https://rpc.mainnet.dbkchain.io'],
        },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://scan.dbkchain.io/' },
    },
});

export class DepositToDBKConfig {
    public static readonly isUse: boolean = false; // использовать ли депозит в DBK Chain
    public static readonly minEthBridgeAmount: number = 0.000001; // ниже какого баланса не надо пополнять баланс в DBK Chain,
    public static readonly ethBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.00003, maxRange: 0.0001 },
        fixed: { minRange: 6, maxRange: 8 },
    }; // сколько депозитить eth в DBK, fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
    public static readonly delayBeforeMint: IDelayRange = { minRange: 0.5, maxRange: 1.5 }; // задержка перед минтами после пополения баланса в DBK Chain
}

export class MintDBKGenesisNftConfig {
    public static readonly isUse: boolean = false; // минтить нфт в DBK Chain
    public static readonly nftAmount: IBridgeRange = {
        minRange: 4,
        maxRange: 15,
    }; // сколкьо минтить нфт
    public static readonly delayBetweenMint: IDelayRange = { minRange: 1.5, maxRange: 3.5 }; // задержка между минтами
}

export class CheckDBKGenesisNFT {
    public static readonly isCheckNFTAmount: boolean = true; // смотреть ли количество нфт на кошельке
}
