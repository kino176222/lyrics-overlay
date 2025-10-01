import { Config } from '@remotion/cli/config';

// 透過対応設定
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuva444p10le');
Config.setCodec('prores');
Config.setProResProfile('4444');

// 一時ファイル問題を回避するための設定
Config.setConcurrency(1);
Config.setFrameRange([0, 100]); // テスト用に短く設定

// Web版の設定を継承
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    module: {
      ...currentConfiguration.module,
      rules: [
        ...(currentConfiguration.module?.rules ?? []),
        {
          test: /\.(mp3|wav|m4a|aac)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },
      ],
    },
  };
});