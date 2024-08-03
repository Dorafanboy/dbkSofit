import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import readline from 'readline';
import { printError, printInfo, printSuccess } from './data/logger/logPrinter';
import { delay } from './data/helpers/delayer';
import { CheckDBKGenesisNFT, Config, DepositToDBKConfig, MintDBKGenesisNftConfig } from './config';
import path from 'path';
import { depositETH } from './core/depositETH/depositETH';
import { mintDBKGenesis } from './core/mint/mint';
import { checkNFTAmount } from './core/check/check';

let account;

const privateKeysFilePath = path.join(__dirname, 'assets', 'private_keys.txt');

const privateKeysPath = fs.createReadStream(privateKeysFilePath);

async function main() {
    const rl = readline.createInterface({
        input: privateKeysPath,
        crlfDelay: Infinity,
    });

    let index = 0;

    const data = fs.readFileSync(privateKeysFilePath, 'utf8');

    const count = data.split('\n').length;

    for await (const line of rl) {
        try {
            if (line == '') {
                printError(`Ошибка, пустая строка в файле private_keys.txt`);
                return;
            }

            if (Config.isShuffleWallets) {
                printInfo(`Произвожу перемешивание только кошельков.`);
                await shuffleData();

                printSuccess(`Кошельки успешно перемешаны.\n`);
            }

            account = privateKeyToAccount(<`0x${string}`>line);
            printInfo(`Start [${index + 1}/${count} - ${account.address}]\n`);

            if (DepositToDBKConfig.isUse) {
                const result = await depositETH(account);

                if (result == true) {
                    await delay(
                        DepositToDBKConfig.delayBeforeMint.minRange,
                        DepositToDBKConfig.delayBeforeMint.maxRange,
                        true,
                    );
                } else {
                    await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
                }
            }

            if (MintDBKGenesisNftConfig.isUse) {
                await mintDBKGenesis(account);
            }

            if (CheckDBKGenesisNFT.isCheckNFTAmount) {
                await checkNFTAmount(account.address);
            }

            printSuccess(`Ended [${index + 1}/${count} - ${account.address}]\n`);

            fs.appendFile('src/assets/completed_accounts.txt', `${line}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;

            if (index == count) {
                printSuccess(`Все аккаунты отработаны`);
                rl.close();
                return;
            }

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
        } catch (e) {
            printError(`Произошла ошибка при обработке строки: ${e}\n`);

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
            fs.appendFile('src/assets/uncompleted_accounts.txt', `${line}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;
        }
    }
}

async function shuffleData() {
    try {
        const data1 = fs.readFileSync(privateKeysFilePath, 'utf8');
        const lines1 = data1.split('\n');

        for (let i = lines1.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines1[i], lines1[j]] = [lines1[j], lines1[i]];
        }

        await fs.writeFileSync(privateKeysFilePath, lines1.join('\n'), 'utf8');
    } catch (error) {
        printError(`Произошла ошибка во время перемешивания данных: ${error}`);
    }
}

main();
