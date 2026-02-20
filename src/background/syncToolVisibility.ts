import OBR from "@owlbear-rodeo/sdk";
import { registerRangeTool, unregisterRangeTool } from "./createRangeTool";
import { registerSettingsAction, unregisterSettingsAction } from "./createSettingsAction";

let registered = false;

async function register() {
  if (registered) return;
  registered = true;
  await registerRangeTool();
  await registerSettingsAction();
}

async function unregister() {
  if (!registered) return;
  registered = false;
  await Promise.allSettled([
    unregisterRangeTool(),
    unregisterSettingsAction(),
  ]);
}

async function update() {
  const sceneReady = await OBR.scene.isReady();
  if (!sceneReady) {
    await unregister();
    return;
  }
  const gridType = await OBR.scene.grid.getType();
  const isHex = gridType === "HEX_HORIZONTAL" || gridType === "HEX_VERTICAL";
  if (isHex) {
    await register();
  } else {
    await unregister();
  }
}

export function syncToolVisibility() {
  OBR.scene.onReadyChange(() => update());
  OBR.scene.grid.onChange(() => update());
  update();
}
