import { createContext, useContext } from "react";

/** Row height for tables inside a DataPanel: "comfortable" (default) or "compact". */
export const DensityContext = createContext({ density: "comfortable", setDensity: null });

export const useDensity = () => useContext(DensityContext);
