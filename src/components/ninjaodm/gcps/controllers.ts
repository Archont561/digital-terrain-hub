import { AlpineController } from "@/lib/client";
import { toast } from "@/components/starwind/toast";
import type { HTMLGCPLeafletMap, HTMLImageLeafletMap } from ".leaflet//leaflet-map";
import type { GCPProps } from "./models";
import { ImageMarker, GCPMarker } from "./leaflet/markers";
import { bindingService, type GCPBinding } from "./db";
export type GCPEditorManagerProps = {
  gcps?: GCPProps[];
};

type MarkerType = 'gcp' | 'image';

export class GCPEditorManager extends AlpineController<GCPEditorManager, {
  gcpMap: HTMLGCPLeafletMap;
  imageMap: HTMLImageLeafletMap;
  imageThumbnailViewer: HTMLDivElement;
}> {
  private initialGcps: GCPProps[];
  private isDbSeeded = false;
  
  currentImageUuid: string | null = null;
  activeTab = "gcp";
  viewport = "";
  
  selectedGCPMarker: GCPMarker | null = null;
  selectedImageMarker: ImageMarker | null = null;
  hasUnsavedChanges = false;

  constructor({ gcps = [] }: GCPEditorManagerProps) {
    super();
    this.initialGcps = gcps;
  }

  // ─────────────────────────────────────────────────────────────
  // Getters & Helpers
  // ─────────────────────────────────────────────────────────────

  isViewport(viewport: string) {
    return this.viewport === viewport;
  }

  isActiveTab(tab: string) {
    return this.activeTab === tab;
  }

  get canBind(): boolean {
    return !!(
      this.selectedGCPMarker && 
      this.selectedImageMarker && 
      !this.selectedGCPMarker.isBound() && 
      !this.selectedImageMarker.isBound()
    );
  }

  private get maps() {
    return {
      gcp: this.ctx.$refs.gcpMap,
      image: this.ctx.$refs.imageMap
    };
  }

  private getMapForType(type: MarkerType) {
    return type === 'gcp' ? this.maps.gcp : this.maps.image;
  }

  private markDirty() {
    this.hasUnsavedChanges = true;
  }

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────

  protected async onInit() {
    this.ctx.$dispatch("starwind:init");
    this.setupViewportListener();
    this.ctx.$nextTick(() => this.setupSelectionListeners());
    
    await this.seedDatabase();
  }

  private async seedDatabase() {
    if (this.isDbSeeded) return;
    
    try {
      await bindingService.seedFromServer(this.initialGcps);
      this.isDbSeeded = true;
    } catch (error) {
      toast.error("Failed to initialize GCP data", { duration: 3000 });
    }
  }

  private setupViewportListener() {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = (e: MediaQueryList | MediaQueryListEvent) => {
      this.viewport = e.matches ? "desktop" : "mobile";
    };
    updateViewport(mdQuery);
    mdQuery.addEventListener("change", updateViewport);
  }

  private setupSelectionListeners() {
    const selectionHandler = (type: MarkerType) => ({
      selected: ((e: CustomEvent) => {
        if (type === 'gcp') {
          this.selectedGCPMarker = e.detail.marker;
        } else {
          this.selectedImageMarker = e.detail.marker;
        }
      }) as EventListener,

      deselected: ((e: CustomEvent) => {
        if (type === 'gcp' && this.selectedGCPMarker === e.detail.marker) {
          this.selectedGCPMarker = null;
        } else if (type === 'image' && this.selectedImageMarker === e.detail.marker) {
          this.selectedImageMarker = null;
        }
      }) as EventListener
    });

    (['gcp', 'image'] as MarkerType[]).forEach(type => {
      const map = this.getMapForType(type);
      const handlers = selectionHandler(type);
      map?.addEventListener('marker:selected', handlers.selected);
      map?.addEventListener('marker:deselected', handlers.deselected);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Marker Factory Methods
  // ─────────────────────────────────────────────────────────────

  private createGCPMarker(
    latlng: L.LatLngExpression, 
    options: { label?: string; bindingId?: string; onDragEnd?: (point: [number, number, number]) => void } = {}
  ): GCPMarker {
    const { label = `GCP-${Date.now()}`, bindingId, onDragEnd } = options;
    
    const marker = new GCPMarker(latlng, { title: label });
    marker.label = label;
    
    if (bindingId) {
      marker.bindTo(bindingId);
    }

    if (onDragEnd) {
      marker.on("dragend", () => onDragEnd(marker.toGCPPoint()));
    }

    return marker;
  }

  private createImageMarker(
    latlng: L.LatLngExpression,
    imageUuid: string,
    options: { bindingId?: string; onDragEnd?: (point: [number, number]) => void } = {}
  ): ImageMarker {
    const { bindingId, onDragEnd } = options;
    
    const marker = new ImageMarker(latlng, imageUuid);
    
    if (bindingId) {
      marker.bindTo(bindingId);
    }

    if (onDragEnd) {
      marker.on("dragend", () => onDragEnd(marker.toImagePoint()));
    }

    return marker;
  }

  private createBoundGCPMarker(binding: GCPBinding): GCPMarker {
    return this.createGCPMarker(
      [binding.gcpPoint[0], binding.gcpPoint[1], binding.gcpPoint[2]],
      {
        label: binding.label,
        bindingId: binding.bindingId,
        onDragEnd: async (point) => {
          await bindingService.updateGCPPoint(binding.bindingId, point);
          this.markDirty();
        }
      }
    );
  }

  private createBoundImageMarker(binding: GCPBinding): ImageMarker {
    return this.createImageMarker(
      [binding.imagePoint[1], binding.imagePoint[0]],
      binding.imageUuid,
      {
        bindingId: binding.bindingId,
        onDragEnd: async (point) => {
          await bindingService.updateImagePoint(binding.bindingId, point);
          this.markDirty();
        }
      }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Map Operations
  // ─────────────────────────────────────────────────────────────

  private clearAllMarkers() {
    this.maps.gcp.clearMarkers();
    this.maps.image.clearMarkers();
    this.selectedGCPMarker = null;
    this.selectedImageMarker = null;
  }

  private async loadBindingsToMaps(imageUuid: string): Promise<number> {
    const bindings = await bindingService.getBindingsForImage(imageUuid);

    bindings.forEach(binding => {
      this.maps.gcp.addMarker(this.createBoundGCPMarker(binding));
      this.maps.image.addMarker(this.createBoundImageMarker(binding));
    });

    if (bindings.length > 0) {
      this.maps.gcp.zoomToMarkers();
    }
    
    return bindings.length;
  }

  private closeSheet() {
    const closeBtn = this.ctx.$root.querySelector(
      `button[data-slot="sheet-close"]`
    ) as HTMLButtonElement;
    closeBtn?.click();
  }

  // ─────────────────────────────────────────────────────────────
  // Public Actions
  // ─────────────────────────────────────────────────────────────

  async selectImage(el: HTMLImageElement) {
    const imageUuid = el.dataset.originUuid;
    const imageUrl = el.dataset.originUrl;
    if (!imageUuid || !imageUrl) return;

    const loadPromise = (async () => {
      this.clearAllMarkers();
      this.currentImageUuid = imageUuid;
      
      await this.maps.image.addImageOverlay(imageUrl);
      const count = await this.loadBindingsToMaps(imageUuid);
      
      this.closeSheet();
      return count;
    })();

    toast.promise(loadPromise, {
      loading: {
        title: "Loading image",
        description: "Preparing GCP editor...",
        duration: Infinity,
      },
      success: (count) => ({
        title: "Image loaded",
        description: `Found ${count} GCP binding${count !== 1 ? 's' : ''}`,
        duration: 2000,
      }),
      error: {
        title: "Failed to load image",
        description: "Please try again",
        duration: 3000,
      },
    });
  }

  addGCPMarkerOnCenter() {
    const marker = this.createGCPMarker(this.maps.gcp.getCenter());
    this.maps.gcp.addMarker(marker);
    toast.success("GCP marker added", { duration: 1500 });
  }

  addImageMarkerOnCenter() {
    if (!this.currentImageUuid || !this.maps.image.hasImage()) {
      toast.error("Please select an image first", { duration: 2000 });
      return;
    }

    const marker = this.createImageMarker(
      this.maps.image.getCenter(),
      this.currentImageUuid
    );
    this.maps.image.addMarker(marker);
    toast.success("Image marker added", { duration: 1500 });
  }

  addMarkerOnCenter() {
    this.addGCPMarkerOnCenter();
    if (this.currentImageUuid) {
      this.addImageMarkerOnCenter();
    }
  }

  async bindMarkers() {
    if (!this.selectedGCPMarker || !this.selectedImageMarker) {
      toast.error("Select one GCP marker and one image marker", { duration: 2500 });
      return;
    }

    if (this.selectedGCPMarker.isBound() || this.selectedImageMarker.isBound()) {
      toast.error("One or both markers are already bound", { duration: 2500 });
      return;
    }

    if (!this.currentImageUuid) {
      toast.error("Please select an image first", { duration: 2000 });
      return;
    }

    try {
      const gcpMarker = this.selectedGCPMarker;
      const imageMarker = this.selectedImageMarker;

      const binding = await bindingService.createBinding(
        this.currentImageUuid,
        gcpMarker.toGCPPoint(),
        imageMarker.toImagePoint(),
        gcpMarker.label || `GCP-${Date.now()}`
      );

      this.setupBoundMarker(gcpMarker, binding.bindingId, 'gcp');
      this.setupBoundMarker(imageMarker, binding.bindingId, 'image');

      gcpMarker.deselect();
      imageMarker.deselect();
      this.selectedGCPMarker = null;
      this.selectedImageMarker = null;

      this.markDirty();
      toast.success("Markers bound successfully", { duration: 2000 });
    } catch (error) {
      toast.error("Failed to bind markers", { duration: 2500 });
    }
  }

  private setupBoundMarker(marker: GCPMarker | ImageMarker, bindingId: string, type: MarkerType) {
    marker.bindTo(bindingId);
    marker.off("dragend");
    
    if (type === 'gcp') {
      marker.on("dragend", async () => {
        await bindingService.updateGCPPoint(bindingId, (marker as GCPMarker).toGCPPoint());
        this.markDirty();
      });
    } else {
      marker.on("dragend", async () => {
        await bindingService.updateImagePoint(bindingId, (marker as ImageMarker).toImagePoint());
        this.markDirty();
      });
    }
  }

  async unbindSelectedMarker() {
    const marker = this.selectedGCPMarker || this.selectedImageMarker;
    if (!marker?.isBound()) {
      toast.error("No bound marker selected", { duration: 2000 });
      return;
    }

    try {
      const bindingId = marker.bindingId!;
      await this.removeBinding(bindingId, false);
      
      this.markDirty();
      toast.success("Markers unbound", { duration: 2000 });
    } catch (error) {
      toast.error("Failed to unbind markers", { duration: 2500 });
    }
  }

  async deleteSelectedMarker() {
    const gcpMarker = this.selectedGCPMarker;
    const imageMarker = this.selectedImageMarker;

    if (!gcpMarker && !imageMarker) {
      toast.error("No marker selected", { duration: 2000 });
      return;
    }

    try {
      if (gcpMarker) {
        await this.removeMarkerWithBinding(gcpMarker, 'gcp');
        this.selectedGCPMarker = null;
      }

      if (imageMarker) {
        await this.removeMarkerWithBinding(imageMarker, 'image');
        this.selectedImageMarker = null;
      }

      this.markDirty();
      toast.success("Marker deleted", { duration: 2000 });
    } catch (error) {
      toast.error("Failed to delete marker", { duration: 2500 });
    }
  }

  private async removeMarkerWithBinding(marker: GCPMarker | ImageMarker, type: MarkerType) {
    if (marker.isBound()) {
      await this.removeBinding(marker.bindingId!, true);
    } else {
      this.getMapForType(type).removeMarker(marker);
    }
  }

  private async removeBinding(bindingId: string, deleteMarkers: boolean) {
    const gcpMarker = this.maps.gcp.getMarkerByBindingId(bindingId) as GCPMarker | undefined;
    const imageMarker = this.maps.image.getMarkerByBindingId(bindingId) as ImageMarker | undefined;

    await bindingService.deleteBinding(bindingId);

    if (deleteMarkers) {
      if (gcpMarker) this.maps.gcp.removeMarker(gcpMarker);
      if (imageMarker) this.maps.image.removeMarker(imageMarker);
    } else {
      gcpMarker?.unbind();
      imageMarker?.unbind();
    }
  }

  async saveChanges() {
    const savePromise = (async () => {
      const changes = await bindingService.serializeForSave();

      console.log("=== SAVE CHANGES ===");
      console.log("CREATE:", JSON.stringify(changes.create, null, 2));
      console.log("UPDATE:", JSON.stringify(changes.update, null, 2));
      console.log("DELETE:", JSON.stringify(changes.delete, null, 2));
      console.log("====================");

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate server response with created UUIDs
      const pendingChanges = await bindingService.getPendingChanges();
      const createdUuids = new Map(
        pendingChanges.create.map(b => [b.bindingId, `server-uuid-${crypto.randomUUID().slice(0, 8)}`])
      );

      await bindingService.markAllSynced(createdUuids);
      this.hasUnsavedChanges = false;

      return {
        created: changes.create.length,
        updated: changes.update.length,
        deleted: changes.delete.length,
      };
    })();

    toast.promise(savePromise, {
      loading: {
        title: "Saving changes",
        description: "Syncing with server...",
        duration: Infinity,
      },
      success: (result) => ({
        title: "Changes saved",
        description: `${result.created} created, ${result.updated} updated, ${result.deleted} deleted`,
        duration: 3000,
      }),
      error: {
        title: "Failed to save",
        description: "Please try again",
        duration: 3000,
      },
    });
  }

  async discardChanges() {
    if (!this.currentImageUuid) {
      toast.error("No image selected", { duration: 2000 });
      return;
    }

    const discardPromise = (async () => {
      await bindingService.resetToServer(this.initialGcps, this.currentImageUuid!);
      
      this.clearAllMarkers();
      const count = await this.loadBindingsToMaps(this.currentImageUuid!);

      this.hasUnsavedChanges = false;
      return count;
    })();

    toast.promise(discardPromise, {
      loading: {
        title: "Discarding changes",
        description: "Restoring original data...",
        duration: Infinity,
      },
      success: (count) => ({
        title: "Changes discarded",
        description: `Restored ${count} binding${count !== 1 ? 's' : ''}`,
        duration: 2000,
      }),
      error: {
        title: "Failed to discard",
        description: "Please try again",
        duration: 3000,
      },
    });
  }

  async resetDatabase() {
    const resetPromise = (async () => {
      await bindingService.clearAll();
      this.isDbSeeded = false;
      await this.seedDatabase();
      
      if (this.currentImageUuid) {
        this.clearAllMarkers();
        await this.loadBindingsToMaps(this.currentImageUuid);
      }
      
      this.hasUnsavedChanges = false;
    })();

    toast.promise(resetPromise, {
      loading: {
        title: "Resetting database",
        description: "Restoring all data...",
        duration: Infinity,
      },
      success: {
        title: "Database reset",
        description: "All data restored to server state",
        duration: 2000,
      },
      error: {
        title: "Reset failed",
        description: "Please refresh the page",
        duration: 3000,
      },
    });
  }
}
