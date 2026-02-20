import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { RangeType } from "../ranges/ranges";
import Stack from "@mui/material/Stack";
import Circle from "@mui/icons-material/CircleRounded";
import Square from "@mui/icons-material/SquareRounded";
import { SmallLabel } from "./SmallLabel";

export function RangeTypeButtonGroup({
  value,
  onChange,
}: {
  value: RangeType;
  onChange: (value: RangeType) => void;
}) {
  return (
    <Stack>
      <SmallLabel id="range-type-label">Shape</SmallLabel>
      <ToggleButtonGroup
        value={value}
        onChange={(_, value) => {
          if (value) {
            onChange(value);
          }
        }}
        exclusive
        aria-labelledby="range-type-label"
        size="small"
        sx={{
          my: 0.5,
        }}
      >
        <ToggleButton value="circle" aria-label="Circle">
          <Circle fontSize="small" />
        </ToggleButton>
        <ToggleButton value="square" aria-label="Square">
          <Square fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
