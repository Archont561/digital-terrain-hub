
export function getNinjaODMUrl(...args: string[]) {
  return new URL(args.join("/"), process.env.NINJAODM_BASE_URL).href;
}