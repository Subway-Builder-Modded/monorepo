export type TemplateModCta = {
  label: string;
  href: string;
  icon: string;
  style: "solid" | "outline";
  external?: boolean;
};

export type TemplateModFoundationCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type TemplateModDirectoryNode = {
  id: string;
  label: string;
  kind: "folder" | "file";
  children?: TemplateModDirectoryNode[];
};

export type TemplateModCodeExample = {
  id: string;
  label: string;
  icon: string;
  lang: string;
  title: string;
  content: string;
};


