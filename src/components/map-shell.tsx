"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./map-view";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-paper-dim text-xs tracking-[0.2em] text-ink-faint uppercase">
      Memuat peta…
    </div>
  ),
});

export default function MapShell(props: MapViewProps) {
  return <MapView {...props} />;
}
