// Narrow declaration of the official ITK-Wasm browser bundle APIs used here.
export class ImageType {
  constructor(
    dimension: number,
    componentType: "uint8" | "float32",
    pixelType: "Scalar",
    components: number,
  );
}
export class Image {
  constructor(type: ImageType);
  size: number[];
  origin: number[];
  spacing: number[];
  direction: Float64Array;
  data: Float32Array | Uint8Array;
}
export const InterfaceTypes: {
  Image: "Image";
  TransformList: "TransformList";
  JsonCompatible: "JsonCompatible";
};
export function runPipeline(
  path: string,
  args: string[],
  outputs: Array<{ type: string }>,
  inputs: Array<{ type: string; data: unknown }>,
  options: { webWorker: false; pipelineBaseUrl: string },
): Promise<{ outputs: Array<{ data: unknown }>; returnValue: number }>;
