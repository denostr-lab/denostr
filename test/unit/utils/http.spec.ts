import { expect } from "chai";
import { beforeEach, describe, it } from "jest";
import { Request } from "oak";

import { Settings } from "../../../src/@types/settings.ts";
import { getRemoteAddress } from "../../../src/utils/http.ts";

describe("getRemoteAddress", () => {
  const header = "x-forwarded-for";
  const socketAddress = "socket-address";
  const address = "address";

  let request: Request;

  beforeEach(() => {
    request = {
      headers: {
        [header]: address,
      },
      socket: {
        remoteAddress: socketAddress,
      },
    } as unknown as Request;
  });

  it("returns address using network.remote_ip_address when set", () => {
    expect(
      getRemoteAddress(
        request,
        { network: { "remote_ip_header": header } } as Pick<
          Settings,
          "network"
        >,
      ),
    ).to.equal(address);
  });

  it("returns address using network.remoteIpAddress when set", () => {
    expect(
      getRemoteAddress(
        request,
        { network: { remoteIpHeader: header } } as Pick<Settings, "network">,
      ),
    ).to.equal(address);
  });

  it("returns address from socket when header is unset", () => {
    expect(
      getRemoteAddress(
        request,
        { network: {} } as Pick<Settings, "network">,
      ),
    ).to.equal(socketAddress);
  });
});
