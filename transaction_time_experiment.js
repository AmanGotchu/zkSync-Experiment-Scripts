function test(transactionCount) {


function waitForBlocks(){
    if(eth.getTransaction(transactions[transactions.length-1].trans).blockNumber != null){
        var blocks = []

        console.log("Transactions length: ", transactions.length)
        var time_sum = 0
        for(var j = 0; j<transactions.length; j++) {
            var blockNumber = eth.getTransaction(transactions[j]["trans"]).blockNumber
            var block = eth.getBlock(blockNumber)
            block.blockNumber = blockNumber
            if(blocks.length == 0 || blocks[blocks.length-1].blockNumber != blockNumber) {
                blocks.push(block)
                console.log("Pushed block")
            }

            block_mined_time = block.timestamp
            start_time = transactions[j].timestamp/1000

            time_sum += block_mined_time - start_time
        }
        console.log("# of Blocks: ", blocks.length)
        average_transaction_mine_time = time_sum / transactions.length
        console.log("Average transaction mine time: ", average_transaction_mine_time)
        for(var z = 0; z<blocks.length; z++) {
            // Number of transactions in block
            console.log("Block Number: ", blocks[z].blockNumber)
            console.log("Number of transactions: ", blocks[z].tratnsactions.length)
            console.log("Gas used ", blocks[z].gasUsed)
            console.log("Block size (bytes): ", blocks[z].size)
            console.log("Total Difficulty: ", blocks[z].totalDifficulty)
            console.log("\n")
        }
        return
    }
    else{
        console.log("Waiting...")
        setTimeout(waitForBlocks, 250);
    }
}

personal.unlockAccount(eth.accounts[1], "")
personal.unlockAccount(eth.accounts[2], "")
var transactions = []
for(var i = 0; i<transactionCount; i++) {
    console.log("Transaction count: ", i)
    trans = eth.sendTransaction({from: eth.accounts[1], to: eth.accounts[2], value: web3.toWei(.001, "ether")})
    transactions.push({trans: trans, timestamp: Date.now()});
}

waitForBlocks()


}