export interface Person {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Publisher {
  _id: string;
  name: string;
}

export interface Site {
  _id: string;
  address: string;
  title: string;
  html: string;
  publisher: Publisher;
  createdAt?: string;
  updatedAt?: string;
}

export type VisitSource = "address" | "link" | "history";

export interface BrowseResponse {
  exists: boolean;
  address: string;
  site: Site | null;
}

export interface Visit {
  _id: string;
  person: string;
  address: string;
  exists: boolean;
  source: VisitSource;
  createdAt: string;
  updatedAt: string;
}
