import fs from "node:fs/promises";
import { hostname } from "node:os";

import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "jest";
import Sinon from "sinon";
import { hiddenService, Tor } from "tor-control-ts";

import Config from "../../../src/config/index.ts";
import {
  addOnion,
  closeTorClient,
  createTorConfig,
  getTorClient,
} from "../../../src/tor/client.ts";

export function mockModule<T extends { [K: string]: any }>(
  moduleToMock: T,
  defaultMockValuesForMock: Partial<{ [K in keyof T]: T[K] }>,
) {
  return (
    sandbox: Sinon.SinonSandbox,
    returnOverrides?: Partial<{ [K in keyof T]: T[K] }>,
  ): void => {
    console.log("mockModule func");
    const functions = Object.keys(moduleToMock);
    const returns = returnOverrides || {};
    console.log("mockModule func", functions);
    functions.forEach((f) => {
      console.log("f: " + f);
      sandbox.stub(moduleToMock, f).callsFake(
        returns[f] || defaultMockValuesForMock[f],
      );
    });
  };
}

describe("onion", () => {
  Tor.prototype.connect = async function () {
    if (this === undefined) {
      throw new Error();
    }
    const opts = (this as Tor)["opts"] as {
      host: string;
      port: number;
      password: string;
    };
    if (
      opts.host == hostname() && opts.port == 9051 &&
      opts.password === "nostr_ts_relay"
    ) {
      return;
    } else {
      throw new Error();
    }
  };
  Tor.prototype.quit = async function () {
    return;
  };
  Tor.prototype.addOnion = async function (port, host, privateKey) {
    privateKey;
    if (host) {
      const validHost = /[a-zA-Z]+(:[0-9]+)?/.test(host);
      if (validHost) {
        return {
          host,
          port,
          ServiceID: "pubKey",
          PrivateKey: "privKey",
        } as hiddenService;
      } else {
        return {
          host,
          port,
          ServiceID: undefined,
          PrivateKey: undefined,
        } as hiddenService;
      }
    } else {
      return {
        host,
        port,
        ServiceID: "pubKey",
        PrivateKey: "privKey",
      } as hiddenService;
    }
  };
  let sandbox: Sinon.SinonSandbox;
  const mock = function (
    sandbox: Sinon.SinonSandbox,
    readFail?: boolean,
    writeFail?: boolean,
  ) {
    sandbox.stub(fs, "readFile").callsFake(async (path, options) => {
      path;
      options;
      if (readFail) {
        throw new Error();
      }
      return "privKey";
    });
    sandbox.stub(fs, "writeFile").callsFake(async (path, options) => {
      path;
      options;
      if (writeFail) {
        throw new Error();
      }
      return;
    });
  };

  beforeEach(() => {
    sandbox = Sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it("config emty", () => {
    const config = createTorConfig();
    expect(config).to.include({ port: 9051 });
  });
  it("config set", () => {
    Config.TOR_HOST = "localhost";
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "test";
    const config = createTorConfig();
    // deepcode ignore NoHardcodedPasswords/test: password is part of the test
    expect(config).to.include({
      host: "localhost",
      port: 9051,
      password: "test",
    });
  });
  it("tor connect fail", async () => {
    //mockTor(sandbox)
    Config.TOR_HOST = "localhost";
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";

    let client: Tor = undefined;
    try {
      client = await getTorClient();
      closeTorClient();
    } catch (error) {
      error;
    }
    expect(client).be.undefined;
  });
  it("tor connect sucess", async () => {
    //mockTor(sandbox)
    Config.TOR_HOST = hostname();
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";
    let client: Tor = undefined;
    try {
      client = await getTorClient();
      closeTorClient();
    } catch (error) {
      error;
    }
    expect(client).be.not.undefined;
  });
  it("add onion connect fail", async () => {
    //mockTor(sandbox)
    mock(sandbox);
    Config.TOR_HOST = "localhost";
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";

    let domain = undefined;
    try {
      domain = await addOnion(80);
      closeTorClient();
      //domain = undefined
    } catch {
      domain;
    }
    expect(domain).be.undefined;
  });
  it("add onion fail", async () => {
    //mockTor(sandbox)
    mock(sandbox);
    Config.TOR_HOST = hostname();
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";
    Config.NOSTR_CONFIG_DIR = "/home/node";

    let domain = undefined;
    try {
      domain = await addOnion(80, "}");
      closeTorClient();
    } catch {
      domain;
    }
    expect(domain).be.undefined;
  });
  it("add onion write fail", async () => {
    //mockTor(sandbox)
    mock(sandbox, false, true);
    Config.TOR_HOST = hostname();
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";

    let domain = undefined;
    try {
      domain = await addOnion(80);
      closeTorClient();
      //domain = undefined
    } catch {
      domain;
    }
    console.log("domain: " + domain);
    expect(domain).be.undefined;
  });
  it("add onion sucess read fail", async () => {
    mock(sandbox, true);
    Config.TOR_HOST = hostname();
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";

    let domain = undefined;
    try {
      domain = await addOnion(80);
      closeTorClient();
    } catch {
      domain;
    }
    console.log("domain: " + domain);
    expect(domain).be.not.undefined;
  });
  it("add onion sucess", async () => {
    mock(sandbox);
    Config.TOR_HOST = hostname();
    Config.TOR_CONTROL_PORT = "9051";
    Config.TOR_PASSWORD = "nostr_ts_relay";

    let domain = undefined;
    try {
      domain = await addOnion(80);
      closeTorClient();
    } catch {
      domain;
    }
    console.log("domain: " + domain);
    expect(domain).be.not.undefined;
  });
});
