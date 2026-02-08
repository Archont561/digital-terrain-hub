export type ThumbnailProps = {
  uuid: string;
  originUuid: string;
  name: string;
  url: string;
  originUrl: string;
}

type GCPoint = [number, number, number];
type ImagePoint = [number, number];

export type GCPProps = {
  uuid: string;
  image_uuid: string;
  gcp_point: GCPoint;
  image_point: ImagePoint;
  label: string;
}
