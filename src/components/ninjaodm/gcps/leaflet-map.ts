import L from "leaflet";
import { ImageMarker, GCPMarker } from "./markers";

type Constructor<T = {}> = new (...args: any[]) => T;

export function LeafletMapElement<TBase extends Constructor<HTMLElement>>(Base: TBase) {
  return class LeafletMapElementMixin extends Base {
    protected map: L.Map | null = null;
    protected markerLayer = L.featureGroup();
    protected isMapReady = false;

    connectedCallback() {
      this.ensureStyles();
      this.initMap();
    }

    disconnectedCallback() {
      this.map?.remove();
      this.map = null;
      this.isMapReady = false;
      //@ts-ignore
      if (super.disconnectedCallback) super.disconnectedCallback();
    }

    protected ensureStyles() {
      const s = this.style;
      if (!s.display) s.display = "block";
      if (!s.position) s.position = "relative";
      if (!s.width) s.width = "100%";
      if (!s.height) s.height = "100%";
    }

    protected initMap() {
      if (this.isMapReady || !this.isConnected) return;

      this.map = this.createMap();
      this.markerLayer.addTo(this.map);
      this.isMapReady = true;

      this.dispatchEvent(
        new CustomEvent("leaflet:ready", { bubbles: true, detail: { map: this.map } })
      );
    }

    protected createMap(): L.Map {
      return L.map(this).setView([0, 0], 1);
    }

    public addMarker(marker: L.Marker) {
      marker.addTo(this.markerLayer);
    }

    public clearMarkers() {
      this.markerLayer.clearLayers();
    }

    public zoomToMarkers() {
      if (this.markerLayer.getLayers().length === 0) return;
      this.map!.fitBounds(this.markerLayer.getBounds());
    }
  };
}

const LeafletBase = LeafletMapElement(HTMLElement);

export class HTMLImageLeafletMap extends LeafletBase {
  private imgWidth = 0;
  private imgHeight = 0;
  private imageOverlay: L.ImageOverlay | null = null;

  protected createMap(): L.Map {
    return L.map(this, {
      maxZoom: 2,
      minZoom: -3,
      crs: L.CRS.Simple,
    }).setView([0, 0], 1).on("zoomend", () => {
      this.map!.setMaxBounds(this.maxBounds);
    });
  }

  get bounds(): L.LatLngBoundsExpression {
    return [[0, 0], [this.imgHeight, this.imgWidth]]
  }

  private get maxBounds(): L.LatLngBoundsExpression {
    const map = this.map!;

    const zoom = map.getZoom();
    const min = map.getMinZoom();
    const max = map.getMaxZoom();
    const ratio = (zoom - min) / (max - min);

    // 0% padding at Max Zoom, 50% padding at Min Zoom
    const paddingPct = 0.5 * (1 - ratio);

    const yPad = this.imgHeight * paddingPct;
    const xPad = this.imgWidth * paddingPct;

    return [
      [-yPad, -xPad],
      [this.imgHeight + yPad, this.imgWidth + xPad]
    ];
  }

  public addImageOverlay(url: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.imgWidth = img.naturalWidth;
      this.imgHeight = img.naturalHeight;
      this.imageOverlay?.remove();
      this.imageOverlay = L.imageOverlay(url, this.bounds).addTo(this.map!);
      this.map!.fitBounds(this.bounds);
    };
    img.src = url;
  }

  public addMarker(marker: ImageMarker) {
    marker.setLatLng(this.clampToImage(marker.getLatLng()));
    marker.once("add", () => {
      if (!marker.dragging) return;
      marker.on("drag", () => {
        marker.setLatLng(this.clampToImage(marker.getLatLng()));
      });
    });
    super.addMarker(marker);
  }

  private clampToImage(latlng: L.LatLng): L.LatLng {
    const lat = Math.max(0, Math.min(this.imgHeight, latlng.lat));
    const lng = Math.max(0, Math.min(this.imgWidth, latlng.lng));
    return L.latLng(lat, lng, latlng.alt);
  }
}

export class HTMLGCPLeafletMap extends LeafletBase {
  connectedCallback() {
    super.connectedCallback();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map!);
  }

  public addMarker(marker: GCPMarker) {
    super.addMarker(marker);
  }
}