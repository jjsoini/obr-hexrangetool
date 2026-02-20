import OBR from "@owlbear-rodeo/sdk";
import { syncSettings } from "./syncSettings";
import { syncToolVisibility } from "./syncToolVisibility";

async function waitUntilOBRReady() {
  return new Promise<void>((resolve) => {
    OBR.onReady(() => {
      resolve();
    });
  });
}

async function init() {
  await waitUntilOBRReady();
  syncSettings();
  syncToolVisibility();
}

init();
