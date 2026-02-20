import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../util/getPluginId";
import themeIcon from "../assets/theme.svg";

export function createThemeAction() {
  OBR.tool.createAction({
    id: getPluginId("action/theme"),
    icons: [
      {
        icon: themeIcon,
        label: "Range Theme",
        filter: {
          activeTools: ["rodeo.owlbear.tool/measure"],
          permissions: ["RULER_CREATE"],
        },
      },
    ],
    onClick(_, elementId) {
      OBR.popover.open({
        id: getPluginId("popover/theme"),
        url: "/theme.html",
        width: 240,
        height: 240,
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
