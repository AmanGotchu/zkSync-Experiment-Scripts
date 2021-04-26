import * as zksync from "zksync";
import { Wallet, wallet } from "zksync";
import * as ethers from "ethers";
import { Command } from 'commander';

console.log("Sync provider")
const syncProvider = await zksync.Provider.newHttpProvider("http://localhost:3030/jsrpc");
// const syncProvider = await zksync.getDefaultProvider("rinkeby")
console.log(syncProvider)
const ethersProvider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
// const ethersProvider = new ethers.getDefaultProvider("rinkeby")
const blockNum = await ethersProvider.getBlockNumber()
console.log(blockNum)
console.log(ethersProvider)

// Rinkeby Metamask private keys
let privKey = "e1ae619158d9a042610357a78dac102002fae3ea09eb07033df69ef8fa39e938" // Account has 3 eth
let privKey2 = "148e8bf6273392d7040075a1938077c36fe26a01b6a3d7398748428d7a4ca323" // Account has 0 eth

const ethWallet = new ethers.Wallet(privKey, ethersProvider);
const ethWallet2 = new ethers.Wallet(privKey2, ethersProvider);

const balanceOne = await ethWallet.getBalance()
const balanceTwo = await ethWallet2.getBalance()
console.log("Wallet 1: ", balanceOne.toString())
console.log("Wallet 2: ", balanceTwo.toString())

const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);
const syncWallet2 = await zksync.Wallet.fromEthSigner(ethWallet2, syncProvider)
const syncBalanceOne = await syncWallet.getBalance("ETH")
const syncBalanceTwo = await syncWallet2.getBalance("ETH")

console.log("Sync Wallet 1: ", syncBalanceOne.toString())
console.log("Sync Wallet 2: ", syncBalanceTwo.toString())

if (!(await syncWallet.isSigningKeySet())) {
    if ((await syncWallet.getAccountId()) == undefined) {
        throw new Error("Unknown account");
    }

    const changePubkey = await syncWallet.setSigningKey({
        feeToken: "ETH",
        ethAuthType: "ECDSA",
    });

    // Wait until the tx is committed
    await changePubkey.awaitReceipt();
}

const amount = zksync.utils.closestPackableTransactionAmount(ethers.utils.parseEther("0.001"));
var transfer;
// Transfer Count 1000

var transferCount = 20;
console.log("Transfer Count Total: ", transferCount)
var time_aggregate = 0;

var currentBlock = 0
let blockMap = new Map()

for (let i = 0; i < transferCount; i++) {
    console.log("Transfer count: ", i)
    const startTime = Date.now();
    transfer = await syncWallet.syncTransfer({
        to: syncWallet2.address(),
        token: "ETH",
        amount: ethers.utils.parseEther("0.001"),
    });

    const transferReceipt = await transfer.awaitReceipt();
    const blockNumber = transferReceipt.block.blockNumber

    if(currentBlock == 0 || currentBlock != blockNumber) {
        currentBlock = blockNumber
        blockMap.set(currentBlock, [])
        console.log(currentBlock)
    }

    blockMap.get(currentBlock).push({trans: transfer, time: startTime})
}

blockMap.forEach((values, blockNum) => {
    console.log("Transaction size: ", values.length)
    var blockVerificationTimeTotal = 0;
    Promise.all(values.map((transaction) => transaction.trans.awaitVerifyReceipt())).then((values) => {
        const verifyTime = Date.now()

        blockMap[blockNum].map((transaction) => {
            blockVerificationTimeTotal += (verifyTime-transaction.time)
        })
        console.log("Block Verification Time Total: ", blockVerificationTimeTotal)
        console.log("# of transactions: ", values.length)
    }).catch((err) => {
        console.log("Error: ", err)
    })
})