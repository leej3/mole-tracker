import {
  runPipeline,
  InterfaceTypes,
  Image,
  ImageType,
} from "../vendor/itkelastix/runtime/itk-wasm.js";
import {
  samplingMask,
  fromElastix,
  scoreAlignment,
  RegistrationImage,
} from "./registration";
const makeImage = (
  input: RegistrationImage,
  data: Float32Array | Uint8Array,
  origin = [0, 0],
) => {
  const image = new Image(
    new ImageType(
      2,
      data instanceof Uint8Array ? "uint8" : "float32",
      "Scalar",
      1,
    ),
  );
  image.size = [input.width, input.height];
  image.origin = origin;
  image.spacing = [1, 1];
  image.direction = new Float64Array([1, 0, 0, 1]);
  image.data = data;
  return image;
};
// Neutralize excluded pixels before pyramids are formed. The expanded sampling masks
// also exclude the resulting boundary; changing the lesion cannot change the inputs.
const cleanPixels = (input: RegistrationImage, mask: Uint8Array) => {
  let sum = 0,
    n = 0;
  input.pixels.forEach((v, i) => {
    if (!Number.isFinite(v)) throw new Error("Invalid image pixels.");
    if (mask[i]) {
      sum += v;
      n++;
    }
  });
  const data = input.pixels.slice(),
    e = input.exclusion;
  for (let y = 0; y < input.height; y++)
    for (let x = 0; x < input.width; x++)
      if ((x - e.x) ** 2 + (y - e.y) ** 2 <= e.radius ** 2)
        data[y * input.width + x] = sum / n;
  return data;
};
self.onmessage = async (
  event: MessageEvent<{ fixed: RegistrationImage; moving: RegistrationImage }>,
) => {
  try {
    const { fixed, moving } = event.data,
      fm = samplingMask(fixed),
      mm = samplingMask(moving);
    const movingOrigin = [
      fixed.exclusion.x - moving.exclusion.x,
      fixed.exclusion.y - moving.exclusion.y,
    ];
    const parameters = [
      {
        Registration: ["MultiResolutionRegistration"],
        Transform: ["AffineTransform"],
        Metric: ["AdvancedNormalizedCorrelation"],
        Optimizer: ["AdaptiveStochasticGradientDescent"],
        ImageSampler: ["RandomCoordinate"],
        Interpolator: ["LinearInterpolator"],
        ResampleInterpolator: ["FinalLinearInterpolator"],
        Resampler: ["DefaultResampler"],
        FixedImagePyramid: ["FixedSmoothingImagePyramid"],
        MovingImagePyramid: ["MovingSmoothingImagePyramid"],
        NumberOfResolutions: ["3"],
        MaximumNumberOfIterations: ["256"],
        NumberOfSpatialSamples: ["2048"],
        NewSamplesEveryIteration: ["true"],
        MaximumNumberOfSamplingAttempts: ["8"],
        RequiredRatioOfValidSamples: ["0.1"],
        AutomaticScalesEstimation: ["true"],
        AutomaticTransformInitialization: ["false"],
        ErodeMask: ["true"],
        UseDirectionCosines: ["true"],
        WriteResultImage: ["true"],
        RandomSeed: ["12345"],
        DefaultPixelValue: ["0"],
      },
    ];
    const inputs = [
      { type: InterfaceTypes.JsonCompatible, data: parameters },
      {
        type: InterfaceTypes.Image,
        data: makeImage(fixed, cleanPixels(fixed, fm)),
      },
      {
        type: InterfaceTypes.Image,
        data: makeImage(moving, cleanPixels(moving, mm), movingOrigin),
      },
      { type: InterfaceTypes.Image, data: makeImage(fixed, fm) },
      { type: InterfaceTypes.Image, data: makeImage(moving, mm, movingOrigin) },
    ];
    const { outputs, returnValue } = await runPipeline(
      "elastix",
      [
        "0",
        "0",
        "1",
        "2",
        "--memory-io",
        "--fixed",
        "1",
        "--moving",
        "2",
        "--fixed-mask",
        "3",
        "--moving-mask",
        "4",
      ],
      [
        { type: InterfaceTypes.Image },
        { type: InterfaceTypes.TransformList },
        { type: InterfaceTypes.JsonCompatible },
      ],
      inputs,
      {
        webWorker: false,
        pipelineBaseUrl: new URL(".", self.location.href).href.replace(
          /\/$/,
          "",
        ),
      },
    );
    if (returnValue !== 0)
      throw new Error(
        "ITKElastix could not align this pair. Try a closer initial position.",
      );
    const matrix = fromElastix(outputs[2].data, movingOrigin);
    self.postMessage({ result: scoreAlignment(fixed, moving, matrix) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Alignment failed.",
    });
  }
};
