import L from "leaflet";

/* ------------------- Utils ------------------- */
export function getMarkerId() {
  return `marker-${Math.floor(10000 + Math.random() * 90000)}`;
}

/* ------------------- Custom Icons ------------------- */
const defaultIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
           <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const selectedIcon = L.divIcon({
  className: 'custom-marker selected',
  html: `<div class="w-8 h-8 bg-yellow-500 border-3 border-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
           <div class="w-3 h-3 bg-white rounded-full"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const boundIcon = L.divIcon({
  className: 'custom-marker bound',
  html: `<div class="w-6 h-6 bg-green-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
           <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const unboundIcon = L.divIcon({
  className: 'custom-marker unbound',
  html: `<div class="w-6 h-6 bg-orange-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
           <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

/* ------------------- Selectable & Bindable Mixin ------------------- */
type Constructor<T = {}> = new (...args: any[]) => T;

export interface SelectableMarker {
  isSelected: boolean;
  select(): void;
  deselect(): void;
  toggleSelect(): void;
}

export interface BindableMarker {
  bindingId?: string;
  bindTo(id: string): void;
  unbind(): void;
  isBound(): boolean;
}

export function SelectableBindable<TBase extends Constructor<L.Marker>>(Base: TBase) {
  return class SelectableBindableMarker extends Base implements SelectableMarker, BindableMarker {
    bindingId?: string;
    isSelected = false;

    constructor(...args: any[]) {
      super(...args);
      this.updateIcon();
    }

    bindTo(id: string) {
      this.bindingId = id;
      this.updateIcon();
    }

    unbind() {
      this.bindingId = undefined;
      this.updateIcon();
    }

    isBound(): boolean {
      return !!this.bindingId;
    }

    select() {
      this.isSelected = true;
      this.updateIcon();
      this.fire('select', { marker: this });
    }

    deselect() {
      this.isSelected = false;
      this.updateIcon();
      this.fire('deselect', { marker: this });
    }

    toggleSelect() {
      if (this.isSelected) {
        this.deselect();
      } else {
        this.select();
      }
    }

    protected updateIcon() {
      if (this.isSelected) {
        this.setIcon(selectedIcon);
      } else if (this.isBound()) {
        this.setIcon(boundIcon);
      } else {
        this.setIcon(unboundIcon);
      }
    }
  };
}

/* ------------------- Base Selectable Bindable Marker ------------------- */
const SelectableBindableMarker = SelectableBindable(L.Marker);

/* ------------------- GCP Marker ------------------- */
export class GCPMarker extends SelectableBindableMarker {
  readonly id: string = getMarkerId();
  uuid?: string;
  label: string = '';

  constructor(latlng: L.LatLngExpression, options: L.MarkerOptions = {}) {
    super(latlng, { draggable: true, ...options });
    
    this.on('click', () => {
      this.toggleSelect();
    });
  }

  setAlt(alt?: number) {
    const ll = this.getLatLng();
    this.setLatLng(L.latLng(ll.lat, ll.lng, alt));
  }

  getAlt(): number | undefined {
    return this.getLatLng().alt;
  }

  toGCPPoint(): [number, number, number] {
    const ll = this.getLatLng();
    return [ll.lat, ll.lng, ll.alt ?? 0];
  }
}

/* ------------------- Image Marker ------------------- */
export class ImageMarker extends SelectableBindableMarker {
  readonly id: string = getMarkerId();
  readonly imageUuid: string;

  constructor(latlng: L.LatLngExpression, imageUuid: string, options: L.MarkerOptions = {}) {
    super(latlng, { draggable: true, ...options });
    this.imageUuid = imageUuid;

    this.on('click', () => {
      this.toggleSelect();
    });
  }

  toImagePoint(): [number, number] {
    const ll = this.getLatLng();
    return [ll.lng, ll.lat]; // x, y format
  }
}