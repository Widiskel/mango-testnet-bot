import fetch, { Response } from "node-fetch";
import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";
import { HttpsProxyAgent } from "https-proxy-agent";

export class API {
  constructor(proxy) {
    this.proxy = proxy;
    this.ua = Helper.randomUserAgent();
  }

  generateHeaders(token, additionalHeaders) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "User-Agent": this.ua,
    };

    if (token) {
      headers["mgo-token"] = `${token}`;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    return headers;
  }

  async fetch(url, method = "GET", body, token, additionalHeaders) {
    const requestOptions = {
      method: method,
      headers: this.generateHeaders(token, additionalHeaders),
      body: body ? JSON.stringify(body) : undefined,
      agent: this.proxy ? new HttpsProxyAgent(this.proxy) : undefined,
    };

    try {
      logger.info(`${method} : ${url} ${this.proxy ? this.proxy : ""}`);
      logger.info(`Request Header : ${JSON.stringify(requestOptions.headers)}`);
      logger.info(`Request Body : ${JSON.stringify(requestOptions.body)}`);

      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw response;
      }
      const status = response.status;
      const contentType = response.headers.get("Content-Type");
      let responseData;
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = {
          message: await response.text(),
        };
      }

      logger.info(`Response : ${response.status} ${response.statusText}`);
      logger.info(`Response Data : ${JSON.stringify(responseData)}...`);

      return {
        status: status,
        data: responseData,
      };
    } catch (error) {
      if (error instanceof Response) {
        const status = error.status;
        const contentType = error.headers.get("Content-Type");
        let responseData;

        if (contentType && contentType.includes("application/json")) {
          responseData = await error.json();
        } else {
          responseData = {
            message: await error.text(),
          };
        }
        logger.info(`Response : ${error.status} ${error.statusText}`);
        logger.info(`Response Data : ${JSON.stringify(responseData)}...`);

        if (status === 403) {
          return {
            status,
            data: responseData,
          };
        } else if (status === 504 || status === 404) {
          console.error("DETECT API CHANGE.. EXIT");
          process.exit(1);
        } else {
          throw new Error(`${status} - ${error.statusText}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error.message || error}`);
      }
    }
  }
}
