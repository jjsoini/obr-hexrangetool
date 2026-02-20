import { useState } from "react";

import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";

import DeleteRounded from "@mui/icons-material/DeleteRounded";
import AddRounded from "@mui/icons-material/AddRounded";

import { SmallLabel } from "./SmallLabel";
import { RingItem } from "./RingItem";
import { RangeTypeButtonGroup } from "./RangeTypeButtonGroup";
import { getStoredTheme } from "../theme/themes";
import { Range } from "../ranges/ranges";

export function RangeEditor({
  range,
  onChange,
  onDelete,
}: {
  range: Range;
  onChange?: (range: Range) => void;
  onDelete?: (range: Range) => void;
}) {
  const [theme] = useState(() => getStoredTheme());

  function addRing() {
    const maxRadius = Math.max(...range.rings.map((r) => r.radius));
    onChange?.({
      ...range,
      rings: [
        ...range.rings,
        {
          name: `Ring ${range.rings.length + 1}`,
          radius: maxRadius + 1,
          id: crypto.randomUUID(),
        },
      ],
    });
  }

  const maxRadius = Math.max(...range.rings.map((r) => r.radius));
  // Fudge the numbers a bit so the graph looks better.
  // We add 1 so the min radius is 2 as log(1) is 0 and we want to start at 1
  const logMaxRadius = Math.log(maxRadius + 1);

  return (
    <Stack gap={1} sx={{ overflowY: "auto", pb: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <List disablePadding>
          {range.rings.map((ring, i, rings) => {
            const color = theme.colors[i % theme.colors.length];
            const logRadius = Math.log(ring.radius + 1);
            const logComplete = logRadius / logMaxRadius;
            return (
              <RingItem
                key={ring.id}
                ring={ring}
                color={color}
                complete={logComplete}
                iconRadius={i + 1}
                ringIndex={i}
                onChange={
                  onChange
                    ? (ring) => {
                        const newRings = [...rings];
                        newRings[i] = ring;
                        onChange?.({ ...range, rings: newRings });
                      }
                    : undefined
                }
                onDelete={
                  onChange
                    ? () => {
                        const newRings = [...rings];
                        newRings.splice(i, 1);
                        onChange?.({ ...range, rings: newRings });
                      }
                    : undefined
                }
                hideLabel={range.hideLabel}
                hideSize={range.hideSize}
                rangeType={range.type}
              />
            );
          })}
        </List>
      </Box>
      {onChange && (
        <Button
          variant="outlined"
          fullWidth
          size="small"
          onClick={addRing}
          disabled={range.rings.length >= 10}
          startIcon={<AddRounded />}
        >
          Add Ring
        </Button>
      )}
      {onChange && onDelete && (
        <Controls range={range} onChange={onChange} onDelete={onDelete} />
      )}
    </Stack>
  );
}

function Controls({
  range,
  onChange,
  onDelete,
}: {
  range: Range;
  onChange: (range: Range) => void;
  onDelete: (range: Range) => void;
}) {
  const [localName, setLocalName] = useState(range.name);
  return (
    <>
      <Divider sx={{ my: 1 }} />
      <TextField
        label="Name"
        aria-labelledby="name-label"
        value={localName}
        onChange={(e) =>
          e.target.value.length < 50 && setLocalName(e.target.value)
        }
        onBlur={() => onChange({ ...range, name: localName })}
        size="small"
      />
      <Stack
        direction="row"
        gap={1}
        sx={{ mt: 0.5 }}
        width="100%"
        alignItems="start"
        justifyContent="space-around"
      >
        <FormControl sx={{ minWidth: 68 }}>
          <SmallLabel>Show Label</SmallLabel>
          <Switch
            sx={{ ml: 0, overflow: "visible" }}
            checked={!range.hideLabel}
            onChange={(_, checked) =>
              onChange({ ...range, hideLabel: !checked })
            }
          />
        </FormControl>
        <FormControl sx={{ minWidth: 68 }}>
          <SmallLabel>Show Size</SmallLabel>
          <Switch
            sx={{ ml: 0, overflow: "visible" }}
            checked={!range.hideSize}
            onChange={(_, checked) =>
              onChange({ ...range, hideSize: !checked })
            }
          />
        </FormControl>
        <RangeTypeButtonGroup
          value={range.type}
          onChange={(type) => {
            onChange({ ...range, type });
          }}
        />
        <FormControl>
          <SmallLabel id="delete-label">Delete</SmallLabel>
          <IconButton
            onClick={() => onDelete(range)}
            color="error"
            aria-labelledby="delete-label"
          >
            <DeleteRounded />
          </IconButton>
        </FormControl>
      </Stack>
    </>
  );
}
