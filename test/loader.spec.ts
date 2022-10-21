import loader, { DEFAULT_NAME } from '../src/loader';
import { install, testConfig, randomStr, currentScript } from './common';
import { Configurations } from '../src/models';

describe('loader', () => {
  it('should throw error if poolId not provided', () => {
    // arrange
    const expectedName = DEFAULT_NAME;
    install(expectedName);
    const renderMock = jest.fn();

    // act
    expect(() =>
      loader(window, testConfig({ poolId: null }), null, renderMock)
    ).toThrowError("You must provide 'poolId' in 'init' method.");
  });

  it('should throw error if poolName not provided', () => {
    // arrange
    const expectedName = DEFAULT_NAME;
    install(expectedName);
    const renderMock = jest.fn();

    // act
    expect(() =>
      loader(
        window,
        testConfig({ poolId: '1', poolName: null }),
        null,
        renderMock
      )
    ).toThrowError("You must provide 'poolName' in 'init' method.");
  });

  it('should load single default instance', () => {
    // arrange
    const expectedName = DEFAULT_NAME;
    install(expectedName);
    const renderMock = jest.fn();

    // act
    loader(window, testConfig(), null, renderMock);

    // assert
    expect(window[expectedName]).toBeDefined();
    expect(window['loaded-' + expectedName]).toBeDefined();
    expect(renderMock).toBeCalled();
  });

  it('should load single named instance', () => {
    // arrange
    const expectedName = randomStr(5);
    install(expectedName);
    const renderMock = jest.fn();

    // act
    loader(window, testConfig(), currentScript(expectedName), renderMock);

    // assert
    expect(window[expectedName]).toBeDefined();
    expect(window['loaded-' + expectedName]).toBeDefined();
    expect(renderMock).toBeCalled();
  });

  it('should load multiple named instance', () => {
    // arrange
    const expectedName1 = randomStr(5);
    const expectedName2 = randomStr(5);
    const expectedConfig1 = { poolId: '1' };
    const expectedConfig2 = { poolId: '2' };
    install(expectedName1, expectedConfig1);
    install(expectedName2, expectedConfig2);

    const renderMock1 = jest.fn(
      (_: HTMLElement, __: Configurations) => undefined
    );
    const renderMock2 = jest.fn(
      (_: HTMLElement, __: Configurations) => undefined
    );

    // act
    loader(window, testConfig(), currentScript(expectedName1), renderMock1);
    loader(window, testConfig(), currentScript(expectedName2), renderMock2);

    // assert
    expect(window[expectedName1]).toBeDefined();
    expect(window[expectedName2]).toBeDefined();

    expect(window['loaded-' + expectedName1]).toBeDefined();
    expect(window['loaded-' + expectedName2]).toBeDefined();

    expect(renderMock1).toBeCalledWith(
      expect.anything(),
      expect.objectContaining(expectedConfig1)
    );
    expect(renderMock2).toBeCalledWith(
      expect.anything(),
      expect.objectContaining(expectedConfig2)
    );
  });
});
