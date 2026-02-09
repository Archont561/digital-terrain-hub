import L from "leaflet";

export interface ZoomToMarkersControlOptions extends L.ControlOptions {
  position?: L.ControlPosition;
  onZoomToMarkers?: () => void;
  onZoomToImage?: () => void;
  showZoomToImage?: boolean;
  markerButtonTitle?: string;
  imageButtonTitle?: string;
}

export class ZoomToMarkersControl extends L.Control {
  declare options: ZoomToMarkersControlOptions;
  
  private container: HTMLElement | null = null;
  private markerButton: HTMLAnchorElement | null = null;
  private imageButton: HTMLAnchorElement | null = null;

  constructor(options?: ZoomToMarkersControlOptions) {
    super(options);
    
    this.options = {
      position: 'topleft',
      showZoomToImage: false,
      markerButtonTitle: 'Zoom to all markers',
      imageButtonTitle: 'Zoom to image',
      ...options
    };
  }

  onAdd(map: L.Map): HTMLElement {
    this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom-zoom');
    
    // Zoom to markers button
    this.markerButton = this.createButton(
      this.options.markerButtonTitle!,
      'leaflet-control-zoom-markers',
      this.getMarkerIcon(),
      () => this.options.onZoomToMarkers?.()
    );
    this.container.appendChild(this.markerButton);

    // Zoom to image button (optional)
    if (this.options.showZoomToImage) {
      this.imageButton = this.createButton(
        this.options.imageButtonTitle!,
        'leaflet-control-zoom-image',
        this.getImageIcon(),
        () => this.options.onZoomToImage?.()
      );
      this.container.appendChild(this.imageButton);
    }

    return this.container;
  }

  onRemove(map: L.Map): void {
    if (this.markerButton) {
      L.DomEvent.off(this.markerButton);
      this.markerButton = null;
    }
    if (this.imageButton) {
      L.DomEvent.off(this.imageButton);
      this.imageButton = null;
    }
    this.container = null;
  }

  private createButton(
    title: string,
    className: string,
    html: string,
    onClick: () => void
  ): HTMLAnchorElement {
    const button = L.DomUtil.create('a', className) as HTMLAnchorElement;
    button.href = '#';
    button.title = title;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', title);
    button.innerHTML = html;

    L.DomEvent
      .on(button, 'click', L.DomEvent.stop)
      .on(button, 'click', L.DomEvent.preventDefault)
      .on(button, 'click', onClick);

    return button;
  }

  private getMarkerIcon(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="10" r="3"/>
        <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8"/>
      </svg>
    `;
  }

  private getImageIcon(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    `;
  }

  // Public methods for dynamic updates
  
  setMarkerButtonEnabled(enabled: boolean): this {
    if (this.markerButton) {
      if (enabled) {
        L.DomUtil.removeClass(this.markerButton, 'disabled');
        this.markerButton.setAttribute('aria-disabled', 'false');
      } else {
        L.DomUtil.addClass(this.markerButton, 'disabled');
        this.markerButton.setAttribute('aria-disabled', 'true');
      }
    }
    return this;
  }

  setImageButtonEnabled(enabled: boolean): this {
    if (this.imageButton) {
      if (enabled) {
        L.DomUtil.removeClass(this.imageButton, 'disabled');
        this.imageButton.setAttribute('aria-disabled', 'false');
      } else {
        L.DomUtil.addClass(this.imageButton, 'disabled');
        this.imageButton.setAttribute('aria-disabled', 'true');
      }
    }
    return this;
  }

  setOnZoomToMarkers(callback: () => void): this {
    this.options.onZoomToMarkers = callback;
    return this;
  }

  setOnZoomToImage(callback: () => void): this {
    this.options.onZoomToImage = callback;
    return this;
  }
}