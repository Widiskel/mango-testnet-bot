import { CoreService } from "../service/core-service.js";
import { Twisters } from "twisters";
import logger from "./logger.js";
import { accountList } from "../../accounts/accounts.js";

class Twist {
  twisters;
  constructor() {
    /** @type  {Twisters}*/
    this.twisters = new Twisters();
  }

  /**
   * @param {string} acc
   * @param {CoreService} core
   * @param {string} msg
   * @param {string} delay
   */
  log(msg = "", acc = "", core, delay) {
    const accIdx = accountList.indexOf(acc);
    if (delay == undefined) {
      logger.info(`Account ${accIdx + 1} - ${msg}`);
      delay = "-";
    }

    const address = core.address ?? "-";
    const balance = core.balance ?? [];
    const evmBalance = core.evmBalance ?? [];
    const bscBalance = core.bscBalance ?? [];
    const user = core.user ?? {};
    const userMgo = user.MgoUser ?? {};
    const point = userMgo.integral ?? "-";
    const evm = core.evmWallet ?? undefined;

    this.twisters.put(acc, {
      text: `
================== Account ${accIdx + 1} =================
Address      : - ${address} (MANGO) ${evm ? `\n               - ${core.evmAddress} (EVM)` : ""}

Balance      : 
MANGO NETWORK : ${balance.map((item) => {
        return `\n- ${item.totalBalance} ${item.coinType.split("::").pop()}`;
      })}
ETH SEPOLIA NETWORK : ${evmBalance.map((item) => {
        return `\n- ${item.BALANCE} ${item.SYMBOL}`;
      })}
TBNB NETWORK : ${bscBalance.map((item) => {
        return `\n- ${item.BALANCE} ${item.SYMBOL}`;
      })}

Score        : ${point}
               
Status : ${msg}
Delay : ${delay}
==============================================`,
    });
  }
  /**
   * @param {string} msg
   */
  info(msg = "") {
    this.twisters.put("2", {
      text: `
==============================================
Info : ${msg}
==============================================`,
    });
    return;
  }

  clearInfo() {
    this.twisters.remove("2");
  }

  clear(acc) {
    this.twisters.remove(acc);
  }
}
export default new Twist();
