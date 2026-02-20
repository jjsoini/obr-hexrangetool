import OBR, { type GridScale } from "@owlbear-rodeo/sdk";
import { createContext, useContext, useState, useEffect } from "react";
import { getPluginId } from "../util/getPluginId";
import { defaultRanges, Range } from "../ranges/ranges";

type OBRContextValue = {
  gridScale: GridScale;
  range: Range;
};

const OBRContext = createContext<OBRContextValue | null>(null);

export function OBRContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [gridScale, setGridScale] = useState<GridScale | null>(null);
  useEffect(() => {
    let mounted = true;
    OBR.scene.grid.getScale().then((scale) => {
      if (mounted) {
        setGridScale(scale);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const [range, setRange] = useState<Range | null>(null);
  useEffect(() => {
    let mounted = true;
    OBR.scene.getMetadata().then((metadata) => {
      if (mounted) {
        const range = (metadata[getPluginId("range")] ??
          defaultRanges[0]) as Range;
        setRange(range);
      }
    });
  }, []);

  if (!gridScale || !range) {
    return null;
  }

  return (
    <OBRContext.Provider value={{ gridScale, range }}>
      {children}
    </OBRContext.Provider>
  );
}

export function useOBRContext() {
  const context = useContext(OBRContext);
  if (!context) {
    throw new Error("useOBRContext must be used within an OBRContextProvider");
  }
  return context;
}
