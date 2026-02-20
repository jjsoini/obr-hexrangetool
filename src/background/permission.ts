import type { Item, Permission } from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";

export function getPermissionForItem(item: Item): Permission | undefined {
  if (item.layer === "MAP") {
    return "MAP_UPDATE";
  } else if (item.layer === "PROP") {
    return "PROP_UPDATE";
  } else if (item.layer === "MOUNT") {
    return "MOUNT_UPDATE";
  } else if (item.layer === "CHARACTER") {
    return "CHARACTER_UPDATE";
  } else if (item.layer === "ATTACHMENT") {
    return "ATTACHMENT_UPDATE";
  } else if (item.layer === "NOTE") {
    return "NOTE_UPDATE";
  } else if (item.layer === "RULER") {
    return "RULER_UPDATE";
  } else if (item.layer === "POINTER") {
    return "POINTER_UPDATE";
  } else if (item.layer === "TEXT") {
    return "TEXT_UPDATE";
  } else if (item.layer === "FOG") {
    return "FOG_UPDATE";
  } else if (item.layer === "DRAWING") {
    return "DRAWING_UPDATE";
  } else {
    return undefined;
  }
}

export async function canUpdateItem(item: Item) {
  const role = await OBR.player.getRole();
  if (role === "GM") {
    return true;
  }
  const permission = getPermissionForItem(item);
  if (!permission) {
    return false;
  }
  const hasPermission = await OBR.player.hasPermission(permission);
  const hasOwnerOnlyPermission =
    item.layer === "CHARACTER" &&
    (await OBR.player.hasPermission("CHARACTER_OWNER_ONLY"));
  if (hasPermission && hasOwnerOnlyPermission) {
    return item.createdUserId === OBR.player.id;
  }
  return hasPermission;
}
