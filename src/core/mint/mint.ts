import { createPublicClient, createWalletClient, http, PrivateKeyAccount, SimulateContractReturnType } from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { Config, dbk, MintDBKGenesisNftConfig } from '../../config';
import { mintDBKGenesisContractAddress, mintDBKGenesisModuleName } from './mintData';
import { mintABI } from '../../abis/mint';
import { delay } from '../../data/helpers/delayer';

export async function mintDBKGenesis(account: PrivateKeyAccount) {
    const mintAmount = Math.floor(
        Math.random() * (MintDBKGenesisNftConfig.nftAmount.maxRange - MintDBKGenesisNftConfig.nftAmount.minRange) +
            MintDBKGenesisNftConfig.nftAmount.minRange,
    );

    printInfo(`Выполняю модуль ${mintDBKGenesisModuleName}, буду минтить ${mintAmount} NFT`);

    const client = createPublicClient({
        chain: dbk,
        transport: Config.dbkRpc == null ? http() : http(Config.dbkRpc),
    });

    const walletClient = createWalletClient({
        chain: dbk,
        transport: Config.dbkRpc == null ? http() : http(Config.dbkRpc),
    });

    for (let i = 0; i < mintAmount; i++) {
        printInfo(`Буду производить Mint DBKGenesis NFT [${i + 1} / ${mintAmount}]`);

        const { request } = await client
            .simulateContract({
                address: mintDBKGenesisContractAddress,
                abi: mintABI,
                functionName: 'mint',
                account: account,
            })
            .then((result) => result as SimulateContractReturnType)
            .catch((e) => {
                printError(`Произошла ошибка во время выполнения модуля ${mintDBKGenesisModuleName} ${e}`);
                return { request: undefined };
            });

        if (request !== undefined) {
            const hash = await walletClient.writeContract(request).catch((e) => {
                printError(`Произошла ошибка во время выполнения модуля ${mintDBKGenesisModuleName} ${e}`);
                return false;
            });

            if (hash == false) {
                return false;
            }

            const url = `${dbk.blockExplorers?.default.url + 'tx/' + hash}`;

            printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

            await delay(
                MintDBKGenesisNftConfig.delayBetweenMint.minRange,
                MintDBKGenesisNftConfig.delayBetweenMint.maxRange,
                true,
            );
        }
    }

    return true;
}
