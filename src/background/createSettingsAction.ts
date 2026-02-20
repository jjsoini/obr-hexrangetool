import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../util/getPluginId";
import settingsIcon from "../assets/settings.svg";

export function createSettingsAction() {
  OBR.tool.createAction({
    id: getPluginId("action/settings"),
    icons: [
      {
        icon: settingsIcon,
        label: "Range Settings",
        filter: {
          activeTools: ["rodeo.owlbear.tool/measure"],
          permissions: ["RULER_CREATE"],
          roles: ["GM"],
        },
      },
    ],
    onClick(_, elementId) {
      OBR.popover.open({
        id: getPluginId("popover/settings"),
        url: "/settings.html",
        width: 350,
        height: 258,
        anchorElementId: elementId,
        anchorOrigin: {
          horizontal: "CENTER",
          vertical: "BOTTOM",
        },
        transformOrigin: {
          horizontal: "CENTER",
          vertical: "TOP",
        },
      });
    },
  });
}
