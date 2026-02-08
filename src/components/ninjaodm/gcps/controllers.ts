import { AlpineController } from "@/lib/client";
import type { HTMLGCPLeafletMap, HTMLImageLeafletMap } from "./leaflet-map";
import type { GCPProps } from "./models";
import { ImageMarker, GCPMarker } from "./markers";

export type GCPEditorManagerProps = {
  gcps?: GCPProps[];
};

export class GCPEditorManager extends AlpineController<GCPEditorManager, {
  gcpMap: HTMLGCPLeafletMap;
  imageMap: HTMLImageLeafletMap;
  imageThumbnailViewer: HTMLDivElement;
}> {
  private gcps: GCPProps[];
  currentImageUuid: string | null = null;
  activeTab = "gcp";
  viewport = "";

  isViewport(viewport: string) {
    return this.viewport == viewport;
  }

  isActiveTab(tab: string) {
    return this.activeTab == tab;
  }

  constructor({ gcps = [] }: GCPEditorManagerProps) {
    super();
    this.gcps = gcps;
  }

  protected async onInit() {
    this.ctx.$dispatch("starwind:init");
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = (e: MediaQueryList | MediaQueryListEvent) => {
      this.viewport = e.matches ? "desktop" : "mobile";
      console.log(this.viewport)
    }
    console.log('hfhgfhj')
    updateViewport(mdQuery);
    mdQuery.addEventListener("change", updateViewport);
  }

  private createGCPMarker(gcp: GCPProps) {
    const marker = new GCPMarker(gcp.gcp_point, {
      title: gcp.label,
    });
    marker.label = gcp.label;

    marker.on("dragend", async (e: L.DragEndEvent) => {
      const { lat, lng } = e.target.getLatLng();
      console.log("gcp moved", lat, lng)
    });

    return marker;
  }

  private createImageMarker(gcp: GCPProps) {
    const marker = new ImageMarker(gcp.image_point, gcp.image_uuid);

    marker.on("dragend", async (e: L.DragEndEvent) => {
      const { lat, lng } = e.target.getLatLng();
      console.log("image moved", lat, lng);
    });

    return marker;
  }

  async selectImage(el: HTMLImageElement) {
    const imageUuid = el.dataset.originUuid;
    const imageUrl = el.dataset.originUrl;
    if (!imageUuid || !imageUrl) return;

    this.currentImageUuid = imageUuid;
    this.ctx.$refs.imageMap.addImageOverlay(imageUrl);

    for (const gcp of this.gcps) {
      this.ctx.$refs.imageMap.addMarker(this.createImageMarker(gcp));
      this.ctx.$refs.gcpMap.addMarker(this.createGCPMarker(gcp));
    }
    this.ctx.$refs.gcpMap.zoomToMarkers();
    const sheetCloseBtn = this.ctx.$root.querySelector(`button[data-slot="sheet-close"]`) as HTMLButtonElement
    sheetCloseBtn?.click();
  }

  addMarkerOnCenter() {
    
  }
}
