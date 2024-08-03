import {
    createPublicClient,
    createWalletClient,
    formatEther,
    formatUnits,
    http,
    parseEther,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { Config, dbk, DepositToDBKConfig } from '../../config';
import { getValue } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';
import { mainnet } from 'viem/chains';
import { depositETHContractAddress, depositETHModuleName, gasLimit } from './depositETHData';
import { depositETHABI } from '../../abis/depositETH';
import { checkGwei } from '../../data/helpers/gweiChecker';

export async function depositETH(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${depositETHModuleName}`);

    const dbkClient = createPublicClient({
        chain: dbk,
        transport: Config.dbkRpc == null ? http() : http(Config.dbkRpc),
    });

    const dbkChainETHBalance = await dbkClient.getBalance({
        address: account.address,
    });

    if (dbkChainETHBalance > parseEther(DepositToDBKConfig.minEthBridgeAmount.toString())) {
        printInfo(
            `Текущий баланс ETH в DBK Chain равен ${formatEther(dbkChainETHBalance)}, что больше чем необходимое число в конфиге ${DepositToDBKConfig.minEthBridgeAmount} (DepositToDBKConfig minEthBridgeAmount)`,
        );
        return false;
    }

    const client = createPublicClient({
        chain: mainnet,
        transport: Config.ethereumRpc == null ? http() : http(Config.ethereumRpc),
    });

    const walletClient = createWalletClient({
        chain: mainnet,
        transport: Config.ethereumRpc == null ? http() : http(Config.ethereumRpc),
    });

    let currentTry: number = 0,
        value = BigInt(0);

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(
                `Не нашел баланс для ${depositETHModuleName}. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        value = await getValue(
            client,
            account.address,
            DepositToDBKConfig.ethBridgeAmount.range,
            DepositToDBKConfig.ethBridgeAmount.fixed,
            true,
        );

        printInfo(`Пытаюсь произвести deposit ${formatUnits(value, 18)} ETH`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    await checkGwei();

    printInfo(`Буду производить deposit ${formatUnits(value, 18)} ETH`);

    const { request } = await client
        .simulateContract({
            address: depositETHContractAddress,
            abi: depositETHABI,
            functionName: 'depositTransaction',
            value: value,
            account: account,
            args: [account.address, value, gasLimit, false, ''],
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${depositETHModuleName} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${depositETHModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${mainnet.blockExplorers?.default.url + '/tx/' + hash}`;

        const transaction = await client
            .waitForTransactionReceipt({ hash: <`0x${string}`>hash })
            .then((result) => printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`))
            .catch((e) => {
                printError(`Произошла ошибка во время выполнения модуля ${depositETHModuleName} - ${e}`);
                return { request: undefined };
            });

        return true;
    }

    return false;
}
