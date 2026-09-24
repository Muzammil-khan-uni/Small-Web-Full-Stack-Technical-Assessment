import type { BrowseResponse, Person, Site, Visit, VisitSource } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface PublishSiteInput {
  address: string;
  html: string;
  publisherId: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();

      if (typeof body?.message === "string") {
        message = body.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getPeople(): Promise<Person[]> {
  const response = await fetch(`${API_URL}/people`, {
    cache: "no-store",
  });

  return parseResponse<Person[]>(response);
}

export async function browseSite(
  personId: string,
  address: string,
  source: VisitSource = "address",
): Promise<BrowseResponse> {
  const response = await fetch(`${API_URL}/sites/browse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personId,
      address,
      source,
    }),
  });

  return parseResponse<BrowseResponse>(response);
}

export async function searchSites(query: string): Promise<Site[]> {
  const response = await fetch(
    `${API_URL}/sites/search/query?q=${encodeURIComponent(query)}`,
    {
      cache: "no-store",
    },
  );

  return parseResponse<Site[]>(response);
}

export async function getHistory(personId: string): Promise<Visit[]> {
  const response = await fetch(
    `${API_URL}/visits/person/${encodeURIComponent(personId)}`,
    {
      cache: "no-store",
    },
  );

  return parseResponse<Visit[]>(response);
}

export async function publishSite(input: PublishSiteInput): Promise<Site> {
  const response = await fetch(`${API_URL}/sites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Site>(response);
}
