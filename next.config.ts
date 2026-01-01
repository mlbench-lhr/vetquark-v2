import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { icon: true },
          },
        ],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    const fileLoaderRule = (config.module.rules as any[]).find(
      (rule) => rule.test?.test?.(".svg")
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.(js|ts)x?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: { icon: true },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;