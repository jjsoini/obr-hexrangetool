import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import AddRounded from "@mui/icons-material/AddRounded";

import { Range } from "../ranges/ranges";
import IconButton from "@mui/material/IconButton";
import CheckRounded from "@mui/icons-material/CheckRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import PaletteRounded from "@mui/icons-material/PaletteRounded";
import Tooltip from "@mui/material/Tooltip";

export function RangeSelector({
  selectedRange,
  customRanges,
  defaultRanges,
  onSelect,
  onAdd,
  onEdit,
  isEditing,
  isCustom,
  outdatedRange,
  colorRings,
  onToggleColorRings,
}: {
  selectedRange: Range;
  customRanges: Range[];
  defaultRanges: Range[];
  onSelect: (range: Range) => void;
  onAdd: (range: Range) => void;
  onEdit: () => void;
  isEditing: boolean;
  isCustom: boolean;
  outdatedRange: boolean;
  colorRings: boolean;
  onToggleColorRings: () => void;
}) {
  const ranges = [...defaultRanges, ...customRanges];

  function onAddRange() {
    const newRange = {
      ...selectedRange,
      id: crypto.randomUUID(),
      name: `Range ${customRanges.length + 1}`,
      rings: selectedRange.rings.map((ring) => ({
        ...ring,
        id: crypto.randomUUID(),
      })),
    };
    onAdd(newRange);
  }

  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      sx={{ position: "relative" }}
    >
      <Select
        value={outdatedRange ? undefined : selectedRange.id}
        onChange={(event) => {
          const range = ranges.find((range) => range.id === event.target.value);
          if (range) {
            onSelect(range);
          }
        }}
        renderValue={(value) =>
          ranges.find((range) => range.id === value)?.name
        }
        size="small"
        fullWidth
        MenuProps={{
          elevation: 20,
        }}
      >
        {defaultRanges.map((range) => (
          <MenuItem key={range.id} value={range.id} sx={{ minHeight: "auto" }}>
            {range.name}
          </MenuItem>
        ))}
        {customRanges.length > 0 && <Divider />}
        {customRanges.map((range) => (
          <MenuItem key={range.id} value={range.id} sx={{ minHeight: "auto" }}>
            {range.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={onAddRange}
          sx={{ justifyContent: "space-between", minHeight: "auto" }}
        >
          New Range
          <AddRounded />
        </MenuItem>
      </Select>
      {isCustom && !outdatedRange && (
        <IconButton onClick={onEdit} size="small">
          {isEditing ? <CheckRounded /> : <EditRounded />}
        </IconButton>
      )}
      <Tooltip title={colorRings ? "Hide Ring Colors" : "Show Ring Colors"}>
        <IconButton
          onClick={onToggleColorRings}
          size="small"
          color={colorRings ? "primary" : "default"}
          aria-pressed={colorRings}
          aria-label="Ring Colors"
        >
          <PaletteRounded />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
