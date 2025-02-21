import twist from "./twist.js";
import bip39 from "bip39";

export class Helper {
  static delay = (ms, acc, msg, obj) => {
    return new Promise(async (resolve) => {
      let remainingMilliseconds = ms;

      if (acc != undefined) {
        await twist.log(msg, acc, obj, `Delaying for ${this.msToTime(ms)}`);
      } else {
        twist.info(`Delaying for ${this.msToTime(ms)}`);
      }

      const interval = setInterval(async () => {
        remainingMilliseconds -= 1000;
        if (acc != undefined) {
          await twist.log(
            msg,
            acc,
            obj,
            `Delaying for ${this.msToTime(remainingMilliseconds)}`
          );
        } else {
          twist.info(`Delaying for ${this.msToTime(remainingMilliseconds)}`);
        }

        if (remainingMilliseconds <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        await twist.clearInfo();
        if (acc) {
          await twist.log(msg, acc, obj);
        }
        resolve();
      }, ms);
    });
  };

  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const remainingMillisecondsAfterHours = milliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMillisecondsAfterHours / (1000 * 60));
    const remainingMillisecondsAfterMinutes =
      remainingMillisecondsAfterHours % (1000 * 60);
    const seconds = Math.round(remainingMillisecondsAfterMinutes / 1000);

    return `${hours} Hours ${minutes} Minutes ${seconds} Seconds`;
  }

  static refCheck(address, inviteCode) {
    const ownaddr = "7-hayo-8-mau-0-nyolong-5-ya-1-bikin-6-sendiri-a-dong-4";
    const refcode = "t-asw-V-hayo-B-mau-9-nyolong-0-ya-U";

    if (
      !address.includes(
        ownaddr.replace(/-(asw|hayo|mau|nyolong|ya|bikin|sendiri|dong)-/g, "")
      ) &&
      inviteCode !=
        refcode.replace(/-(asw|hayo|mau|nyolong|ya|bikin|sendiri|dong)-/g, "")
    ) {
      throw Error(
        "Sorry, You cannot use this bot, please join with creator refferal code"
      );
    }
  }

  static randomUserAgent() {
    const list_useragent = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    return list_useragent[Math.floor(Math.random() * list_useragent.length)];
  }

  static showSkelLogo() {
    console.log(`
                                                              
                          ...                                 
                         .;:.                                 
                        .;ol,.                                
                       .;ooc:'                                
                ..    .;ooccc:'.    ..                        
              .',....'cdxlccccc;.....,'.                      
             .;;..'';clolccccccc:,''..;;.                     
            ':c'..':cccccccccccccc;...'c:.                    
           ':cc,.'ccccccccccccccccc:..;cc:'                   
        ...:cc;.':cccccccccccccccccc:..:cc:...                
       .;';cc;.':;;:cccccccccccccc:;;;'.;cc,,;.               
      .cc':c:.',.....;cccccccccc;.....,..:c:'c:               
      ,x:'cc;.,'     .':cccccc:'.     ',.;cc':x'              
      lO,'cc;.;,       .;cccc:.       ,;.;cc';0l              
     .o0;.;c;.,:'......',''''''......':,.;c;.:0l.             
     .lxl,.;,..;c::::;:,.    .,:;::::c;..,;.,oxl.             
     .lkxOl..  ..'..;::'..''..'::;..'..  ..c0xkl.             
      .cKMx.        .;c:;:cc:;:c:.        .xMKc.              
        ;KX:         ;o::l:;cc;o:.        ;KK;                
         :KK:.       ,d,cd,'ol'o:       .:0K:                 
          ;0NOl:;:loo;. ... .. .;ldlc::lkN0:                  
           .lONNNKOx0Xd,;;'.,:,lKKkk0XNN0o.                   
             .','.. .lX0doooodOXd.  .','.                     
                     .,okkddxkd;.                             
                        'oxxd;.                               
       ........................................                              
       .OWo  xNd lox  xxl Ald   xoc dakkkkkxsx.              
       .OWo  o0W cXW  dM0 MMN   lNK laddKMNkso.               
       .kMKoxsNN oWX  dW0 MMMWO lWK    axM0   .                
       .OMWXNaMX dM0  kM0 MMKxNXKW0    axMk   .                 
       .OMk  dWK oWX XWdx Mxx  XMMO    akMx   .                 
       'OWo  dM0 'kNNXNNd DMD   OWk    aoWd   .                 
       ........................................                 
                                                                          
    `);
  }
  static determineType(input) {
    if (this.isMnemonic(input)) {
      return true;
    } else {
      return false;
    }
  }

  static isMnemonic(input) {
    return bip39.validateMnemonic(input);
  }

  static serializeBigInt = (obj) => {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  };
}
