import { useState } from "react";

import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CloseRounded from "@mui/icons-material/CloseRounded";
import IconButton from "@mui/material/IconButton";
import { keyframes } from "@mui/material/styles";

import { type Ring, type RangeType } from "../ranges/ranges";
import { Color } from "../theme/themes";
import NumberField from "../util/NumberField";
import { useOBRContext } from "./OBRContext";
import { flattenGridScale } from "../util/flattenGridScale";

const slideInRight = keyframes`
  from {
    width: 0;
  }
  to {
    width: var(--width);
  }
`;

export function RingItem({
  ring,
  color,
  complete,
  iconRadius,
  onChange,
  onDelete,
  ringIndex,
  hideSize,
  hideLabel,
  rangeType,
}: {
  color: Color;
  ring: Ring;
  complete: number;
  iconRadius: number;
  onChange?: (ring: Ring) => void;
  onDelete?: () => void;
  ringIndex: number;
  hideSize?: boolean;
  hideLabel?: boolean;
  rangeType: RangeType;
}) {
  const { gridScale } = useOBRContext();
  const [localName, setLocalName] = useState(ring.name);

  const primary = onChange ? (
    <TextField
      value={localName}
      onChange={(e) =>
        e.target.value.length < 50 && setLocalName(e.target.value)
      }
      onBlur={() => onChange({ ...ring, name: localName })}
      size="small"
      slotProps={{
        input: {
          sx: {
            bgcolor: "background.paper",
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))"
                : undefined,
          },
        },
      }}
    />
  ) : (
    <ListItemText
      primary={`${hideLabel ? "" : ring.name}${
        !hideLabel && !hideSize && ring.name ? " " : ""
      }${hideSize ? "" : flattenGridScale(gridScale, ring.radius)}`}
    />
  );

  const secondary = onChange ? (
    <NumberField
      aria-label="Range"
      variant="outlined"
      numberToText={(value) =>
        `${(value * gridScale.parsed.multiplier).toFixed(
          gridScale.parsed.digits
        )}`
      }
      textToNumber={(value) => parseFloat(value) / gridScale.parsed.multiplier}
      step={1}
      min={1}
      max={1000}
      size="small"
      value={ring.radius}
      onChange={(value) => onChange({ ...ring, radius: value })}
      autoComplete="off"
      sx={{ width: "86px" }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {gridScale.parsed.unit}
            </InputAdornment>
          ),
          inputProps: {
            sx: {
              textAlign: "inherit",
            },
          },
          sx: {
            bgcolor: "background.paper",
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))"
                : undefined,
          },
        },
      }}
    />
  ) : hideSize ? (
    <ListItemText
      secondary={flattenGridScale(gridScale, ring.radius)}
      sx={{ textAlign: "end" }}
    />
  ) : null;

  return (
    <ListItem
      sx={{
        position: "relative",
        my: 0.5,
        pl: 1,
        pr: 0.5,
        gap: onChange ? 1 : 0.5,
        py: onChange ? 0 : "1px",
      }}
      disablePadding
    >
      {primary}
      {secondary}
      {!onChange && (
        <ListItemIcon sx={{ opacity: 0.7, minWidth: 0 }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {rangeType === "circle" ? (
              <circle
                cx="12"
                cy="12"
                r={iconRadius}
                stroke="currentColor"
                strokeWidth="2"
              />
            ) : (
              <rect
                x={12 - iconRadius}
                y={12 - iconRadius}
                width={iconRadius * 2}
                height={iconRadius * 2}
                stroke="currentColor"
                strokeWidth="2"
              />
            )}
          </svg>
        </ListItemIcon>
      )}
      {onDelete && (
        <IconButton size="small" onClick={onDelete}>
          <CloseRounded />
        </IconButton>
      )}
      <Box
        style={{ "--width": `${complete * 100}%` } as React.CSSProperties}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: -1,
          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          borderTopLeftRadius: "8px",
          borderBottomLeftRadius: "8px",
          borderTopRightRadius: "20px",
          borderBottomRightRadius: "20px",
          animation: (theme) =>
            `${slideInRight} ${theme.transitions.duration.shorter}ms ease-out ${
              ringIndex * 100
            }ms both`,
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            width: "var(--width)",
          },
          opacity: 0.2,
        }}
      />
    </ListItem>
  );
}
