import type { AgentDriver, Context } from "../../../src/core/types.js";

let installCalled = false;
let authenticateCalled = false;
let uninstallCalled = false;

export function resetTracking() {
  installCalled = false;
  authenticateCalled = false;
  uninstallCalled = false;
}

export function getTracking() {
  return { installCalled, authenticateCalled, uninstallCalled };
}

export const driver: AgentDriver = {
  async isInstalled() {
    return false;
  },

  async install(_ctx: Context) {
    installCalled = true;
  },

  async authenticate(_ctx: Context) {
    authenticateCalled = true;
  },

  async uninstall(_ctx: Context) {
    uninstallCalled = true;
  },
};

export default driver;
