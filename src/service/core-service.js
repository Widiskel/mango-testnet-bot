import {
  getFullnodeUrl,
  MgoClient,
  MgoHTTPTransport,
} from "@mgonetwork/mango.js/client";
import {
  DEFAULT_ED25519_DERIVATION_PATH,
  Ed25519Keypair,
} from "@mgonetwork/mango.js/keypairs/ed25519";
import { Helper } from "../utils/helper.js";
import { bcs, MIST_PER_MGO, TransactionBlock } from "@mgonetwork/mango.js";

import { API } from "./api.js";
import { SIGNPACKAGE } from "../packages/sign-package.js";
import { AMMPACKAGE } from "../packages/amm-package.js";
import { COINS } from "../coin/coins.js";
import { BEINGDEXPACKAGE } from "../packages/beingdex.js";
import { accountList } from "../../accounts/accounts.js";
import { proxyList } from "../../config/proxy_list.js";
import { MANGOBRIDGEPACKAGE } from "../packages/mangobridge.js";
import { BRIDGE } from "../chain/dest_chain.js";
import { ethers } from "ethers";
import { ERC1967PROXY } from "../abi/erc1967_proxy.js";
import { Config } from "../../config/config.js";
import logger from "../utils/logger.js";
import { ERC1967BSCPROXY } from "../abi/erc1967_proxy_bsc.js";

export class CoreService extends API {
  constructor(acc) {
    let proxy;
    const type = Helper.determineType(acc);
    if (!type)
      throw Error(
        "Sorry this bot is now only support Seed Pharse, Please use Seed Pharse instead of Private Key"
      );

    if (Config.BRIDGERAWDATA.length == 0)
      throw Error(`Please Provide BRIDGERAWDATA on config.js`);

    if (Config.BRIDGERAWDATA.length != accountList.length)
      throw Error(
        `You have ${accountList.length} Accounts, but provide ${Config.BRIDGERAWDATA.length} BRIDGERAWDATA`
      );
    const accIdx = accountList.indexOf(acc);
    if (proxyList.length != accountList.length && proxyList.length != 0)
      throw Error(
        `You Have ${accountList.length} Accounts But Provide ${proxyList.length} Proxy`
      );
    proxy = proxyList[accIdx];

    super(proxy);

    this.acc = acc;

    this.client = new MgoClient({
      transport: new MgoHTTPTransport({
        url: getFullnodeUrl("testnet"),
      }),
    });
    this.ethProvider = new ethers.JsonRpcProvider(
      "https://ethereum-sepolia-rpc.publicnode.com",
      11155111
    );
    this.bscProvider = new ethers.JsonRpcProvider(
      "https://bsc-testnet-rpc.publicnode.com",
      97
    );
  }

  async getAccountInfo() {
    try {
      await Helper.delay(500, this.acc, `Getting Wallet Information...`, this);

      this.wallet = Ed25519Keypair.deriveKeypair(
        this.acc,
        DEFAULT_ED25519_DERIVATION_PATH
      );
      this.evmWallet = ethers.Wallet.fromPhrase(this.acc, this.ethProvider);
      this.bscWallet = ethers.Wallet.fromPhrase(this.acc, this.bscProvider);
      this.evmAddress = this.evmWallet.address;
      this.address = this.wallet.getPublicKey().toMgoAddress();
      await Helper.delay(
        1000,
        this.acc,
        `Successfully Get Account Information`,
        this
      );
    } catch (error) {
      throw error;
    }
  }

  async connectMango() {
    try {
      await Helper.delay(500, this.acc, `Connecting to mango DAPPS...`, this);
      const signTime = Math.floor(Date.now() / 1000);

      const messageObject = {
        address: this.address,
        signTime: signTime,
        signType: "Login",
      };

      const messageString = JSON.stringify(messageObject);
      const messageUint8Array = new TextEncoder().encode(messageString);
      const signature =
        await this.wallet.signPersonalMessage(messageUint8Array);

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/mgoUser/loginMgoUserPublic",
        "POST",
        {
          signData: signature.signature,
          address: this.address,
          signTime: signTime,
        }
      );

      if (res.data.code == 0) {
        this.token = res.data.data.token;
        await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }

  async getMangoUser(msg = false) {
    try {
      if (msg)
        await Helper.delay(500, this.acc, `Getting User Information..`, this);

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/mgoUser/getMgoUser",
        "GET",
        undefined,
        this.token
      );

      if (res.data.code == 0) {
        this.user = res.data.data;
        if (msg) await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }
  async getSwapTask() {
    try {
      await Helper.delay(2000, this.acc, `Getting Swap Task Details..`, this);

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/taskDetail",
        "POST",
        {
          taskId: 2,
          type: 0,
        },
        this.token
      );

      if (res.data.code == 0) {
        this.swapTask = res.data.data;
        await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }
  async getExchangeTask() {
    try {
      await Helper.delay(
        2000,
        this.acc,
        `Getting BeingDex Task Details..`,
        this
      );

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/taskDetail",
        "POST",
        {
          taskId: 5,
          type: 0,
        },
        this.token
      );

      if (res.data.code == 0) {
        this.exchangeTask = res.data.data;
        await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }
  async getDiscordTask() {
    try {
      await Helper.delay(
        2000,
        this.acc,
        `Getting Discord Task Details..`,
        this
      );

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/taskDetail",
        "POST",
        {
          taskId: 3,
          type: 0,
        },
        this.token
      );

      if (res.data.code == 0) {
        this.discordTask = res.data.data;
        await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }
  async getBridgeTask() {
    try {
      await Helper.delay(
        2000,
        this.acc,
        `Getting Mango Bridge Task Details..`,
        this
      );

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/taskDetail",
        "POST",
        {
          taskId: 4,
          type: 0,
        },
        this.token
      );

      if (res.data.code == 0) {
        this.bridgeTask = res.data.data;
        await Helper.delay(500, this.acc, res.data.msg, this);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (error) {
      throw error;
    }
  }

  async addStep(taskId, step, msg = true) {
    try {
      if (msg)
        await Helper.delay(
          2000,
          this.acc,
          `Try Completing Step ${step.label}...`,
          this
        );

      await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/addStep",
        "POST",
        {
          taskId: taskId,
          stepId: step.sort,
        },
        this.token
      );
    } catch (error) {
      throw error;
    }
  }

  async getBalance(msg = false) {
    try {
      if (msg)
        await Helper.delay(500, this.acc, `Getting Account Balance...`, this);
      this.balance = await this.client.getAllBalances({
        owner: this.address,
      });
      this.balance = this.balance.map((item) => {
        item.totalBalance = parseFloat(
          (Number(item.totalBalance) / Number(MIST_PER_MGO)).toFixed(5)
        );
        return item;
      });

      const ethBalance = ethers.formatEther(
        await this.ethProvider.getBalance(this.evmAddress)
      );
      const bnbBalance = ethers.formatEther(
        await this.bscProvider.getBalance(this.evmAddress)
      );

      this.evmBalance = [{ SYMBOL: "ETH", BALANCE: ethBalance }];
      this.bscBalance = [{ SYMBOL: "BNB", BALANCE: bnbBalance }];

      if (msg)
        await Helper.delay(
          1000,
          this.acc,
          `Successfully Get Account Balance`,
          this
        );
    } catch (error) {
      throw error;
    }
  }

  async getFaucet() {
    try {
      await Helper.delay(1000, this.acc, `Requesting MGO Faucet`, this);

      const res = await this.fetch(
        "https://task-api.testnet.mangonetwork.io/base/getFaucet",
        "POST",
        {
          chain: "0",
          type: false,
        },
        this.token
      );
      if (res.status == 200) {
        await Helper.delay(1000, this.acc, res.data.msg, this);
        await this.getBalance();
      } else {
        throw res;
      }
      await this.addStep(
        1,
        {
          label: "Connect to Mango test network and sign to receive Gas",
          value: "Gas",
          extend: "Download and use the Beingdex mobile app",
          sort: 0,
        },
        false
      );
      // await requestMgoFromFaucetV0({
      //   host: getFaucetHost("testnet"),
      //   recipient: this.address,
      // });
    } catch (error) {
      // console.log(error);
      if (error.msg) {
        await Helper.delay(3000, this.acc, error.data.msg, this);
      } else {
        await Helper.delay(3000, this.acc, error.data.msg, this);
      }
    }
  }

  async checkIn() {
    try {
      await Helper.delay(1000, this.acc, `Trying to Daily Sign In`, this);
      const tx = new TransactionBlock();

      tx.moveCall({
        target: `${SIGNPACKAGE.ADDRESS}::sign::sign_in`,
        arguments: [
          tx.object(SIGNPACKAGE.MODULE.SIGN.SIGNPOOL),
          tx.object(SIGNPACKAGE.MODULE.SIGN.CLOCK),
        ],
      });
      await this.executeTx(tx);
      await Helper.delay(1000, this.acc, `Successfully Daily Sign In`, this);
    } catch (error) {
      await Helper.delay(
        1000,
        this.acc,
        `Failed to Daily Sign In, Possible already Sign In`,
        this
      );
    }
  }

  async swap(coinA, coinB) {
    try {
      const tx = new TransactionBlock();
      let coinToSwap = await this.client.getCoins({
        owner: this.address,
        coinType: coinA.TYPE,
      });

      if (coinToSwap.data.length == 0) {
        while (coinToSwap.data.length == 0) {
          coinToSwap = await this.client.getCoins({
            owner: this.address,
            coinType: coinA.TYPE,
          });
          await this.getBalance();
          await Helper.delay(
            10000,
            this.acc,
            `Delaying for ${Helper.msToTime(10000)} until swap balance update`,
            this
          );
        }
      }

      if (coinToSwap.data.length > 1) {
        await this.mergeCoin(coinA);
        coinToSwap = await this.client.getCoins({
          owner: this.address,
          coinType: coinA.TYPE,
        });
      }
      let swapAmount = Number(0.1) * Number(MIST_PER_MGO);
      let coin;
      if (coinA == COINS.MGO) {
        coin = tx.splitCoins(tx.gas, [tx.pure(swapAmount)]);
      } else {
        swapAmount = Number(coinToSwap.data[0].balance);
        coin = tx.splitCoins(tx.object(coinToSwap.data[0].coinObjectId), [
          tx.pure(swapAmount),
        ]);
      }
      await Helper.delay(
        1000,
        this.acc,
        `Try to Swapping ${coinA == COINS.MGO ? parseFloat((Number(swapAmount) / Number(MIST_PER_MGO)).toString()).toFixed(2) : parseFloat((Number(coinToSwap.data[0].balance) / Number(MIST_PER_MGO)).toString()).toFixed(5)} ${coinA.SYMBOL} to ? ${coinB.SYMBOL}`,
        this
      );
      const isMgoExists = [coinA, coinB].find((item) => item == COINS.MGO);
      const swapRoute =
        coinA == COINS.MGO || (!isMgoExists && coinA == COINS.USDT)
          ? [coinA.TYPE, coinB.TYPE]
          : [coinA.TYPE, coinB.TYPE].reverse();
      const poolId = await this.getPool(swapRoute);
      let swapReturn = await this.swapCalculate(
        swapRoute,
        poolId,
        coinA == COINS.MGO || (!isMgoExists && coinA == COINS.USDT)
          ? true
          : false,
        swapAmount
      );

      swapReturn = Math.floor(swapReturn - (swapReturn * 10) / 100);
      await Helper.delay(
        1000,
        this.acc,
        `Try to Swapping ${parseFloat((Number(swapAmount) / Number(MIST_PER_MGO)).toString()).toFixed(2)} ${coinA.SYMBOL} to ${parseFloat((Number(swapReturn) / Number(MIST_PER_MGO)).toString()).toFixed(2)} ${coinB.SYMBOL}`,
        this
      );

      tx.moveCall({
        target: `${AMMPACKAGE.ADDRESS}::amm_script::${coinA == COINS.MGO || (!isMgoExists && coinA == COINS.USDT) ? "swap_exact_coinA_for_coinB" : "swap_exact_coinB_for_coinA"}`,
        typeArguments: swapRoute,
        arguments: [
          tx.object(poolId),
          tx.object(AMMPACKAGE.MODULE.AMMCONFIG.GLOBALPAUSESTATUSID),
          coin,
          tx.pure(swapAmount),
          tx.pure(swapReturn),
        ],
      });
      await this.executeTx(tx);
      await Helper.delay(
        1000,
        this.acc,
        `Successfully Swapping ${parseFloat((Number(swapAmount) / Number(MIST_PER_MGO)).toString()).toFixed(2)} ${coinA.SYMBOL} to ${parseFloat((Number(swapReturn) / Number(MIST_PER_MGO)).toString()).toFixed(2)} ${coinB.SYMBOL}`,
        this
      );
    } catch (error) {
      throw error;
    }
  }

  async exchange(coinA, coinB) {
    try {
      await Helper.delay(
        1000,
        this.acc,
        `Exchanging ${coinA.SYMBOL} to ${coinB.SYMBOL}`,
        this
      );
      const swapRoute =
        coinA == COINS.USDT
          ? [coinA.TYPE, coinB.TYPE].reverse()
          : [coinA.TYPE, coinB.TYPE];
      const tx = new TransactionBlock();
      let coinToSwap = await this.client.getCoins({
        owner: this.address,
        coinType: coinA.TYPE,
      });
      if (coinToSwap.data.length == 0) {
        while (coinToSwap.data.length == 0) {
          coinToSwap = await this.client.getCoins({
            owner: this.address,
            coinType: coinA.TYPE,
          });
          console.log(coinToSwap.data.length);

          await this.claimDealPool(
            BEINGDEXPACKAGE.MODULE.CLOB.AIUSDTPOOL,
            swapRoute
          );
          await this.getBalance();

          await Helper.delay(
            5000,
            this.acc,
            `Delaying for ${Helper.msToTime(5000)} until Exchange balance update`,
            this
          );
        }
      }

      if (coinToSwap.data.length > 1) {
        await this.mergeCoin(coinA);
        coinToSwap = await this.client.getCoins({
          owner: this.address,
          coinType: coinA.TYPE,
        });
      }
      const swapAmount = Number(coinToSwap.data[0].balance);
      tx.moveCall({
        target: `${BEINGDEXPACKAGE.ADDRESS}::clob::${coinA == COINS.USDT ? "buy" : "sell"}`,
        typeArguments: swapRoute,
        arguments:
          coinA == COINS.USDT
            ? [
                tx.object(BEINGDEXPACKAGE.MODULE.CLOB.AIUSDTPOOL),
                tx.pure("9223372036854775808"),
                tx.pure(swapAmount),
                tx.pure(true),
                tx.object(coinToSwap.data[0].coinObjectId),
              ]
            : [
                tx.object(BEINGDEXPACKAGE.MODULE.CLOB.AIUSDTPOOL),
                tx.pure("9223372036854775808"),
                tx.pure(swapAmount),
                tx.pure(false),
                tx.object(coinToSwap.data[0].coinObjectId),
              ],
      });
      await this.executeTx(tx);
      await Helper.delay(
        1000,
        this.acc,
        `Successfully Exchanging ${parseFloat((Number(swapAmount) / Number(MIST_PER_MGO)).toString()).toFixed(2)} ${coinA.SYMBOL} to ${coinB.SYMBOL}`,
        this
      );
    } catch (error) {
      throw error;
    }
  }

  async mergeCoin(coinA) {
    try {
      const coin = await this.client.getCoins({
        owner: this.address,
        coinType: coinA.TYPE,
      });

      if (coinA == COINS.MGO && coin.data.length < 3) {
        return;
      }
      if (coin.data.length < 2) {
        return;
      }
      const tx = new TransactionBlock();
      let targetCoin, coinsToMerge;
      if (coinA == COINS.MGO) {
        targetCoin = coin.data[1].coinObjectId;
        coinsToMerge = coin.data.slice(2).map((coin) => coin.coinObjectId);
      } else {
        targetCoin = coin.data[0].coinObjectId;
        coinsToMerge = coin.data.slice(1).map((coin) => coin.coinObjectId);
      }

      await Helper.delay(1000, this.acc, `Merging ${coinA.SYMBOL}`, this);
      await tx.mergeCoins(
        tx.object(targetCoin),
        coinsToMerge.map((coin) => tx.object(coin))
      );

      await this.executeTx(tx);
      await this.getBalance();
    } catch (error) {
      throw error;
    }
  }

  async bridge(destChain) {
    try {
      if (destChain == BRIDGE.MANGOBSC || destChain == BRIDGE.MANGOETH) {
        const dest = destChain;
        const tx = new TransactionBlock();
        let coinToBridge = await this.client.getCoins({
          owner: this.address,
          coinType: COINS.USDT.TYPE,
        });
        if (coinToBridge.data.length == 0) {
          while (coinToSwap.data.length == 0) {
            coinToBridge = await this.client.getCoins({
              owner: this.address,
              coinType: COINS.USDT.TYPE,
            });
            await this.getBalance();
            await Helper.delay(
              10000,
              this.acc,
              `Delaying for ${Helper.msToTime(10000)} until swap balance update`,
              this
            );
          }
        }
        if (coinToBridge.data.length > 1) {
          await this.mergeCoin(COINS.USDT);
          coinToBridge = await this.client.getCoins({
            owner: this.address,
            coinType: COINS.USDT.TYPE,
          });
        }
        let bridgeAmount = Number(0.001) * Number(MIST_PER_MGO);
        const coin = tx.splitCoins(
          tx.object(coinToBridge.data[0].coinObjectId),
          [tx.pure(bridgeAmount)]
        );

        await Helper.delay(
          1000,
          this.acc,
          `Try to Bridge ${parseFloat((Number(bridgeAmount) / Number(MIST_PER_MGO)).toString()).toFixed(5)} ${COINS.USDT.SYMBOL} to ${destChain} `,
          this
        );

        tx.moveCall({
          target: `${MANGOBRIDGEPACKAGE.ADDRESS}::bridge::bridge_token`,
          typeArguments: [COINS.USDT.TYPE],
          arguments: [
            tx.object(MANGOBRIDGEPACKAGE.MODULE.BRIDGE.BRIDGEXECUTOR),
            coin,
            tx.pure(this.evmAddress),
            tx.pure(dest),
            tx.object(MANGOBRIDGEPACKAGE.MODULE.BRIDGE.CLOCK),
          ],
        });

        await this.executeTx(tx);
        await Helper.delay(
          1000,
          this.acc,
          `Successfully Bridge USDT Token From Mango Network to ${destChain}`,
          this
        );
      } else {
        await Helper.delay(
          1000,
          this.acc,
          `Try to Bridge Token From ${destChain == BRIDGE.ETHMANGO ? "ETH Sepolia" : "BNB Testnet"} to Mango Network `,
          this
        );

        if (destChain == BRIDGE.ETHMANGO) {
          const balance = this.evmBalance.find((item) => item.SYMBOL == "ETH");
          if (balance == 0) {
            await Helper.delay(
              3000,
              this.acc,
              `Not Enought ETH Sepolia Balance, Skipping`,
              this
            );
            return;
          }
        } else {
          const balance = this.evmBalance.find((item) => item.SYMBOL == "BNB");
          if (balance == 0) {
            await Helper.delay(
              3000,
              this.acc,
              `Not Enought BNB Testnet Balance, Skipping`,
              this
            );
            return;
          }
        }

        const accIdx = accountList.indexOf(this.acc);
        const data = Config.BRIDGERAWDATA[accIdx];
        const tx = {
          to:
            destChain == BRIDGE.ETHMANGO ? ERC1967PROXY.CA : ERC1967BSCPROXY.CA,
          from: this.evmAddress,
          data: data,
          value: ethers.parseEther("0.00001"),
        };

        await this.executeEvmTx(tx, destChain);
        await Helper.delay(
          1000,
          this.acc,
          `Successfully Bridge Token From ${destChain == BRIDGE.ETHMANGO ? "ETH Sepolia" : "BNB Testnet"} to Mango Network `,
          this
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async swapCalculate(typeArg, poolId, is_a_to_b, amountIn) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${AMMPACKAGE.ADDRESS}::amm_router::compute_out`,
      typeArguments: typeArg,
      arguments: [tx.object(poolId), tx.pure(amountIn), tx.pure(is_a_to_b)],
    });

    const res = await this.readTx(tx);
    return bcs.de(
      res.results[0].returnValues[0][1],
      Uint8Array.from(res.results[0].returnValues[0][0])
    );
  }
  async getAndClaimDealPool(pool, route) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${BEINGDEXPACKAGE.ADDRESS}::clob::check_deal_pool_balance`,
      typeArguments: route,
      arguments: [tx.object(pool), tx.pure(this.address)],
    });

    const res = await this.readTx(tx);
    const dealPool = res.events[0].parsedJson;
    if (dealPool.token0_balance != 0) {
      await this.claimDealPool(pool, route);
    }
  }

  async claimDealPool(pool, route) {
    await Helper.delay(
      1000,
      this.acc,
      `Check and Claiming Being Dex Pool Balance ...`,
      this
    );
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${BEINGDEXPACKAGE.ADDRESS}::clob::claim_deal_pool_balance`,
      typeArguments: route,
      arguments: [tx.object(pool)],
    });

    await this.executeTx(tx);
    await Helper.delay(
      1000,
      this.acc,
      `Being Dex Pool Balance Extracted Tx ...`,
      this
    );
  }

  async getPool(typeArg) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${AMMPACKAGE.ADDRESS}::amm_swap::get_pool_id`,
      typeArguments: typeArg,
      arguments: [tx.object(AMMPACKAGE.MODULE.AMMSWAP.AMMFACTORY)],
    });

    const res = await this.readTx(tx);

    return bcs.de(
      res.results[0].returnValues[0][1],
      Uint8Array.from(res.results[0].returnValues[0][0])
    );
  }

  async executeTx(tx) {
    try {
      await Helper.delay(1000, this.acc, `Executing Tx ...`, this);
      const txRes = await this.client.signAndExecuteTransactionBlock({
        signer: this.wallet,
        transactionBlock: tx,
      });
      await Helper.delay(
        3000,
        this.acc,
        `Tx Executed : ${`https://mgoscan.com/txblock/${txRes.digest}`}`,
        this
      );
      await this.getBalance();
      return txRes;
    } catch (error) {
      throw error;
    }
  }

  async readTx(tx) {
    try {
      const txRes = await this.client.devInspectTransactionBlock({
        sender: this.address,
        transactionBlock: tx,
      });
      return txRes;
    } catch (error) {
      throw error;
    }
  }

  async executeEvmTx(tx, destChain) {
    try {
      logger.info(`TX DATA ${JSON.stringify(Helper.serializeBigInt(tx))}`);
      await Helper.delay(500, this.acc, `Executing TX...`, this);
      const txRes =
        destChain == BRIDGE.ETHMANGO
          ? await this.evmWallet.sendTransaction(tx)
          : await this.bscWallet.sendTransaction(tx);
      await Helper.delay(
        500,
        this.acc,
        `Tx Executed Waiting For Block Confirmation...`,
        this
      );
      const txRev = await txRes.wait();
      logger.info(`Tx Confirmed and Finalizing: ${JSON.stringify(txRev)}`);
      await Helper.delay(
        5000,
        this.acc,
        `Tx Executed and Confirmed \n${destChain == BRIDGE.ETHMANGO ? "https://sepolia.etherscan.io" : "https://testnet.bscscan.com"}/tx/${txRev.hash}`,
        this
      );

      await this.getBalance();
    } catch (error) {
      if (error.message.includes("504")) {
        await Helper.delay(5000, this.acc, error.message, this);
      } else {
        throw error;
      }
    }
  }
}
