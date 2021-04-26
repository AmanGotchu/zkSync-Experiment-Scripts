from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
import time

import csv

def retrieve_etherscan_tx_data(tx_hash):
    etherscan_tx_url = "https://etherscan.io/tx/"+tx_hash
    # etherscan_transaction_api_url = "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash="
    
    driver.get(etherscan_tx_url)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    more_info_button = driver.find_element_by_class_name("card-btn-arrow")
    more_info_button.click()

    transaction_fee = ""
    gas_price = ""
    gas_limit = ""
    gas_used = ""

    etherscan_rows = driver.find_elements_by_class_name("align-items-center")
    for i in range(len(etherscan_rows)):
        if "Transaction Fee:" in etherscan_rows[i].text:
            transaction_fee = etherscan_rows[i].find_elements_by_tag_name("div")[1].text
        elif "Gas Price:" in etherscan_rows[i].text:
            gas_price = etherscan_rows[i].find_elements_by_tag_name("div")[1].text
        elif "Gas Limit:" in etherscan_rows[i].text:
            gas_limit = etherscan_rows[i].find_elements_by_tag_name("div")[1].text
        elif "Gas Used by Transaction:" in etherscan_rows[i].text:
            gas_used = etherscan_rows[i].find_elements_by_tag_name("div")[1].text

    return {"transaction_fee_ether": transaction_fee.split(" ")[0],"transaction_fee_dollar": transaction_fee.split(" ")[2][2:-1], "gas_price_ether": gas_price.split(" ")[0], "gas_price_gwei": gas_price.split(" ")[2][1:], "gas_limit": gas_limit, "gas_used": gas_used.split(" ")[0]}

token_gas_price = dict()
average_gas_price_gwei_last_three_days = 110.630506609

average_gas_dict_day = {
    "17": 144.966485762,
    "18": 170.181112745,
    "19": 195.797651762,
    "20": 265.510040331,
    "21": 166.325327588,
    "22": 140.016002618,
    "23": 124.223128337,
    "24": 67.652388873,
}


url = "https://zkscan.io/explorer/"
block_url = "https://zkscan.io/explorer/blocks/"

chrome_options = Options()
#chrome_options.add_argument("--disable-extensions")
#chrome_options.add_argument("--disable-gpu")
#chrome_options.add_argument("--no-sandbox") # linux only
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(executable_path="./chromedriver")
driver.get(url)

time.sleep(2)

# verified_block_count_card = driver.find_elements_by_class_name('card-body')[1]
# card_row_div = verified_block_count_card.find_element_by_class_name('row')
# cards = card_row_div.find_elements_by_class_name('col-sm')[1]
# verified_card = cards.find_element_by_class_name('num')
# verified_block_count = int(verified_card.text)

verified_block_count = 13648 # Ending at 4/24
first_block_count = 13581 # starting at 4/20

with open('gas_experiment_data.csv', 'a', newline='') as csvfile:
    fieldnames = ["zk_block_number", "zk_block_date", "zk_block_transfer_count", "layer_one_gas_cost_estimate", "zk_block_gas_cost"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    for i in range(first_block_count, verified_block_count):
    # for i in range(verified_block_count, first_block_count, -1):
        zksync_block = i
        zksync_block_url = block_url + str(zksync_block)
        driver.get(zksync_block_url)
        driver.implicitly_wait(2)
        time.sleep(2)

        tables = driver.find_elements_by_tag_name('tbody')

        # Block Data scrape
        block_data_table = tables[0]

        rows = block_data_table.find_elements_by_tag_name('tr')
        block_number = rows[0].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        block_size = rows[1].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        commit_tx_hash = rows[4].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        verify_tx_hash = rows[6].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        commit_time = rows[5].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        verify_time = rows[7].find_elements_by_tag_name('td')[1].find_element_by_tag_name('span').find_element_by_tag_name('span').find_element_by_tag_name('span').text
        
        # Transactions Table Scrape
        transaction_table = tables[1]
        transactions = transaction_table.find_elements_by_tag_name('tr')
        number_transfer_transactions = 0
        total_layer_one_transfer_gas_price_gwei = 0
        for j in range(len(transactions)):
            transaction_data = transactions[j].find_elements_by_tag_name('td')
            transaction_type = transaction_data[1].text

            transaction_date_day = transaction_data[6].text.split(" ")[0].split("-")[2]

            if transaction_type == "Transfer":
                number_transfer_transactions = number_transfer_transactions+1
                total_layer_one_transfer_gas_price_gwei += average_gas_dict_day[transaction_date_day]
        # print("Total Estimated Layer 1 Transactions Gas: ", total_layer_one_transfer_gas_price_gwei)

        # Retrieving ZKSync smart contract transaction gas price
        commit_tx_data = retrieve_etherscan_tx_data(commit_tx_hash)
        verify_tx_data = retrieve_etherscan_tx_data(verify_tx_hash)

        zksync_total_transaction_fee_ether = float(commit_tx_data["transaction_fee_ether"]) + float(verify_tx_data["transaction_fee_ether"])
        zksync_total_transaction_fee_dollar = float(''.join(ch for ch in commit_tx_data["transaction_fee_dollar"] if ch != ",")) + float(''.join(ch for ch in verify_tx_data["transaction_fee_dollar"]))
        zksync_total_gas_price_ether = float(commit_tx_data["gas_price_ether"]) + float(verify_tx_data["gas_price_ether"])
        zksync_total_gas_price_gwei = float(commit_tx_data["gas_price_gwei"]) + float(verify_tx_data["gas_price_gwei"])
        zksync_total_gas_used = float(''.join(ch for ch in commit_tx_data["gas_price_gwei"] if ch != ",")) + float(''.join(ch for ch in verify_tx_data["gas_price_gwei"] if ch != ","))
        # print("Total transaction fee (eth): " , zksync_total_transaction_fee_ether)
        # print("Total transaction fee (dollar): ", zksync_total_transaction_fee_dollar)
        # print("Total gas price (ether): ", zksync_total_gas_price_ether)
        # print("Total gas price (gwe): ", zksync_total_gas_price_gwei)
        # print("Total gas used: ", zksync_total_gas_used)
        
        print("Block: ", block_number)
        print("Layer 1 Estimates: ", str(total_layer_one_transfer_gas_price_gwei))
        print("ZKSync Layer 2 Gas Price: ", str(zksync_total_gas_price_gwei))
        print("")

        writer.writerow({
            "zk_block_number": zksync_block,
            "zk_block_date": verify_time,
            "zk_block_transfer_count": number_transfer_transactions,
            "layer_one_gas_cost_estimate": total_layer_one_transfer_gas_price_gwei,
            "zk_block_gas_cost": zksync_total_gas_price_gwei,
        })
    # Get verified block count

    # Starting from that block number down go to the mined block page
        # For each block track
            # Block number
            # Block size
            # Commit TX Hash & Verify TX Hash
            # Committed Time & Verified Time

            # For each transaction in block
                # Identify each TRANSFER action
                    # Identify the average gas price & gas used for the token in the transfer and aggregate for entire block

            # Then identify gas price & gas used for commit & verify TX block

            # Place all this info on an excel sheet to use

