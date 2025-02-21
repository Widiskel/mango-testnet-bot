import { accountList } from "./accounts/accounts.js";
import { BRIDGE } from "./src/chain/dest_chain.js";
import { COINS } from "./src/coin/coins.js";
import { CoreService } from "./src/service/core-service.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

async function operation(acc) {
  const core = new CoreService(acc);
  try {
    await core.getAccountInfo();
    await core.getBalance(true);
    await core.connectMango();
    await core.getMangoUser(true);

    await Helper.refCheck(core.address, core.user.Premium);

    await core.getFaucet();
    await core.checkIn();
    await core.getSwapTask();
    if (core.swapTask.step.find((item) => item.status == "0") != undefined) {
      await core.swap(COINS.MGO, COINS.USDT);
      await core.swap(COINS.USDT, COINS.MAI);
      await core.swap(COINS.MAI, COINS.USDT);
      await core.swap(COINS.USDT, COINS.MGO);
      for (const item of core.swapTask.step) {
        if (item.status == "0")
          await core.addStep(core.swapTask.detail.ID, item);
      }
      await Helper.delay(
        2000,
        acc,
        `${core.swapTask.detail.title} Task is now Syncronizing`,
        core
      );
      await core.getMangoUser(true);
    }

    await core.getDiscordTask();
    if (core.discordTask.step.find((item) => item.status == "0") != undefined) {
      await core.addStep(core.discordTask.detail.ID, core.discordTask.step[0]);
    }

    await core.getExchangeTask();
    if (
      core.exchangeTask.step.find((item) => item.status == "0") != undefined
    ) {
      let usdtBalance = core.balance.find(
        (item) => item.coinType.split("::").pop() == "USDT"
      );
      if (usdtBalance.totalBalance < 0.1)
        await core.swap(COINS.MGO, COINS.USDT);
      if (usdtBalance.totalBalance > 1) {
        await core.swap(COINS.USDT, COINS.MGO);
        await core.swap(COINS.MGO, COINS.USDT);
      }
      usdtBalance = core.balance.find(
        (item) => item.coinType.split("::").pop() == "USDT"
      );
      await core.exchange(COINS.USDT, COINS.AI);
      await core.exchange(COINS.AI, COINS.USDT);
      usdtBalance = core.balance.find(
        (item) => item.coinType.split("::").pop() == "USDT"
      );
      if (usdtBalance.totalBalance > 0.1)
        await core.swap(COINS.USDT, COINS.MGO);

      for (const item of core.exchangeTask.step) {
        if (item.status == "0")
          await core.addStep(core.exchangeTask.detail.ID, item);
      }
      await Helper.delay(
        2000,
        acc,
        `${core.exchangeTask.detail.title} Task is now Syncronizing`,
        core
      );
      await core.getMangoUser(true);
    }

    await core.getBridgeTask();
    if (core.bridgeTask.step.find((item) => item.status == "0") != undefined) {
      await core.swap(COINS.MGO, COINS.USDT);
      await core.bridge(BRIDGE.MANGOETH);
      await core.bridge(BRIDGE.MANGOBSC);
      await core.bridge(BRIDGE.ETHMANGO);
      await core.bridge(BRIDGE.BSCMANGO);
      for (const item of core.bridgeTask.step) {
        await core.addStep(core.bridgeTask.detail.ID, item);
      }
      await core.swap(COINS.USDT, COINS.MGO);
      await Helper.delay(
        2000,
        acc,
        `${core.bridgeTask.detail.title} Task is now Syncronizing`,
        core
      );
      await core.getMangoUser(true);
    }

    await Helper.delay(
      60000 * 60 * 24,
      acc,
      `Accounts Processing Complete, Delaying For ${Helper.msToTime(60000 * 60 * 24)}...`,
      core
    );
    await operation(acc);
  } catch (error) {
    logger.info(error.message);
    await Helper.delay(5000, acc, error.message, core);
    operation(acc);
  }
}

async function startBot() {
  try {
    logger.info(`BOT STARTED`);
    if (accountList.length == 0)
      throw Error("Please input your account first on accounts.js file");
    const promiseList = [];

    for (const acc of accountList) {
      promiseList.push(operation(acc));
    }

    await Promise.all(promiseList);
  } catch (error) {
    logger.info(`BOT STOPPED`);
    logger.error(JSON.stringify(error));
    throw error;
  }
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("Application Started");
    Helper.showSkelLogo();
    console.log("MANGO WALLET BOT");
    console.log("By : Widiskel");
    console.log("Follow On : https://github.com/Widiskel");
    console.log("Join Channel : https://t.me/skeldrophunt");
    console.log("Dont forget to run git pull to keep up to date");
    await startBot();
  } catch (error) {
    console.log("Error During executing bot", error);
    await startBot();
  }
})();
