# MAXIM Deraining

[![](https://data.jsdelivr.com/v1/package/npm/@upscalerjs/maxim-deraining/badge)](https://www.jsdelivr.com/package/npm/@upscalerjs/maxim-deraining)

MAXIM Deraining is a model for deraining images with [UpscalerJS](https://upscalerjs.com).

## Quick start

Install the package:

```
npm install @upscalerjs/maxim-deraining
```

Then, import the model and pass it as an argument to an instance of UpscalerJS:

```
import UpscalerJS from 'upscaler';
import small from '@upscalerjs/maxim-deraining/small';

const upscaler = new UpscalerJS({
  model,
})
```

The model is unquantized and accepts dynamic image sizes.

## Paper

> Recent progress on Transformers and multi-layer perceptron (MLP) models provide new network architectural designs for computer vision tasks. Although these models proved to be effective in many vision tasks such as image recognition, there remain challenges in adapting them for low-level vision. The inflexibility to support high-resolution images and limitations of local attention are perhaps the main bottlenecks. In this work, we present a multi-axis MLP based architecture called MAXIM, that can serve as an efficient and flexible general-purpose vision backbone for image processing tasks. MAXIM uses a UNet-shaped hierarchical structure and supports long-range interactions enabled by spatially-gated MLPs. Specifically, MAXIM contains two MLP-based building blocks: a multi-axis gated MLP that allows for efficient and scalable spatial mixing of local and global visual cues, and a cross-gating block, an alternative to cross-attention, which accounts for cross-feature conditioning. Both these modules are exclusively based on MLPs, but also benefit from being both global and `fully-convolutional', two properties that are desirable for image processing. Our extensive experimental results show that the proposed MAXIM model achieves state-of-the-art performance on more than ten benchmarks across a range of image processing tasks, including denoising, deblurring, deraining, dehazing, and enhancement while requiring fewer or comparable numbers of parameters and FLOPs than competitive models.

&mdash; [MAXIM: Multi-Axis MLP for Image Processing](https://arxiv.org/abs/2201.02973)

## Sample Images

### Original
![Original image](https://github.com/thekevinscott/UpscalerJS/blob/main/models/maxim-deraining/assets/fixture.png?raw=true)

### Derained
![Derained image](https://github.com/thekevinscott/UpscalerJS/blob/main/models/maxim-deraining/assets/samples/large/result.png?raw=true)

## Documentation

For more documentation, check out the model documentation at [upscalerjs.com/models/available/maxim-deraining](https://upscalerjs.com/models/available/maxim-deraining).

## License

[MIT License](https://oss.ninja/mit/developit/) © [Kevin Scott](https://thekevinscott.com)