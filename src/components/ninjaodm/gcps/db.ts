import Dexie, { type Table } from 'dexie';
import type { GCPProps } from './models';

export interface GCPBinding {
  id?: number; // Auto-incremented local ID
  uuid?: string; // Server UUID (only exists for saved bindings)
  bindingId: string; // Local binding ID to link GCP and Image markers
  imageUuid: string; // Which image this binding belongs to
  label: string;
  gcpPoint: [number, number, number]; // lat, lng, alt
  imagePoint: [number, number]; // x, y in image coordinates
  status: 'new' | 'modified' | 'synced' | 'deleted';
  originalData?: { // Store original for change detection
    gcpPoint: [number, number, number];
    imagePoint: [number, number];
    label: string;
  };
}

export class GCPDatabase extends Dexie {
  bindings!: Table<GCPBinding>;

  constructor() {
    super('GCPEditorDB');
    this.version(1).stores({
      bindings: '++id, uuid, bindingId, imageUuid, status'
    });
  }
}

export const db = new GCPDatabase();

export class BindingService {
  
  /**
   * Seed database with all GCPs from server (called once on init)
   */
  async seedFromServer(gcps: GCPProps[]): Promise<void> {
    await db.bindings.clear();

    if (gcps.length === 0) return;

    const bindings: GCPBinding[] = gcps.map(gcp => ({
      uuid: gcp.uuid,
      bindingId: `binding-${crypto.randomUUID().slice(0, 8)}`,
      imageUuid: gcp.image_uuid,
      label: gcp.label,
      gcpPoint: [gcp.gcp_point[0], gcp.gcp_point[1], gcp.gcp_point[2]] as [number, number, number],
      imagePoint: [gcp.image_point[0], gcp.image_point[1]] as [number, number],
      status: 'synced' as const,
      originalData: {
        gcpPoint: [gcp.gcp_point[0], gcp.gcp_point[1], gcp.gcp_point[2]] as [number, number, number],
        imagePoint: [gcp.image_point[0], gcp.image_point[1]] as [number, number],
        label: gcp.label
      }
    }));

    await db.bindings.bulkAdd(bindings);
  }

  /**
   * Reset bindings for a specific image to server state
   */
  async resetToServer(gcps: GCPProps[], imageUuid: string): Promise<void> {
    await db.bindings.where('imageUuid').equals(imageUuid).delete();

    const bindings: GCPBinding[] = gcps
      .filter(gcp => gcp.image_uuid === imageUuid)
      .map(gcp => ({
        uuid: gcp.uuid,
        bindingId: `binding-${crypto.randomUUID().slice(0, 8)}`,
        imageUuid: gcp.image_uuid,
        label: gcp.label,
        gcpPoint: [gcp.gcp_point[0], gcp.gcp_point[1], gcp.gcp_point[2]] as [number, number, number],
        imagePoint: [gcp.image_point[0], gcp.image_point[1]] as [number, number],
        status: 'synced' as const,
        originalData: {
          gcpPoint: [gcp.gcp_point[0], gcp.gcp_point[1], gcp.gcp_point[2]] as [number, number, number],
          imagePoint: [gcp.image_point[0], gcp.image_point[1]] as [number, number],
          label: gcp.label
        }
      }));

    if (bindings.length > 0) {
      await db.bindings.bulkAdd(bindings);
    }
  }

  /**
   * Get all bindings for an image (excludes deleted)
   */
  async getBindingsForImage(imageUuid: string): Promise<GCPBinding[]> {
    return db.bindings
      .where('imageUuid')
      .equals(imageUuid)
      .and(b => b.status !== 'deleted')
      .toArray();
  }

  /**
   * Get all unique image UUIDs that have bindings
   */
  async getImageUuidsWithBindings(): Promise<string[]> {
    const bindings = await db.bindings
      .where('status')
      .notEqual('deleted')
      .toArray();
    
    return [...new Set(bindings.map(b => b.imageUuid))];
  }

  /**
   * Check if there are any unsaved changes
   */
  async hasUnsavedChanges(): Promise<boolean> {
    const count = await db.bindings
      .where('status')
      .anyOf(['new', 'modified', 'deleted'])
      .count();
    
    return count > 0;
  }

  /**
   * Get count of bindings by status
   */
  async getChangesSummary(): Promise<{ new: number; modified: number; deleted: number; synced: number }> {
    const all = await db.bindings.toArray();
    
    return {
      new: all.filter(b => b.status === 'new').length,
      modified: all.filter(b => b.status === 'modified').length,
      deleted: all.filter(b => b.status === 'deleted').length,
      synced: all.filter(b => b.status === 'synced').length
    };
  }

  /**
   * Create a new binding between GCP marker and Image marker
   */
  async createBinding(
    imageUuid: string,
    gcpPoint: [number, number, number],
    imagePoint: [number, number],
    label: string
  ): Promise<GCPBinding> {
    const bindingId = `binding-${crypto.randomUUID().slice(0, 8)}`;
    
    const binding: GCPBinding = {
      bindingId,
      imageUuid,
      label,
      gcpPoint: [gcpPoint[0], gcpPoint[1], gcpPoint[2]],
      imagePoint: [imagePoint[0], imagePoint[1]],
      status: 'new'
    };

    const id = await db.bindings.add(binding);
    return { ...binding, id };
  }

  /**
   * Update GCP point position
   */
  async updateGCPPoint(bindingId: string, gcpPoint: [number, number, number]): Promise<void> {
    const binding = await db.bindings.where('bindingId').equals(bindingId).first();
    if (!binding) return;

    const newStatus = binding.status === 'new' ? 'new' : 'modified';
    await db.bindings.where('bindingId').equals(bindingId).modify({
      gcpPoint: [gcpPoint[0], gcpPoint[1], gcpPoint[2]],
      status: newStatus
    });
  }

  /**
   * Update Image point position
   */
  async updateImagePoint(bindingId: string, imagePoint: [number, number]): Promise<void> {
    const binding = await db.bindings.where('bindingId').equals(bindingId).first();
    if (!binding) return;

    const newStatus = binding.status === 'new' ? 'new' : 'modified';
    await db.bindings.where('bindingId').equals(bindingId).modify({
      imagePoint: [imagePoint[0], imagePoint[1]],
      status: newStatus
    });
  }

  /**
   * Update label
   */
  async updateLabel(bindingId: string, label: string): Promise<void> {
    const binding = await db.bindings.where('bindingId').equals(bindingId).first();
    if (!binding) return;

    const newStatus = binding.status === 'new' ? 'new' : 'modified';
    await db.bindings.where('bindingId').equals(bindingId).modify({
      label,
      status: newStatus
    });
  }

  /**
   * Delete a binding
   */
  async deleteBinding(bindingId: string): Promise<void> {
    const binding = await db.bindings.where('bindingId').equals(bindingId).first();
    if (!binding) return;

    if (binding.status === 'new') {
      await db.bindings.where('bindingId').equals(bindingId).delete();
    } else {
      await db.bindings.where('bindingId').equals(bindingId).modify({
        status: 'deleted'
      });
    }
  }

  /**
   * Get all pending changes grouped by operation type
   */
  async getPendingChanges(): Promise<{
    create: GCPBinding[];
    update: GCPBinding[];
    delete: GCPBinding[];
  }> {
    const allBindings = await db.bindings.toArray();

    return {
      create: allBindings.filter(b => b.status === 'new'),
      update: allBindings.filter(b => b.status === 'modified'),
      delete: allBindings.filter(b => b.status === 'deleted')
    };
  }

  /**
   * Serialize changes for API call
   */
  async serializeForSave(): Promise<{
    create: Omit<GCPProps, 'uuid'>[];
    update: GCPProps[];
    delete: string[];
  }> {
    const changes = await this.getPendingChanges();

    return {
      create: changes.create.map(b => ({
        image_uuid: b.imageUuid,
        gcp_point: [b.gcpPoint[0], b.gcpPoint[1], b.gcpPoint[2]] as [number, number, number],
        image_point: [b.imagePoint[0], b.imagePoint[1]] as [number, number],
        label: b.label
      })),
      update: changes.update
        .filter(b => b.uuid)
        .map(b => ({
          uuid: b.uuid!,
          image_uuid: b.imageUuid,
          gcp_point: [b.gcpPoint[0], b.gcpPoint[1], b.gcpPoint[2]] as [number, number, number],
          image_point: [b.imagePoint[0], b.imagePoint[1]] as [number, number],
          label: b.label
        })),
      delete: changes.delete
        .filter(b => b.uuid)
        .map(b => b.uuid!)
    };
  }

  /**
   * Mark all as synced after successful save
   */
  async markAllSynced(createdUuids: Map<string, string>): Promise<void> {
    for (const [bindingId, uuid] of createdUuids) {
      const binding = await db.bindings.where('bindingId').equals(bindingId).first();
      if (binding) {
        await db.bindings.where('bindingId').equals(bindingId).modify({
          uuid,
          status: 'synced',
          originalData: {
            gcpPoint: [binding.gcpPoint[0], binding.gcpPoint[1], binding.gcpPoint[2]] as [number, number, number],
            imagePoint: [binding.imagePoint[0], binding.imagePoint[1]] as [number, number],
            label: binding.label
          }
        });
      }
    }

    const modifiedBindings = await db.bindings.where('status').equals('modified').toArray();
    for (const binding of modifiedBindings) {
      await db.bindings.where('bindingId').equals(binding.bindingId).modify({
        status: 'synced',
        originalData: {
          gcpPoint: [binding.gcpPoint[0], binding.gcpPoint[1], binding.gcpPoint[2]] as [number, number, number],
          imagePoint: [binding.imagePoint[0], binding.imagePoint[1]] as [number, number],
          label: binding.label
        }
      });
    }

    await db.bindings.where('status').equals('deleted').delete();
  }

  /**
   * Clear all bindings
   */
  async clearAll(): Promise<void> {
    await db.bindings.clear();
  }

  /**
   * Get binding by bindingId
   */
  async getBinding(bindingId: string): Promise<GCPBinding | undefined> {
    return db.bindings.where('bindingId').equals(bindingId).first();
  }
}

export const bindingService = new BindingService();