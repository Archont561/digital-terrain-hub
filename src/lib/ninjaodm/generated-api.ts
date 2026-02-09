import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const HeartbeatEvent = z
  .object({ event: z.string().default("heartbeat") })
  .partial()
  .passthrough();
const WorkspaceCreatedSSEData = z
  .object({ uuid: z.string().uuid(), name: z.string() })
  .passthrough();
const SSEWrapper_Literal__workspace__WorkspaceCreatedSSEData_ = z
  .object({ event: z.string(), data: WorkspaceCreatedSSEData })
  .passthrough();
const WorkspaceUpdatedSSEData = z
  .object({ uuid: z.string().uuid(), name: z.string() })
  .passthrough();
const SSEWrapper_Literal__workspace__WorkspaceUpdatedSSEData_ = z
  .object({ event: z.string(), data: WorkspaceUpdatedSSEData })
  .passthrough();
const WorkspaceDeletedSSEData = z
  .object({ uuid: z.string().uuid(), name: z.string() })
  .passthrough();
const SSEWrapper_Literal__workspace__WorkspaceDeletedSSEData_ = z
  .object({ event: z.string(), data: WorkspaceDeletedSSEData })
  .passthrough();
const WorkspaceImagesUploadedSSEData = z
  .object({ uuid: z.string().uuid(), uploaded: z.number().int() })
  .passthrough();
const SSEWrapper_Literal__workspace__WorkspaceImagesUploadedSSEData_ = z
  .object({ event: z.string(), data: WorkspaceImagesUploadedSSEData })
  .passthrough();
const ImageDeletedSSEData = z
  .object({ uuid: z.string().uuid(), name: z.string() })
  .passthrough();
const SSEWrapper_Literal__image__ImageDeletedSSEData_ = z
  .object({ event: z.string(), data: ImageDeletedSSEData })
  .passthrough();
const ODMTaskResultType = z.enum([
  "point_cloud_ply",
  "point_cloud_laz",
  "point_cloud_csv",
  "textured_model",
  "textured_model_geo",
  "orthophoto_geotiff",
  "orthophoto_webp",
  "dsm",
  "dtm",
  "report",
]);
const ResultDeletedSSEData = z
  .object({ uuid: z.string().uuid(), result_type: ODMTaskResultType })
  .passthrough();
const SSEWrapper_Literal__task_result__ResultDeletedSSEData_ = z
  .object({ event: z.string(), data: ResultDeletedSSEData })
  .passthrough();
const ResultCreatedSSEData = z
  .object({ uuid: z.string().uuid(), workspace_name: z.string() })
  .passthrough();
const SSEWrapper_Literal__task_result__ResultCreatedSSEData_ = z
  .object({ event: z.string(), data: ResultCreatedSSEData })
  .passthrough();
const TaskCreatedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskCreatedSSEData_ = z
  .object({ event: z.string(), data: TaskCreatedSSEData })
  .passthrough();
const TaskUpdatedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskUpdatedSSEData_ = z
  .object({ event: z.string(), data: TaskUpdatedSSEData })
  .passthrough();
const TaskDeletedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskDeletedSSEData_ = z
  .object({ event: z.string(), data: TaskDeletedSSEData })
  .passthrough();
const TaskPausedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskPausedSSEData_ = z
  .object({ event: z.string(), data: TaskPausedSSEData })
  .passthrough();
const TaskResumedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskResumedSSEData_ = z
  .object({ event: z.string(), data: TaskResumedSSEData })
  .passthrough();
const TaskCancelledSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskCancelledSSEData_ = z
  .object({ event: z.string(), data: TaskCancelledSSEData })
  .passthrough();
const TaskNextStageSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskNextStageSSEData_ = z
  .object({ event: z.string(), data: TaskNextStageSSEData })
  .passthrough();
const TaskStartedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskStartedSSEData_ = z
  .object({ event: z.string(), data: TaskStartedSSEData })
  .passthrough();
const TaskCompletedSSEData = z
  .object({ uuid: z.string().uuid(), status: z.string(), step: z.string() })
  .passthrough();
const SSEWrapper_Literal__task__TaskCompletedSSEData_ = z
  .object({ event: z.string(), data: TaskCompletedSSEData })
  .passthrough();
const TaskFailedSSEData = z
  .object({
    uuid: z.string().uuid(),
    status: z.string(),
    step: z.string(),
    error: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const SSEWrapper_Literal__task__TaskFailedSSEData_ = z
  .object({ event: z.string(), data: TaskFailedSSEData })
  .passthrough();
const GPCCreatedSSEData = z
  .object({ uuid: z.string().uuid(), label: z.string() })
  .passthrough();
const SSEWrapper_Literal__gcp__GPCCreatedSSEData_ = z
  .object({ event: z.string(), data: GPCCreatedSSEData })
  .passthrough();
const GCPUpdatedSSEData = z
  .object({ uuid: z.string().uuid(), label: z.string() })
  .passthrough();
const SSEWrapper_Literal__gcp__GCPUpdatedSSEData_ = z
  .object({ event: z.string(), data: GCPUpdatedSSEData })
  .passthrough();
const GCPDeletedSSEData = z
  .object({ uuid: z.string().uuid(), label: z.string() })
  .passthrough();
const SSEWrapper_Literal__gcp__GCPDeletedSSEData_ = z
  .object({ event: z.string(), data: GCPDeletedSSEData })
  .passthrough();
const MessageSchema = z.object({ message: z.string() }).passthrough();
const HealthSchema = z
  .object({
    status: z.string(),
    timestamp: z.number(),
    mixins: z.record(z.string()),
  })
  .passthrough();
const TokenPairResponseInternal = z
  .object({ refresh: z.string(), access: z.string() })
  .passthrough();
const RefreshRequestInternal = z.object({ refresh: z.string() }).passthrough();
const AccessTokenResponseInternal = z
  .object({ access: z.string() })
  .passthrough();
const TokenRequestInternal = z
  .object({
    user_id: z.string(),
    scopes: z.array(z.string()).optional().default([]),
  })
  .passthrough();
const CreateWorkspaceInternal = z
  .object({
    name: z.union([z.string(), z.null()]).optional(),
    user_id: z.string(),
  })
  .passthrough();
const WorkspaceResponseInternal = z
  .object({
    user_id: z.string().max(100),
    uuid: z.union([z.string(), z.null()]).optional(),
    name: z.string().max(50).optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const name = z.union([z.string(), z.null()]).optional();
const WorkspaceResponse = z
  .object({
    uuid: z.union([z.string(), z.null()]),
    name: z.string().max(50),
    created_at: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const UpdateWorkspace = z.object({ name: z.string() }).passthrough();
const CreateWorkspace = z
  .object({ name: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough();
const uploadImagesToWorkspace_Body = z
  .object({ image_files: z.array(z.instanceof(File)) })
  .passthrough();
const ImageResponse = z
  .object({
    workspace_uuid: z.string().uuid(),
    uuid: z.union([z.string(), z.null()]).optional(),
    name: z.string().max(50),
    is_thumbnail: z.boolean().optional().default(false),
    created_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const NodeODMTaskStatus = z.union([
  z.literal(10),
  z.literal(20),
  z.literal(30),
  z.literal(40),
  z.literal(50),
]);
const ODMTaskWebhookStatus = z
  .object({ code: NodeODMTaskStatus })
  .passthrough();
const ODMTaskWebhookInternal = z
  .object({
    uuid: z.string().uuid(),
    name: z.string(),
    dateCreated: z.number().int(),
    processingTime: z.number(),
    status: ODMTaskWebhookStatus,
    options: z.object({}).partial().passthrough(),
    imagesCount: z.number().int(),
    progress: z.number().int(),
  })
  .passthrough();
const ODMTaskStatus = z.enum([
  "queued",
  "running",
  "pausing",
  "paused",
  "resuming",
  "cancelling",
  "finishing",
  "completed",
  "failed",
  "cancelled",
]);
const status = z.union([ODMTaskStatus, z.null()]).optional();
const ODMProcessingStage = z.enum([
  "dataset",
  "split",
  "merge",
  "opensfm",
  "openmvs",
  "odm_filterpoints",
  "odm_meshing",
  "mvs_texturing",
  "odm_georeferencing",
  "odm_dem",
  "odm_orthophoto",
  "odm_report",
  "odm_postprocess",
]);
const step = z.union([ODMProcessingStage, z.null()]).optional();
const TaskResponse = z
  .object({
    workspace_uuid: z.string().uuid(),
    status: ODMTaskStatus,
    step: ODMProcessingStage,
    uuid: z.union([z.string(), z.null()]).optional(),
    options: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    name: z.string().max(50).optional(),
  })
  .passthrough();
const ODMQualityOption = z.enum([
  "ultra_high",
  "high",
  "medium",
  "low",
  "ultra_low",
]);
const CreateTask = z
  .object({
    workspace_uuid: z.string().uuid(),
    name: z.union([z.string(), z.null()]).optional(),
    quality: z
      .union([ODMQualityOption, z.null()])
      .optional()
      .default("ultra_low"),
  })
  .passthrough();
const result_type = z.union([ODMTaskResultType, z.null()]).optional();
const ResultResponse = z
  .object({
    workspace_uuid: z.string().uuid(),
    result_type: ODMTaskResultType,
    uuid: z.union([z.string(), z.null()]).optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const ResultShareKeyResponse = z
  .object({ share_api_key: z.string() })
  .passthrough();
const is_thumbnail = z.union([z.boolean(), z.null()]).optional();
const GCPResponse = z
  .object({
    image_uuid: z.string().uuid(),
    gcp_point: z.array(z.any()).min(3).max(3),
    image_point: z.array(z.any()).min(2).max(2),
    uuid: z.union([z.string(), z.null()]).optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    label: z.string().max(50),
  })
  .passthrough();
const GCPUpdate = z
  .object({
    gcp_point: z.union([z.array(z.any()), z.null()]),
    image_point: z.union([z.array(z.any()), z.null()]),
    label: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough();
const Position2D = z.array(z.any());
const Position3D = z.array(z.any());
const Point = z
  .object({
    bbox: z.union([z.array(z.any()), z.array(z.any()), z.null()]).optional(),
    type: z.string(),
    coordinates: z.union([Position2D, Position3D]),
  })
  .passthrough();
const GCPProperties = z
  .object({
    image_uuid: z.string().uuid(),
    image_point: z.array(z.any()).min(2).max(2),
    label: z.string(),
  })
  .passthrough();
const Feature_Point_GCPProperties_ = z
  .object({
    bbox: z.union([z.array(z.any()), z.array(z.any()), z.null()]).optional(),
    type: z.string(),
    geometry: z.union([Point, z.null()]),
    properties: z.union([GCPProperties, z.null()]),
    id: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough();
const FeatureCollection_Feature_Point__GCPProperties__ = z
  .object({
    bbox: z.union([z.array(z.any()), z.array(z.any()), z.null()]).optional(),
    type: z.string(),
    features: z.array(Feature_Point_GCPProperties_),
  })
  .passthrough();
const GCPCreate = z
  .object({
    image_uuid: z.string().uuid(),
    gcp_point: z.array(z.any()).min(3).max(3),
    image_point: z.array(z.any()).min(2).max(2),
    label: z.string(),
  })
  .passthrough();
const GCPUpdateForBulk = z
  .object({
    gcp_point: z.union([z.array(z.any()), z.null()]).optional(),
    image_point: z.union([z.array(z.any()), z.null()]).optional(),
    label: z.union([z.string(), z.null()]).optional(),
    uuid: z.string().uuid(),
  })
  .passthrough();

export const schemas = {
  HeartbeatEvent,
  WorkspaceCreatedSSEData,
  SSEWrapper_Literal__workspace__WorkspaceCreatedSSEData_,
  WorkspaceUpdatedSSEData,
  SSEWrapper_Literal__workspace__WorkspaceUpdatedSSEData_,
  WorkspaceDeletedSSEData,
  SSEWrapper_Literal__workspace__WorkspaceDeletedSSEData_,
  WorkspaceImagesUploadedSSEData,
  SSEWrapper_Literal__workspace__WorkspaceImagesUploadedSSEData_,
  ImageDeletedSSEData,
  SSEWrapper_Literal__image__ImageDeletedSSEData_,
  ODMTaskResultType,
  ResultDeletedSSEData,
  SSEWrapper_Literal__task_result__ResultDeletedSSEData_,
  ResultCreatedSSEData,
  SSEWrapper_Literal__task_result__ResultCreatedSSEData_,
  TaskCreatedSSEData,
  SSEWrapper_Literal__task__TaskCreatedSSEData_,
  TaskUpdatedSSEData,
  SSEWrapper_Literal__task__TaskUpdatedSSEData_,
  TaskDeletedSSEData,
  SSEWrapper_Literal__task__TaskDeletedSSEData_,
  TaskPausedSSEData,
  SSEWrapper_Literal__task__TaskPausedSSEData_,
  TaskResumedSSEData,
  SSEWrapper_Literal__task__TaskResumedSSEData_,
  TaskCancelledSSEData,
  SSEWrapper_Literal__task__TaskCancelledSSEData_,
  TaskNextStageSSEData,
  SSEWrapper_Literal__task__TaskNextStageSSEData_,
  TaskStartedSSEData,
  SSEWrapper_Literal__task__TaskStartedSSEData_,
  TaskCompletedSSEData,
  SSEWrapper_Literal__task__TaskCompletedSSEData_,
  TaskFailedSSEData,
  SSEWrapper_Literal__task__TaskFailedSSEData_,
  GPCCreatedSSEData,
  SSEWrapper_Literal__gcp__GPCCreatedSSEData_,
  GCPUpdatedSSEData,
  SSEWrapper_Literal__gcp__GCPUpdatedSSEData_,
  GCPDeletedSSEData,
  SSEWrapper_Literal__gcp__GCPDeletedSSEData_,
  MessageSchema,
  HealthSchema,
  TokenPairResponseInternal,
  RefreshRequestInternal,
  AccessTokenResponseInternal,
  TokenRequestInternal,
  CreateWorkspaceInternal,
  WorkspaceResponseInternal,
  name,
  WorkspaceResponse,
  UpdateWorkspace,
  CreateWorkspace,
  uploadImagesToWorkspace_Body,
  ImageResponse,
  NodeODMTaskStatus,
  ODMTaskWebhookStatus,
  ODMTaskWebhookInternal,
  ODMTaskStatus,
  status,
  ODMProcessingStage,
  step,
  TaskResponse,
  ODMQualityOption,
  CreateTask,
  result_type,
  ResultResponse,
  ResultShareKeyResponse,
  is_thumbnail,
  GCPResponse,
  GCPUpdate,
  Position2D,
  Position3D,
  Point,
  GCPProperties,
  Feature_Point_GCPProperties_,
  FeatureCollection_Feature_Point__GCPProperties__,
  GCPCreate,
  GCPUpdateForBulk,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/demo/create-demo-jwt",
    alias: "createDemoJWT",
    requestFormat: "json",
    parameters: [
      {
        name: "user_id",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: TokenPairResponseInternal,
  },
  {
    method: "get",
    path: "/api/events",
    alias: "listenToSSE",
    requestFormat: "json",
    response: z.union([
      HeartbeatEvent,
      SSEWrapper_Literal__workspace__WorkspaceCreatedSSEData_,
      SSEWrapper_Literal__workspace__WorkspaceUpdatedSSEData_,
      SSEWrapper_Literal__workspace__WorkspaceDeletedSSEData_,
      SSEWrapper_Literal__workspace__WorkspaceImagesUploadedSSEData_,
      SSEWrapper_Literal__image__ImageDeletedSSEData_,
      SSEWrapper_Literal__task_result__ResultDeletedSSEData_,
      SSEWrapper_Literal__task_result__ResultCreatedSSEData_,
      SSEWrapper_Literal__task__TaskCreatedSSEData_,
      SSEWrapper_Literal__task__TaskUpdatedSSEData_,
      SSEWrapper_Literal__task__TaskDeletedSSEData_,
      SSEWrapper_Literal__task__TaskPausedSSEData_,
      SSEWrapper_Literal__task__TaskResumedSSEData_,
      SSEWrapper_Literal__task__TaskCancelledSSEData_,
      SSEWrapper_Literal__task__TaskNextStageSSEData_,
      SSEWrapper_Literal__task__TaskStartedSSEData_,
      SSEWrapper_Literal__task__TaskCompletedSSEData_,
      SSEWrapper_Literal__task__TaskFailedSSEData_,
      SSEWrapper_Literal__gcp__GPCCreatedSSEData_,
      SSEWrapper_Literal__gcp__GCPUpdatedSSEData_,
      SSEWrapper_Literal__gcp__GCPDeletedSSEData_,
    ]),
  },
  {
    method: "get",
    path: "/api/gcps/",
    alias: "listGCPs",
    requestFormat: "json",
    parameters: [
      {
        name: "label",
        type: "Query",
        schema: name,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "image_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(GCPResponse),
  },
  {
    method: "post",
    path: "/api/gcps/",
    alias: "createGCP",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GCPCreate,
      },
    ],
    response: GCPResponse,
  },
  {
    method: "get",
    path: "/api/gcps/:uuid",
    alias: "getGCP",
    description: `Get GroundControlPoint item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: GCPResponse,
  },
  {
    method: "patch",
    path: "/api/gcps/:uuid",
    alias: "updateGCP",
    description: `Patch GroundControlPoint item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GCPUpdate,
      },
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: GCPResponse,
  },
  {
    method: "delete",
    path: "/api/gcps/:uuid",
    alias: "deleteGCP",
    description: `Delete GroundControlPoint item`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "patch",
    path: "/api/gcps/bulk",
    alias: "bulkUpdateGCPs",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(GCPUpdateForBulk),
      },
    ],
    response: z.array(GCPResponse),
  },
  {
    method: "delete",
    path: "/api/gcps/bulk",
    alias: "bulkDeleteGCPs",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/gcps/bulk",
    alias: "bulkCreateGCPs",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(GCPCreate),
      },
    ],
    response: z.array(GCPResponse),
  },
  {
    method: "get",
    path: "/api/gcps/geojson",
    alias: "listGCPsAsGeojson",
    requestFormat: "json",
    parameters: [
      {
        name: "label",
        type: "Query",
        schema: name,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "image_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
    ],
    response: FeatureCollection_Feature_Point__GCPProperties__,
  },
  {
    method: "get",
    path: "/api/health",
    alias: "getAPIHealth",
    requestFormat: "json",
    response: z.object({ message: z.string() }).passthrough(),
  },
  {
    method: "get",
    path: "/api/health/detailed",
    alias: "getAPIDetailedHealth",
    requestFormat: "json",
    response: HealthSchema,
  },
  {
    method: "get",
    path: "/api/images/",
    alias: "listImages",
    requestFormat: "json",
    parameters: [
      {
        name: "name",
        type: "Query",
        schema: name,
      },
      {
        name: "is_thumbnail",
        type: "Query",
        schema: is_thumbnail,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(ImageResponse),
  },
  {
    method: "get",
    path: "/api/images/:uuid",
    alias: "getImage",
    description: `Get Image item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ImageResponse,
  },
  {
    method: "delete",
    path: "/api/images/:uuid",
    alias: "deleteImage",
    description: `Delete Image item`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/images/:uuid/download",
    alias: "downloadImage",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/internal/gcps/",
    alias: "listGCPsInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "label",
        type: "Query",
        schema: name,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "image_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "user_id",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(GCPResponse),
  },
  {
    method: "get",
    path: "/api/internal/images/",
    alias: "listImagesInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "name",
        type: "Query",
        schema: name,
      },
      {
        name: "is_thumbnail",
        type: "Query",
        schema: is_thumbnail,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "user_id",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(ImageResponse),
  },
  {
    method: "get",
    path: "/api/internal/results/",
    alias: "listTaskResultsInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "result_type",
        type: "Query",
        schema: result_type,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "user_id",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(ResultResponse),
  },
  {
    method: "get",
    path: "/api/internal/tasks/",
    alias: "listTasksInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "status",
        type: "Query",
        schema: status,
      },
      {
        name: "step",
        type: "Query",
        schema: step,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
      {
        name: "user_id",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(TaskResponse),
  },
  {
    method: "post",
    path: "/api/internal/tasks/:uuid/webhooks/odm",
    alias: "callTaskOdmWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ODMTaskWebhookInternal,
      },
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "signature",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({ message: z.string() }).passthrough(),
  },
  {
    method: "post",
    path: "/api/internal/token/pair",
    alias: "getUserTokenPair",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TokenRequestInternal,
      },
    ],
    response: TokenPairResponseInternal,
  },
  {
    method: "post",
    path: "/api/internal/token/refresh",
    alias: "refreshUserAccessToken",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ refresh: z.string() }).passthrough(),
      },
    ],
    response: z.object({ access: z.string() }).passthrough(),
  },
  {
    method: "post",
    path: "/api/internal/workspaces/",
    alias: "createWorkspaceInternal",
    description: `Create Workspace item`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateWorkspaceInternal,
      },
    ],
    response: WorkspaceResponseInternal,
  },
  {
    method: "get",
    path: "/api/internal/workspaces/",
    alias: "listWorkspacesInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "name",
        type: "Query",
        schema: name,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "user_id",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(WorkspaceResponseInternal),
  },
  {
    method: "get",
    path: "/api/results/",
    alias: "listTaskResults",
    requestFormat: "json",
    parameters: [
      {
        name: "result_type",
        type: "Query",
        schema: result_type,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(ResultResponse),
  },
  {
    method: "get",
    path: "/api/results/:uuid",
    alias: "getTaskResult",
    description: `Get ODMTaskResult item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ResultResponse,
  },
  {
    method: "delete",
    path: "/api/results/:uuid",
    alias: "deleteTaskResult",
    description: `Delete ODMTaskResult item`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/results/:uuid/download",
    alias: "downloadTaskResult",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/results/:uuid/share",
    alias: "shareTaskResult",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ share_api_key: z.string() }).passthrough(),
  },
  {
    method: "get",
    path: "/api/results/:uuid/shared",
    alias: "downloadSharedTaskResult",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "api_key",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/tasks/",
    alias: "listTasks",
    requestFormat: "json",
    parameters: [
      {
        name: "status",
        type: "Query",
        schema: status,
      },
      {
        name: "step",
        type: "Query",
        schema: step,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
      {
        name: "workspace_uuid",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(TaskResponse),
  },
  {
    method: "post",
    path: "/api/tasks/",
    alias: "createTask",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTask,
      },
    ],
    response: TaskResponse,
  },
  {
    method: "get",
    path: "/api/tasks/:uuid",
    alias: "getTask",
    description: `Get ODMTask item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: TaskResponse,
  },
  {
    method: "delete",
    path: "/api/tasks/:uuid",
    alias: "deleteTask",
    description: `Delete ODMTask item`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/tasks/:uuid/:action",
    alias: "callTaskAction",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "action",
        type: "Path",
        schema: z.enum(["pause", "resume", "cancel"]),
      },
    ],
    response: TaskResponse,
  },
  {
    method: "get",
    path: "/api/version",
    alias: "getAPIVersion",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/workspaces/",
    alias: "createWorkspace",
    description: `Create Workspace item`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateWorkspace,
      },
    ],
    response: WorkspaceResponse,
  },
  {
    method: "get",
    path: "/api/workspaces/",
    alias: "listWorkspaces",
    requestFormat: "json",
    parameters: [
      {
        name: "name",
        type: "Query",
        schema: name,
      },
      {
        name: "created_after",
        type: "Query",
        schema: name,
      },
      {
        name: "created_before",
        type: "Query",
        schema: name,
      },
    ],
    response: z.array(WorkspaceResponse),
  },
  {
    method: "get",
    path: "/api/workspaces/:uuid",
    alias: "getWorkspace",
    description: `Get Workspace item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: WorkspaceResponse,
  },
  {
    method: "patch",
    path: "/api/workspaces/:uuid",
    alias: "updateWorkspace",
    description: `Patch Workspace item by uuid`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: WorkspaceResponse,
  },
  {
    method: "delete",
    path: "/api/workspaces/:uuid",
    alias: "deleteWorkspace",
    description: `Delete Workspace item`,
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/workspaces/:uuid/upload-image",
    alias: "uploadImageToWorkspace",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ image_file: z.instanceof(File) }).passthrough(),
      },
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ImageResponse,
  },
  {
    method: "post",
    path: "/api/workspaces/:uuid/upload-images",
    alias: "uploadImagesToWorkspace",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: uploadImagesToWorkspace_Body,
      },
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(ImageResponse),
  },
  {
    method: "post",
    path: "/api/workspaces/:uuid/upload-images-tus",
    alias: "createTusUploadInWorkspace",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Tus-Resumable",
        type: "Header",
        schema: z.string(),
      },
      {
        name: "Upload-Length",
        type: "Header",
        schema: z.number().int(),
      },
      {
        name: "Upload-Metadata",
        type: "Header",
        schema: name,
      },
    ],
    response: z.void(),
  },
  {
    method: "options",
    path: "/api/workspaces/:uuid/upload-images-tus",
    alias: "getTusWorkspaceUploadOptions",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "options",
    path: "/api/workspaces/:uuid/upload-images-tus/:resource_id",
    alias: "getTusResourceOptions",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "resource_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "patch",
    path: "/api/workspaces/:uuid/upload-images-tus/:resource_id",
    alias: "uploadTusChunkToWorkspace",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "resource_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "Tus-Resumable",
        type: "Header",
        schema: z.string(),
      },
      {
        name: "Upload-Offset",
        type: "Header",
        schema: z.number().int(),
      },
      {
        name: "Content-Type",
        type: "Header",
        schema: z
          .string()
          .optional()
          .default("application/offset+octet-stream"),
      },
    ],
    response: z.void(),
  },
  {
    method: "head",
    path: "/api/workspaces/:uuid/upload-images-tus/:resource_id",
    alias: "checkTusUploadResumeInWorkspace",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "resource_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "Tus-Resumable",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
