import OBR from "@owlbear-rodeo/sdk";
import { createRangeTool } from "./createRangeTool";
import { createThemeAction } from "./createThemeAction";
import { createSettingsAction } from "./createSettingsAction";
import { syncSettings } from "./syncSettings";

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
  createRangeTool();
  createThemeAction();
  createSettingsAction();
}

init();
