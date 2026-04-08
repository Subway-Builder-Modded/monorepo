export type WebsiteAnalyticsPeriod = '1d' | '7d' | '30d' | 'all';

export type WebsiteSummaryStats = {
  pageviews: number;
  visitors: number;
  topPage: string;
  topPageViews: number;
  topCountry: string;
  topCountryVisitors: number;
  topDevice: string;
  topDeviceVisitors: number;
};

export type WebsiteTimeseriesRow = {
  date: string;
  pageviews: number;
  visitors: number;
};

export type WebsitePageRow = {
  path: string;
  pageviews: Record<WebsiteAnalyticsPeriod, number>;
  visitors: Record<WebsiteAnalyticsPeriod, number>;
  entrances?: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteCountryRow = {
  country: string;
  countryCode?: string;
  pageviews: Record<WebsiteAnalyticsPeriod, number>;
  visitors: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteBrowserRow = {
  browser: string;
  visits: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteOperatingSystemRow = {
  os: string;
  visits: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteDeviceRow = {
  device: string;
  visits: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteScreenSizeRow = {
  size: string;
  visits: Record<WebsiteAnalyticsPeriod, number>;
};

export type WebsiteAnalyticsData = {
  snapshotLabel: string;
  summary: WebsiteSummaryStats;
  timeseries: WebsiteTimeseriesRow[];
  pages: WebsitePageRow[];
  countries: WebsiteCountryRow[];
  browsers: WebsiteBrowserRow[];
  operatingSystems: WebsiteOperatingSystemRow[];
  devices: WebsiteDeviceRow[];
  screenSizes: WebsiteScreenSizeRow[];
};
