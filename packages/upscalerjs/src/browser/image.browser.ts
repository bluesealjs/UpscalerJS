import * as tf from '@tensorflow/tfjs';
import type { Tensor, Tensor3D, Tensor4D, } from '@tensorflow/tfjs-core';
import { CheckValidEnvironment, GetImageAsTensor, TensorAsBase64, } from '../shared/types';
import { tensorAsClampedArray, } from '../shared/tensor-utils';
import { isString, isFourDimensionalTensor, isThreeDimensionalTensor, isTensor, } from '../../../shared/src/constants';

const ERROR_ENVIRONMENT_DISALLOWS_BASE64_URL =
  'https://upscalerjs.com/documentation/troubleshooting#environment-disallows-base64';

const ERROR_ENVIRONMENT_DISALLOWS_STRING_INPUT_URL =
  'https://upscalerjs.com/documentation/troubleshooting#environment-disallows-string-input';

export const getEnvironmentDisallowsStringInput = () => new Error([
  'Environment does not support a string URL as an input format.',
  `For more information, see ${ERROR_ENVIRONMENT_DISALLOWS_STRING_INPUT_URL}.`,
].join('\n'));

export const getEnvironmentDisallowsBase64 = () => new Error([
  'Environment does not support base64 as an output format.',
  `For more information, see ${ERROR_ENVIRONMENT_DISALLOWS_BASE64_URL}.`,
].join('\n'));

export const getInvalidTensorError = (input: Tensor): Error => new Error(
  [
    `Unsupported dimensions for incoming pixels: ${input.shape.length}.`,
    'Only 3 or 4 rank tensors are supported.',
  ].join('\n'),
);

export const getInvalidImageError = (): Error => new Error([
  'Failed to load image',
].join(' '));

export const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.src = src;
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => reject(getInvalidImageError());
});

const fromPixels = (input: Exclude<Input, string | Tensor>) => tf.browser.fromPixelsAsync(input);

const getTensorFromInput = async (
  input: Input, 
   /* eslint-disable @typescript-eslint/no-unused-vars */
  _tf: typeof tf,
): Promise<Tensor3D | Tensor4D> => {
  if (isTensor(input)) {
    return input;
  }

  if (isString(input)) {
    const imgHTMLElement = await loadImage(input);
    return fromPixels(imgHTMLElement);
  }

  return fromPixels(input);
};

export type Input = Tensor3D | Tensor4D | string | tf.FromPixelsInputs['pixels'];
export const getImageAsTensor: GetImageAsTensor<typeof tf, Input> = async (
  tf,
  input,
) => {
  const tensor = await getTensorFromInput(input, tf);

  if (isThreeDimensionalTensor(tensor)) {
    // https://github.com/tensorflow/tfjs/issues/1125
    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    const expandedTensor = tensor.expandDims(0) as Tensor4D;
    tensor.dispose();
    return expandedTensor;
  }

  if (isFourDimensionalTensor(tensor)) {
    return tensor;
  }

  throw getInvalidTensorError(tensor);
};

export const isHTMLImageElement = (pixels: Input): pixels is HTMLImageElement => {
  try {
    return pixels instanceof HTMLImageElement;
  } catch (err) {
    return false;
  }
};

export const tensorAsBase64: TensorAsBase64<typeof tf> = (tf, tensor) => {
  const arr = tensorAsClampedArray(tf, tensor);
  const [height, width, ] = tensor.shape;
  const imageData = new ImageData(width, height);
  imageData.data.set(arr);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No context found');
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};

const checkIfValidEnvironment = (errFn: () => Error) => {
  try {
    if ((new Image() && 'createElement' in document) !== true) { // skipcq: JS-0354
      throw errFn();
    }
  } catch(err) {
    throw errFn();
  }
};

export const checkValidEnvironment: CheckValidEnvironment<Input> = (input, {
  output = 'base64',
  progressOutput,
}) => {
  if (typeof input === 'string') {
    checkIfValidEnvironment(getEnvironmentDisallowsStringInput);
  }
  if (progressOutput === 'base64' || output === 'base64') {
    checkIfValidEnvironment(getEnvironmentDisallowsBase64);
  }
};
