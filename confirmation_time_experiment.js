import * as zksync from "zksync";
import { Wallet, wallet } from "zksync";
import * as ethers from "ethers";
import { Command } from 'commander';
const program = new Command();
program
  .option('-s,--setup', 'setup 2 accounts')
  .option('-t,--transactions', 'send lots of transactions')
  .option('-b,--batch', 'send a batch transaction')
program.parse(process.argv);
const options = program.opts()
console.log(program.mode)
if (options.setup) {
  console.log('set up')
} else if (options.transactions) {
  console.log("send transactions")
}

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

if (options.setup) {
  const deposit = await syncWallet.depositToSyncFromEthereum({
    depositTo: syncWallet.address(),
    token: "ETH",
    amount: ethers.utils.parseEther("30"),
  });
  const deposit2 = await syncWallet2.depositToSyncFromEthereum({
    depositTo: syncWallet2.address(),
    token: "ETH",
    amount: ethers.utils.parseEther("30")
  });
  console.log("Deposit 1: ", deposit)
  console.log("Deposit 2: ", deposit2)

  const committedETHBalance1 = await syncWallet.getBalance("ETH");
  console.log("Committed balance 1: ", committedETHBalance1)

  const committedETHBalance2 = await syncWallet.getBalance("ETH");
  console.log("Committed balance 2: ", committedETHBalance2)

  // Can start using funds immediately after commit
  // Don't have to wait until after verification

  const verifiedDepositReceipt = await deposit.awaitReceipt();
  console.log("Verified Deposit Receipt 1: ", verifiedDepositReceipt)

  const verifiedDepositReceipt2 = await deposit2.awaitReceipt();
  console.log("Verified Deposit Receipt 2: ", verifiedDepositReceipt2)
} else if (options.transactions) {
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
  var transferCount = 1000;
  console.log("Transfer Count Total: ", transferCount)
  var time_aggregate = 0;
  for (let i = 0; i < transferCount; i++) {
    console.log("Transfer: ", i)
    const startTime = Date.now();
    transfer = await syncWallet.syncTransfer({
      to: syncWallet2.address(),
      token: "ETH",
      amount: ethers.utils.parseEther("0.001"),
    });

    const transferReceipt = await transfer.awaitReceipt();
    const endTime = Date.now()
    const diff_seconds = (endTime-startTime)/1000;
    time_aggregate += diff_seconds;
    // console.log("Transfer Receipt: ", transferReceipt)
  }
  console.log("Transfer Count: ", transferCount)
  console.log("Average time ", time_aggregate / transferCount)

  // Transfer Count 1500
  var transferCount = 1500;
  console.log("Transfer Count Total: ", transferCount)
  var time_aggregate = 0;
  for (let i = 0; i < transferCount; i++) {
    console.log("Transfer: ", i)
    const startTime = Date.now();
    transfer = await syncWallet.syncTransfer({
      to: syncWallet2.address(),
      token: "ETH",
      amount: ethers.utils.parseEther("0.001"),
    });

    const transferReceipt = await transfer.awaitReceipt();
    const endTime = Date.now()
    const diff_seconds = (endTime-startTime)/1000;
    time_aggregate += diff_seconds;
    // console.log("Transfer Receipt: ", transferReceipt)
  }
  console.log("Transfer Count: ", transferCount)
  console.log("Average time ", time_aggregate / transferCount)

  // Transfer Count 2000
  var transferCount = 2000;
  console.log("Transfer Count Total: ", transferCount)
  var time_aggregate = 0;
  for (let i = 0; i < transferCount; i++) {
    console.log("Transfer: ", i)
    const startTime = Date.now();
    transfer = await syncWallet.syncTransfer({
      to: syncWallet2.address(),
      token: "ETH",
      amount: ethers.utils.parseEther("0.001"),
    });

    const transferReceipt = await transfer.awaitReceipt();
    const endTime = Date.now()
    const diff_seconds = (endTime-startTime)/1000;
    time_aggregate += diff_seconds;
    // console.log("Transfer Receipt: ", transferReceipt)
  }
  console.log("Transfer Count: ", transferCount)
  console.log("Average time ", time_aggregate / transferCount)

} else if (options.batch) {
  console.log("Starting batch process")
  if (!(await syncWallet.isSigningKeySet())) {
    console.log("Signing key not set!");
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
  const token = "ETH"
  const amount = zksync.utils.closestPackableTransactionAmount(ethers.utils.parseEther("0.001"));

  console.log("Starting batch builder");
  const batchBuilder = syncWallet.batchBuilder()
  for(var i = 0; i<1; i++) {
    batchBuilder.addTransfer({ to: syncWallet2.address(), token, amount })
  }
  const batch = await batchBuilder.build(token)

  console.log("Batch: ", batch)
  
  const totalFee = batch.totalFee.get(token)
  console.log("Total fee: ", totalFee.toString())

  const senderBefore = await syncWallet.getBalance(token);
  const receiverBefore = await syncWallet2.getBalance(token);
  console.log("Submitting signed batch transactions")
  console.log("Wallet: ", wallet)

  const startTime = Date.now()
  console.log("Starting: ", startTime)
  const handles = await wallet.submitSignedTransactionsBatch(syncWallet.provider, batch.txs, [batch.signature]);
  await Promise.all(handles.map((handle) => handle.awaitReceipt()));
  const endTime = Date.now()
  console.log("End: ", endTime)

  console.log("Time in minutes: ", (endTime-startTime)/1000/60)
  
  const senderAfter = await syncWallet.getBalance(token);
  const receiverAfter = await syncWallet2.getBalance(token);

  console.log("Sender before: ", senderBefore.toString())
  console.log("Sender after: ", senderAfter.toString())
  const senderDiff = senderBefore.sub(senderAfter)
  console.log("Sender diff: ", senderDiff.toString())
  // console.log(senderDiff.toString())

  console.log("Receiver before: ", receiverBefore.toString())
  console.log("Receiver after: ", receiverAfter.toString())
  const receiverDiff = receiverAfter.sub(receiverBefore)
  console.log(receiverDiff.toString())
  
  console.log("Should be 0: ", senderDiff.sub(receiverDiff).sub(totalFee).toString())
}
