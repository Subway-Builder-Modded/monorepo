declare module "virtual:mdx-raw-content" {
  const rawContentData: {
    rawByPath: Record<string, string>;
    frontmatterByPath: Record<string, unknown>;
  };

  export default rawContentData;
}
