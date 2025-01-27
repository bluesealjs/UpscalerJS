/****
 * Tests that different approaches to loading a model all load correctly
 */
import Upscaler, { ModelDefinition } from 'upscaler';
import * as tf from '@tensorflow/tfjs';
// import { AvailableModel, getFilteredModels } from '../../../../scripts/package-scripts/utils/getAllAvailableModels.js';
import path from 'path';
import { MODELS_DIR } from '@internals/common/constants';
import { ClientsideTestRunner } from '@internals/test-runner/clientside';
import { getPackagesAndModelsForEnvironment, getUMDNames } from '@internals/common/models';
import { getPackageJSON } from '@internals/common/package-json';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} not defined in env`);
  }
  return value;
};
const ESBUILD_DIST_FOLDER = getEnv('ESBUILD_DIST_FOLDER');
const UMD_DIST_FOLDER = getEnv('UMD_DIST_FOLDER');
const CI = process.env.CI === 'true';

describe('Clientside model integration tests', () => {
  const packagesWithModels = getPackagesAndModelsForEnvironment('clientside', CI);

  describe('ESM', async () => {
    const testRunner = new ClientsideTestRunner({
      name: 'esm',
      mock: true,
      dist: ESBUILD_DIST_FOLDER,
    });

    beforeAll(async function beforeAll() {
      await testRunner.beforeAll();
    }, 60000);

    afterAll(async function modelAfterAll() {
      await testRunner.afterAll();
    }, 10000);

    beforeEach(async function beforeEach() {
      await testRunner.beforeEach('| Loaded');
    });

    afterEach(async function afterEach() {
      await testRunner.afterEach();
    });

    const models = (await packagesWithModels).map(({ packageDirectoryName, modelName }) => ([
      path.join('@upscalerjs', packageDirectoryName, modelName),
      packageDirectoryName,
      modelName,
    ]));
    console.log('models', models);

    test.each(models)('%s', async (windowModelPath, packageDirectoryName, modelName) => {
      const fixturePath = `${await testRunner.getFixturesServerURL()}/${packageDirectoryName}/test/__fixtures__/fixture.png`;
      const result = await testRunner.page.evaluate(({ fixturePath, windowModelPath }) => {
        const model = window[windowModelPath] as unknown as ModelDefinition;
        if (!model) {
          throw new Error('No model found')
        }
        const upscaler = new window['Upscaler']({
          model,
        });
        return upscaler.execute(fixturePath, {
          patchSize: 64,
          padding: 2,
        });
      }, { fixturePath, windowModelPath });
      const FIXTURE_PATH = path.resolve(MODELS_DIR, packageDirectoryName, `test/__fixtures__${modelName === 'index' ? '' : `/${modelName}`}`, 'result.png');
      expect(result).toMatchImage(FIXTURE_PATH);
    });
  });

  describe('UMD', async () => {
    const UMD_PORT = 8096;
    const testRunner = new ClientsideTestRunner({
      name: 'umd',
      mock: true,
      dist: UMD_DIST_FOLDER,
      port: UMD_PORT,
    });


    beforeAll(async function modelBeforeAll() {
      await testRunner.beforeAll();
    }, 20000);

    afterAll(async function modelAfterAll() {
      await testRunner.afterAll();
    }, 30000);

    beforeEach(async function beforeEach() {
      await testRunner.beforeEach(null);
    });

    afterEach(async function afterEach() {
      await testRunner.afterEach();
    });

    const modelsWithMainUMDs = await Promise.all((await packagesWithModels).filter(m => {
      return m.modelName !== '.';
    }).map(async ({ packageDirectoryName, modelName, ...rest }) => {
      const [
        packageJSON,
        umdNames,
      ] = await Promise.all([
        getPackageJSON(path.resolve(MODELS_DIR, packageDirectoryName)),
        getUMDNames(path.resolve(MODELS_DIR, packageDirectoryName)),
      ]);
      const umdModelDefinition = umdNames[modelName];
      if (typeof umdModelDefinition === 'string' && modelName !== '.') {
        throw new Error(`Expected umdModelDefinition to be an object for ${packageDirectoryName}/${modelName}`)
      }
      return {
        packageDirectoryName,
        // packageJSON,
        mainUMDScriptPath: packageJSON['umd:main'],
        mainUMDName: umdNames['.'],

        modelName,

        modelUMDScriptPath: packageJSON['exports'][modelName].umd,
        modelUMDIndexName: umdModelDefinition.index,
        ...rest
      }
    }));

    test.each(modelsWithMainUMDs.map(m => {
      return [
        `${m.packageDirectoryName}/${m.modelName}`,
        m,
      ];
    }))('%s (from index)', async (_, { packageDirectoryName, modelName, mainUMDName, mainUMDScriptPath, modelUMDIndexName, }) => {
      const fixturePath = `${await testRunner.getFixturesServerURL()}/${packageDirectoryName}/test/__fixtures__/fixture.png`;
      const modelScriptPath = `${await testRunner.getFixturesServerURL()}/${packageDirectoryName}/${mainUMDScriptPath}`;
      await testRunner.page.evaluate(async ({ modelScriptPath, mainUMDName, modelUMDIndexName }) => {
        await window['loadScript'](modelScriptPath);
        const model = window[mainUMDName][modelUMDIndexName];
        if (!model) {
          throw new Error(`No model for ${mainUMDName}.${modelUMDIndexName}`);
        }
        window['model'] = model;
      }, { modelScriptPath, mainUMDName, modelUMDIndexName });
      const result = await testRunner.page.evaluate(async ({ fixturePath }) => {
        const upscaler = new window['Upscaler']({
          model: window['model'],
        });
        return upscaler.execute(fixturePath, {
          patchSize: 64,
          padding: 2,
        });
      }, { fixturePath, });
      const FIXTURE_PATH = path.resolve(MODELS_DIR, packageDirectoryName, `test/__fixtures__${modelName === 'index' ? '' : `/${modelName}`}`, 'result.png');
      expect(result).toMatchImage(FIXTURE_PATH);
    });

    const directModels = await Promise.all((await packagesWithModels).filter(m => {
      return m;
    }).map(async ({ packageDirectoryName, modelName, ...rest }) => {
      const [
        packageJSON,
        umdNames,
      ] = await Promise.all([
        getPackageJSON(path.resolve(MODELS_DIR, packageDirectoryName)),
        getUMDNames(path.resolve(MODELS_DIR, packageDirectoryName)),
      ]);
      const umdModelDefinition = umdNames[modelName];
      if (typeof umdModelDefinition === 'string' && modelName !== '.') {
        throw new Error(`Expected umdModelDefinition to be an object for ${packageDirectoryName}/${modelName}`)
      }
      return {
        packageDirectoryName,
        // packageJSON,
        modelName,

        modelUMDScriptPath: packageJSON['exports'][modelName].umd,
        modelUMDDirectName: typeof umdModelDefinition === 'string' ? umdModelDefinition : umdModelDefinition.direct,
        ...rest
      }
    }));

    test.each(directModels.map(m => {
      return [
        `${m.packageDirectoryName}/${m.modelName}`,
        m,
      ];
    }))('%s (direct)', async (_, { modelUMDScriptPath, packageDirectoryName, modelName, modelUMDDirectName, ...rest }) => {
      const fixturePath = `${await testRunner.getFixturesServerURL()}/${packageDirectoryName}/test/__fixtures__/fixture.png`;
      const modelScriptPath = `${await testRunner.getFixturesServerURL()}/${packageDirectoryName}/${modelUMDScriptPath}`;
      // await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
      await testRunner.page.evaluate(async ({ modelScriptPath, modelUMDDirectName }) => {
        await window['loadScript'](modelScriptPath);
        const model = window[modelUMDDirectName];
        if (!model) {
          throw new Error(`No model for ${modelUMDDirectName}`);
        }
        window['model'] = model;
      }, { modelScriptPath, modelUMDDirectName });
      const result = await testRunner.page.evaluate(async ({ fixturePath, }) => {
        const upscaler = new window['Upscaler']({
          model: window['model'],
        });
        return upscaler.execute(fixturePath, {
          patchSize: 64,
          padding: 2,
        });
      }, { fixturePath, });
      const FIXTURE_PATH = path.resolve(MODELS_DIR, packageDirectoryName, `test/__fixtures__${modelName === 'index' ? '' : `/${modelName}`}`, 'result.png');
      expect(result).toMatchImage(FIXTURE_PATH);
    });
  });
});

declare global {
  interface Window {
    Upscaler: typeof Upscaler;
    tf: typeof tf;
  }
}
