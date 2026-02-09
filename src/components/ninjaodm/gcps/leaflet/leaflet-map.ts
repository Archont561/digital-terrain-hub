import L from "leaflet";
import { ImageMarker, GCPMarker } from "./markers";
import { ZoomToMarkersControl } from "./controls";

type Constructor<T = {}> = new (...args: any[]) => T;

// ─────────────────────────────────────────────────────────────
// Base Leaflet Map Element Mixin
// ─────────────────────────────────────────────────────────────

export function LeafletMapElement<TBase extends Constructor<HTMLElement>>(Base: TBase) {
  return class LeafletMapElementMixin extends Base {
    protected map: L.Map | null = null;
    protected markerLayer = L.featureGroup();
    protected isMapReady = false;
    protected selectedMarker: GCPMarker | ImageMarker | null = null;
    protected zoomControl: ZoomToMarkersControl | null = null;

    connectedCallback() {
      this.ensureStyles();
      this.initMap();
    }

    disconnectedCallback() {
      this.map?.remove();
      this.map = null;
      this.isMapReady = false;
      this.selectedMarker = null;
      this.zoomControl = null;
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
      this.updateZoomControlState();
    }

    public clearMarkers() {
      this.selectedMarker = null;
      this.markerLayer.clearLayers();
      this.updateZoomControlState();
    }

    public removeMarker(marker: GCPMarker | ImageMarker) {
      if (this.selectedMarker === marker) {
        this.selectedMarker = null;
      }
      this.markerLayer.removeLayer(marker);
      this.updateZoomControlState();
    }

    protected updateZoomControlState() {
      this.zoomControl?.setMarkerButtonEnabled(this.hasMarkers());
    }

    public zoomToMarkers(options?: L.FitBoundsOptions) {
      if (!this.hasMarkers()) return;
      this.map!.fitBounds(this.markerLayer.getBounds(), {
        padding: [20, 20],
        maxZoom: 18,
        ...options
      });
    }

    public hasMarkers(): boolean {
      return this.markerLayer.getLayers().length > 0;
    }

    public getMarkerCount(): number {
      return this.markerLayer.getLayers().length;
    }

    public getSelectedMarker(): GCPMarker | ImageMarker | null {
      return this.selectedMarker;
    }

    public clearSelection() {
      if (this.selectedMarker) {
        this.selectedMarker.deselect();
        this.selectedMarker = null;
      }
    }

    public getAllMarkers(): (GCPMarker | ImageMarker)[] {
      return this.markerLayer.getLayers() as (GCPMarker | ImageMarker)[];
    }

    public getMarkerByBindingId(bindingId: string): GCPMarker | ImageMarker | undefined {
      return this.getAllMarkers().find(m => m.bindingId === bindingId);
    }
  };
}

const LeafletBase = LeafletMapElement(HTMLElement);

// ─────────────────────────────────────────────────────────────
// Image Leaflet Map
// ─────────────────────────────────────────────────────────────

export class HTMLImageLeafletMap extends LeafletBase {
  private imgWidth = 0;
  private imgHeight = 0;
  private imageOverlay: L.ImageOverlay | null = null;
  declare protected selectedMarker: ImageMarker | null;
  declare protected zoomControl: ZoomToMarkersControl | null;

  protected createMap(): L.Map {
    const map = L.map(this, {
      maxZoom: 2,
      minZoom: -3,
      crs: L.CRS.Simple,
      zoomControl: true,
    }).setView([0, 0], 1);

    map.on("zoomend", () => {
      map.setMaxBounds(this.maxBounds);
    });

    // Add custom zoom control
    this.zoomControl = new ZoomToMarkersControl({
      position: 'topleft',
      showZoomToImage: true,
      onZoomToMarkers: () => this.zoomToMarkers(),
      onZoomToImage: () => this.zoomToImage()
    });
    this.zoomControl.addTo(map);
    this.zoomControl.setMarkerButtonEnabled(false);
    this.zoomControl.setImageButtonEnabled(false);

    return map;
  }

  get bounds(): L.LatLngBoundsExpression {
    return [[0, 0], [this.imgHeight, this.imgWidth]];
  }

  private get maxBounds(): L.LatLngBoundsExpression {
    const map = this.map!;

    const zoom = map.getZoom();
    const min = map.getMinZoom();
    const max = map.getMaxZoom();
    const ratio = (zoom - min) / (max - min);

    const paddingPct = 0.5 * (1 - ratio);

    const yPad = this.imgHeight * paddingPct;
    const xPad = this.imgWidth * paddingPct;

    return [
      [-yPad, -xPad],
      [this.imgHeight + yPad, this.imgWidth + xPad]
    ];
  }

  protected updateZoomControlState() {
    super.updateZoomControlState();
    this.zoomControl?.setImageButtonEnabled(this.hasImage());
  }

  public addImageOverlay(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imgWidth = img.naturalWidth;
        this.imgHeight = img.naturalHeight;
        this.imageOverlay?.remove();
        this.imageOverlay = L.imageOverlay(url, this.bounds).addTo(this.map!);
        this.map!.fitBounds(this.bounds);
        this.updateZoomControlState();
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  public addMarker(marker: ImageMarker) {
    marker.setLatLng(this.clampToImage(marker.getLatLng()));
    
    marker.on('select', () => {
      if (this.selectedMarker && this.selectedMarker !== marker) {
        this.selectedMarker.deselect();
      }
      this.selectedMarker = marker;
      this.dispatchEvent(new CustomEvent('marker:selected', { 
        bubbles: true, 
        detail: { marker, type: 'image' } 
      }));
    });

    marker.on('deselect', () => {
      if (this.selectedMarker === marker) {
        this.selectedMarker = null;
      }
      this.dispatchEvent(new CustomEvent('marker:deselected', { 
        bubbles: true, 
        detail: { marker, type: 'image' } 
      }));
    });

    if (marker.dragging) return;
    marker.on("drag", () => {
      marker.setLatLng(this.clampToImage(marker.getLatLng()));
    });
  
    super.addMarker(marker);
  }

  public getSelectedMarker(): ImageMarker | null {
    return this.selectedMarker;
  }

  public getCenter(): L.LatLng {
    return L.latLng(this.imgHeight / 2, this.imgWidth / 2);
  }

  public hasImage(): boolean {
    return this.imgWidth > 0 && this.imgHeight > 0;
  }

  public zoomToImage() {
    if (this.hasImage()) {
      this.map!.fitBounds(this.bounds);
    }
  }

  public clearImage() {
    this.imageOverlay?.remove();
    this.imageOverlay = null;
    this.imgWidth = 0;
    this.imgHeight = 0;
    this.updateZoomControlState();
  }

  private clampToImage(latlng: L.LatLng): L.LatLng {
    const lat = Math.max(0, Math.min(this.imgHeight, latlng.lat));
    const lng = Math.max(0, Math.min(this.imgWidth, latlng.lng));
    return L.latLng(lat, lng, latlng.alt);
  }
}

// ─────────────────────────────────────────────────────────────
// GCP Leaflet Map (OpenStreetMap)
// ─────────────────────────────────────────────────────────────

export class HTMLGCPLeafletMap extends LeafletBase {
  declare protected selectedMarker: GCPMarker | null;
  declare protected zoomControl: ZoomToMarkersControl | null;

  protected createMap(): L.Map {
    const map = L.map(this, {
      zoomControl: true,
    }).setView([0, 0], 2);

    // Add tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add custom zoom control
    this.zoomControl = new ZoomToMarkersControl({
      position: 'topleft',
      onZoomToMarkers: () => this.zoomToMarkers()
    });
    this.zoomControl.addTo(map);
    this.zoomControl.setMarkerButtonEnabled(false);

    return map;
  }

  public addMarker(marker: GCPMarker) {
    marker.on('select', () => {
      if (this.selectedMarker && this.selectedMarker !== marker) {
        this.selectedMarker.deselect();
      }
      this.selectedMarker = marker;
      this.dispatchEvent(new CustomEvent('marker:selected', { 
        bubbles: true, 
        detail: { marker, type: 'gcp' } 
      }));
    });

    marker.on('deselect', () => {
      if (this.selectedMarker === marker) {
        this.selectedMarker = null;
      }
      this.dispatchEvent(new CustomEvent('marker:deselected', { 
        bubbles: true, 
        detail: { marker, type: 'gcp' } 
      }));
    });

    super.addMarker(marker);
  }

  public getSelectedMarker(): GCPMarker | null {
    return this.selectedMarker;
  }

  public getCenter(): L.LatLng {
    return this.map!.getCenter();
  }

  public setView(latlng: L.LatLngExpression, zoom?: number): this {
    this.map!.setView(latlng, zoom ?? this.map!.getZoom());
    return this;
  }

  public panTo(latlng: L.LatLngExpression): this {
    this.map!.panTo(latlng);
    return this;
  }

  public getZoom(): number {
    return this.map!.getZoom();
  }

  public setZoom(zoom: number): this {
    this.map!.setZoom(zoom);
    return this;
  }
}