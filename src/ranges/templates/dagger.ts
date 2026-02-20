import { Range } from "../ranges";

export const dagger: Range = {
  name: "Dagger",
  id: "dagger",
  type: "circle",
  hideSize: true,
  rings: [
    {
      radius: 1,
      name: "Melee",
      id: "dagger-melee",
    },
    {
      radius: 3,
      name: "Very Close",
      id: "dagger-very-close",
    },
    {
      radius: 6,
      name: "Close",
      id: "dagger-close",
    },
    {
      radius: 12,
      name: "Far",
      id: "dagger-far",
    },
    {
      radius: 60,
      name: "Very Far",
      id: "dagger-very-far",
    },
  ],
};
