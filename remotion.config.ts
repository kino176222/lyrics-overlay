import { Config } from '@remotion/cli/config';

// 高品質設定（Final Cut Pro互換）
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuva444p10le');
Config.setCodec('prores');
Config.setProResProfile('4444');

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