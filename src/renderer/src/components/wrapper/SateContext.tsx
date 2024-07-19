import { createContext } from "react";
import { create } from "zustand";

const useFooBar = create(() => ({ tabs: new Map() }));

export const SateContext = createContext<{
  scrollCache: Map<string, number>;
  otherCache: Map<string, Map<string, number | string>>;
} | null>(null);
