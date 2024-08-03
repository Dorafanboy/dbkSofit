import { createPublicClient, http } from 'viem';
import { printInfo } from '../../data/logger/logPrinter';
import { Config, dbk } from '../../config';
import { erc20ABI } from '../../abis/erc20';
import { checkModuleName } from './checkData';
import { mintDBKGenesisContractAddress } from '../mint/mintData';

export async function checkNFTAmount(address: string) {
    printInfo(`Выполняю модуль ${checkModuleName}`);

    const client = createPublicClient({
        chain: dbk,
        transport: Config.dbkRpc == null ? http() : http(Config.dbkRpc),
    });

    const nftAmount = await client.readContract({
        address: mintDBKGenesisContractAddress,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [<`0x${string}`>address],
    });

    printInfo(`На счету ${address} имеется ${nftAmount.toString()} NFT`);

    return true;
}
