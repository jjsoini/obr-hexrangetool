import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../util/getPluginId";
import { getLastUsedRange } from "../settings/lastUsed";
import { defaultRanges } from "../ranges/ranges";
import { getStoredColorRings } from "../settings/colorRings";

export function syncSettings() {
  onScene(async () => {
    const isGm = (await OBR.player.getRole()) === "GM";
    if (isGm) {
      syncRangeIfNeeded();
    }
  });

  onGm(async () => {
    const sceneReady = await OBR.scene.isReady();
    if (sceneReady) {
      syncRangeIfNeeded();
    }
  });
}

async function onScene(func: () => void) {
  OBR.scene.onReadyChange((ready) => {
    if (ready) {
      func();
    }
  });
  const ready = await OBR.scene.isReady();
  if (ready) {
    func();
  }
}

async function onGm(func: () => void) {
  let isGm = false;
  OBR.player.onChange((player) => {
    if (player.role === "GM" && !isGm) {
      func();
    }
    isGm = player.role === "GM";
  });
  isGm = (await OBR.player.getRole()) === "GM";
  if (isGm) {
    func();
  }
}

let syncing = false;
async function syncRangeIfNeeded() {
  if (syncing) {
    return;
  }
  try {
    syncing = true;
    const metadata = await OBR.scene.getMetadata();
    const update: Record<string, unknown> = {};
    if (!metadata[getPluginId("range")]) {
      update[getPluginId("range")] = getLastUsedRange() ?? defaultRanges[0];
    }
    if (metadata[getPluginId("colorRings")] === undefined) {
      update[getPluginId("colorRings")] = getStoredColorRings();
    }
    if (Object.keys(update).length === 0) {
      return;
    }
    await OBR.scene.setMetadata(update);
  } finally {
    syncing = false;
  }
}
