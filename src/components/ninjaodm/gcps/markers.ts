import L from "leaflet";

/* ------------------- Utils ------------------- */
export function getMarkerId() {
  return `marker-${Math.floor(10000 + Math.random() * 90000)}`;
}

/* ------------------- Binding Mixin ------------------- */
type Constructor<T = {}> = new (...args: any[]) => T;

export function Bindable<TBase extends Constructor<L.Marker>>(Base: TBase) {
  return class BindableMarker extends Base {
    bindingId?: string;

    bindTo(id: string) {
      this.bindingId = id;
    }

    unbind() {
      this.bindingId = undefined;
    }

    isBound(): boolean {
      return !!this.bindingId;
    }
  };
}

/* ------------------- Base Bindable Marker ------------------- */
const BindableMarker = Bindable(L.Marker);

/* ------------------- GCP Marker ------------------- */
export class GCPMarker extends BindableMarker {
  readonly id: string = getMarkerId();
  uuid?: string;
  label?: string;

  constructor(latlng: L.LatLngExpression, options: L.MarkerOptions = {}) {
    super(latlng, { draggable: true, ...options });
  }

  setAlt(alt?: number) {
    const ll = this.getLatLng();
    this.setLatLng(L.latLng(ll.lat, ll.lng, alt));
  }

  getAlt(): number | undefined {
    return this.getLatLng().alt;
  }
}

/* ------------------- Image Marker ------------------- */
export class ImageMarker extends BindableMarker {
  readonly id: string = getMarkerId();
  readonly imageUuid: string;

  constructor(latlng: L.LatLngExpression, imageUuid: string, options: L.MarkerOptions = {}) {
    super(latlng, { draggable: true, ...options });
    this.imageUuid = imageUuid;
  }
}
