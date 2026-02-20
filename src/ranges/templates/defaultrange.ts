import { Range } from "../ranges";

export const defaultrange: Range = {
  name: "Default",
  id: "defaultrange",
  type: "circle",
  hideSize: true,
  rings: [
    {
      radius: 1,
      name: "Melee",
      id: "default-melee",
    },
    {
      radius: 2,
      name: "Very Close",
      id: "default-very-close",
    },
    {
      radius: 3,
      name: "Close",
      id: "default-close",
    },
    {
      radius: 4,
      name: "Far",
      id: "default-far",
    },
    {
      radius: 5,
      name: "Very Far",
      id: "default-very-far",
    },
  ],
};
