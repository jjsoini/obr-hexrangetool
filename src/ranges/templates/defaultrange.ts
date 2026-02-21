import { Range } from "../ranges";

export const defaultrange: Range = {
  name: "Default",
  id: "defaultrange",
  hideSize: true,
  rings: [
    {
      radius: 0.5,
      name: "Same",
      id: "default-samehex",
    },
    {
      radius: 1,
      name: "Adjacent",
      id: "default-adjacent",
    },
    {
      radius: 2,
      name: "Close",
      id: "default-close",
    },
    {
      radius: 3,
      name: "Near",
      id: "default-near",
    },
    {
      radius: 4,
      name: "Far",
      id: "default-far",
    },
  ],
};
