import { useEffect, useMemo, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import {
  defaultRanges,
  getCustomRanges,
  setCustomRanges as setStoredCustomRanges,
  Range,
} from "../ranges/ranges";
import { RangeEditor } from "./RangeEditor";
import { RangeSelector } from "./RangeSelector";
import { getPluginId } from "../util/getPluginId";
import { setLastUsedRange } from "./lastUsed";
import { useOBRContext } from "./OBRContext";

function useCustomRanges() {
  const [customRanges, setCustomRanges] = useState<Range[]>(() =>
    getCustomRanges()
  );

  useEffect(() => {
    setStoredCustomRanges(customRanges);
  }, [customRanges]);

  return [customRanges, setCustomRanges] as const;
}

export function Settings() {
  const { range: defaultRange } = useOBRContext();
  const [selectedRange, setSelectedRange] = useState<Range>(defaultRange);
  const [editing, setEditing] = useState(false);
  const [customRanges, setCustomRanges] = useCustomRanges();
  const [storageIsAvailable] = useState(() => {
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
    } catch (error) {
      return false;
    }
  });

  function onSelectRange(range: Range, edit: boolean = false) {
    setSelectedRange(range);
    setLastUsedRange(range);
    OBR.scene.setMetadata({ [getPluginId("range")]: range });
    if (edit) {
      setEditing(true);
    }
  }

  function onDeleteRange(range: Range) {
    setCustomRanges(customRanges.filter((r) => r.id !== range.id));
    if (range.id === selectedRange.id) {
      onSelectRange(defaultRanges[0]);
    }
    setEditing(false);
  }

  function onAddRange(range: Range) {
    setCustomRanges([...customRanges, range]);
    onSelectRange(range, true);
  }

  function onChangeRange(range: Range) {
    setCustomRanges(customRanges.map((r) => (r.id === range.id ? range : r)));
    if (range.id === selectedRange.id) {
      setSelectedRange(range);
      setLastUsedRange(range);
      OBR.scene.setMetadata({ [getPluginId("range")]: range });
    }
  }

  const unavailableRange = useMemo(() => {
    const ranges = [...customRanges, ...defaultRanges];
    return !ranges.find((r) => r.id === selectedRange.id);
  }, [customRanges, selectedRange]);

  const outdatedRange = useMemo(() => {
    const customRange = customRanges.find((r) => r.id === selectedRange.id);
    if (!customRange) {
      return false;
    }
    const isEqual =
      JSON.stringify(customRange) === JSON.stringify(selectedRange);
    return !isEqual;
  }, [customRanges, selectedRange]);

  if (!storageIsAvailable) {
    return (
      <Alert severity="error" sx={{ height: "258px" }}>
        <AlertTitle>Storage is not available</AlertTitle>
        The plugin is unable to change the range. Please enable third-party
        cookies.
      </Alert>
    );
  }

  return (
    <Stack sx={{ height: "258px", p: 1, pb: 0, gap: 1 }}>
      <RangeSelector
        selectedRange={selectedRange}
        onSelect={onSelectRange}
        customRanges={customRanges}
        defaultRanges={defaultRanges}
        onAdd={onAddRange}
        onEdit={() => {
          setEditing((prev) => !prev);
        }}
        isEditing={editing}
        isCustom={
          !outdatedRange && customRanges.some((r) => r.id === selectedRange.id)
        }
        outdatedRange={outdatedRange}
      />
      {unavailableRange && (
        <Alert severity="warning">
          "{selectedRange.name}" not found on this device. Please select a new
          one.
        </Alert>
      )}
      {outdatedRange && (
        <Alert severity="warning">
          "{selectedRange.name}" out of sync with saved range. Select a new
          range to update.
        </Alert>
      )}
      <RangeEditor
        range={selectedRange}
        onChange={editing ? onChangeRange : undefined}
        onDelete={editing ? onDeleteRange : undefined}
      />
    </Stack>
  );
}
