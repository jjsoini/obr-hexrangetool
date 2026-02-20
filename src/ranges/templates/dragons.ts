import { Range } from "../ranges";

export const dragons: Range = {
  name: "Dragons",
  id: "dragons",
  type: "square",
  hideLabel: true,
  rings: [
    {
      radius: 1,
      name: "5",
      id: "dragons-5",
    },
    {
      radius: 3,
      name: "15",
      id: "dragons-15",
    },
    {
      radius: 6,
      name: "30",
      id: "dragons-30",
    },
    {
      radius: 12,
      name: "60",
      id: "dragons-60",
    },
    {
      radius: 24,
      name: "120",
      id: "dragons-120",
    },
  ],
};
