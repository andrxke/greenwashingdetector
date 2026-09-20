import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off"
    }
  }
];

export default eslintConfig;
