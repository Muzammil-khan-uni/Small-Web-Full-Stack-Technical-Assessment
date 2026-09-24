"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  browseSite,
  getHistory,
  getPeople,
  publishSite,
  searchSites,
} from "@/lib/api";

import type { BrowseResponse, Person, Site, Visit, VisitSource } from "@/types";

interface PageNavigationEntry {
  type: "page";
  address: string;
  page: BrowseResponse;
}

interface SearchNavigationEntry {
  type: "search";
  query: string;
  results: Site[];
}

type NavigationEntry = PageNavigationEntry | SearchNavigationEntry;

interface PersonSession {
  address: string;
  page: BrowseResponse | null;
  navigation: NavigationEntry[];
  navigationIndex: number;
}

const DEFAULT_PUBLISH_HTML = `<html>
<head>
  <title>My Small Web Site</title>
</head>
<body>
  <h1>My Small Web Site</h1>

  <p>This page was published through The Small Web.</p>

  <p>
    <a href="garden.local">Visit the Quiet Garden</a>
  </p>
</body>
</html>`;

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");

  const [address, setAddress] = useState("garden.local");
  const [page, setPage] = useState<BrowseResponse | null>(null);

  const [navigation, setNavigation] = useState<NavigationEntry[]>([]);

  const [navigationIndex, setNavigationIndex] = useState(-1);

  const [personSessions, setPersonSessions] = useState<
    Record<string, PersonSession>
  >({});

  /*
   * Persistent browsing history.
   */
  const [history, setHistory] = useState<Visit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [historyError, setHistoryError] = useState("");

  /*
   * Search.
   */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Site[]>([]);

  const [showSearchResults, setShowSearchResults] = useState(false);

  const [loadingSearch, setLoadingSearch] = useState(false);

  const [searchError, setSearchError] = useState("");

  /*
   * Publishing.
   */
  const [showPublish, setShowPublish] = useState(false);

  const [publishAddress, setPublishAddress] = useState("");

  const [publishHtml, setPublishHtml] = useState(DEFAULT_PUBLISH_HTML);

  const [publisherId, setPublisherId] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");

  /*
   * General application state.
   */
  const [loadingPeople, setLoadingPeople] = useState(true);

  const [loadingPage, setLoadingPage] = useState(false);

  const [error, setError] = useState("");

  const canGoBack = navigationIndex > 0;

  const canGoForward =
    navigationIndex >= 0 && navigationIndex < navigation.length - 1;

  /*
   * Load people when the application starts.
   */
  useEffect(() => {
    async function loadPeople() {
      try {
        setError("");

        const result = await getPeople();

        setPeople(result);

        if (result.length > 0) {
          setLoadingHistory(true);

          setSelectedPersonId(result[0]._id);
          setPublisherId(result[0]._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load people");
      } finally {
        setLoadingPeople(false);
      }
    }

    void loadPeople();
  }, []);

  /*
   * Load persistent MongoDB history whenever the selected
   * browser identity changes.
   */
  useEffect(() => {
    if (!selectedPersonId) {
      return;
    }

    let cancelled = false;

    async function loadSelectedPersonHistory() {
      try {
        const result = await getHistory(selectedPersonId);

        if (!cancelled) {
          setHistory(result);
          setHistoryError("");
          setLoadingHistory(false);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err instanceof Error
              ? err.message
              : "Unable to load browsing history",
          );

          setLoadingHistory(false);
        }
      }
    }

    void loadSelectedPersonHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedPersonId]);

  /*
   * Extract internal Small Web links from the current
   * publisher HTML.
   *
   * The HTML itself stays isolated in the sandboxed iframe.
   */
  const pageLinks = useMemo(() => {
    if (!page?.exists || !page.site) {
      return [];
    }

    const matches = Array.from(
      page.site.html.matchAll(
        /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      ),
    );

    const unique = new Map<string, string>();

    for (const match of matches) {
      const href = match[1]?.trim();

      const rawLabel = match[2]?.replace(/<[^>]*>/g, "").trim();

      if (!href) {
        continue;
      }

      const normalizedHref = href.toLowerCase();

      /*
       * Only expose internal Small Web addresses.
       */
      if (
        normalizedHref.startsWith("http://") ||
        normalizedHref.startsWith("https://") ||
        normalizedHref.startsWith("javascript:") ||
        normalizedHref.startsWith("data:") ||
        normalizedHref.startsWith("mailto:") ||
        normalizedHref.startsWith("#")
      ) {
        continue;
      }

      unique.set(normalizedHref, rawLabel || normalizedHref);
    }

    return Array.from(unique.entries()).map(([href, label]) => ({
      href,
      label,
    }));
  }, [page]);

  /*
   * Refresh persistent browsing history after a new visit.
   */
  async function refreshHistory(personId: string) {
    if (!personId) {
      return;
    }

    setLoadingHistory(true);
    setHistoryError("");

    try {
      const result = await getHistory(personId);

      if (personId === selectedPersonId) {
        setHistory(result);
      }
    } catch (err) {
      if (personId === selectedPersonId) {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Unable to load browsing history",
        );
      }
    } finally {
      if (personId === selectedPersonId) {
        setLoadingHistory(false);
      }
    }
  }

  /*
   * Navigate to a Small Web address.
   *
   * Address bar, page links, search results and History
   * entries all use this function.
   */
  async function navigateTo(
    targetAddress: string,
    source: VisitSource = "address",
  ) {
    const normalizedAddress = targetAddress.trim().toLowerCase();

    if (!selectedPersonId || !normalizedAddress) {
      return;
    }

    setLoadingPage(true);
    setError("");
    setSearchError("");

    try {
      const result = await browseSite(
        selectedPersonId,
        normalizedAddress,
        source,
      );

      setAddress(result.address);
      setPage(result);
      setShowSearchResults(false);

      /*
       * Remove any previous Forward trail when navigating
       * somewhere new after using Back.
       */
      const keptEntries = navigation.slice(0, navigationIndex + 1);

      const nextNavigation: NavigationEntry[] = [
        ...keptEntries,
        {
          type: "page",
          address: result.address,
          page: result,
        },
      ];

      const nextIndex = nextNavigation.length - 1;

      setNavigation(nextNavigation);
      setNavigationIndex(nextIndex);

      setPersonSessions((current) => ({
        ...current,

        [selectedPersonId]: {
          address: result.address,
          page: result,
          navigation: nextNavigation,
          navigationIndex: nextIndex,
        },
      }));

      /*
       * POST /sites/browse created the Visit.
       */
      await refreshHistory(selectedPersonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to browse site");
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleBrowse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await navigateTo(address, "address");
  }

  /*
   * Search site titles and stored HTML content.
   *
   * Search results themselves become a browser navigation
   * entry so Back can restore them exactly.
   */
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query || !selectedPersonId) {
      return;
    }

    setLoadingSearch(true);
    setSearchError("");
    setError("");

    try {
      const results = await searchSites(query);

      setSearchQuery(query);
      setSearchResults(results);
      setShowSearchResults(true);

      const keptEntries = navigation.slice(0, navigationIndex + 1);

      const nextNavigation: NavigationEntry[] = [
        ...keptEntries,
        {
          type: "search",
          query,
          results,
        },
      ];

      const nextIndex = nextNavigation.length - 1;

      setNavigation(nextNavigation);
      setNavigationIndex(nextIndex);

      setPersonSessions((current) => ({
        ...current,

        [selectedPersonId]: {
          address,
          page,
          navigation: nextNavigation,
          navigationIndex: nextIndex,
        },
      }));
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Unable to search the Small Web",
      );
    } finally {
      setLoadingSearch(false);
    }
  }

  /*
   * Publish a new Small Web site.
   */
  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAddress = publishAddress.trim().toLowerCase();

    const html = publishHtml.trim();

    if (!normalizedAddress || !html || !publisherId) {
      return;
    }

    setPublishing(true);
    setPublishError("");
    setPublishSuccess("");

    try {
      const createdSite = await publishSite({
        address: normalizedAddress,
        html,
        publisherId,
      });

      setPublishSuccess(`${createdSite.address} was published successfully.`);

      setPublishAddress("");

      /*
       * Close the publisher and immediately browse the new
       * site as the currently selected browsing person.
       */
      setShowPublish(false);

      await navigateTo(createdSite.address, "address");
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Unable to publish site",
      );
    } finally {
      setPublishing(false);
    }
  }

  /*
   * Restore either a page or a search-results screen from
   * the current Back/Forward navigation trail.
   *
   * Restoring does not create another database Visit.
   */
  function restoreNavigationEntry(entry: NavigationEntry, nextIndex: number) {
    setNavigationIndex(nextIndex);

    setError("");
    setSearchError("");

    let sessionAddress = address;
    let sessionPage = page;

    if (entry.type === "search") {
      setSearchQuery(entry.query);
      setSearchResults(entry.results);
      setShowSearchResults(true);
    } else {
      setAddress(entry.address);
      setPage(entry.page);
      setShowSearchResults(false);

      sessionAddress = entry.address;
      sessionPage = entry.page;
    }

    setPersonSessions((current) => ({
      ...current,

      [selectedPersonId]: {
        address: sessionAddress,
        page: sessionPage,
        navigation,
        navigationIndex: nextIndex,
      },
    }));
  }

  function handleBack() {
    if (!canGoBack) {
      return;
    }

    const nextIndex = navigationIndex - 1;

    const entry = navigation[nextIndex];

    if (!entry) {
      return;
    }

    restoreNavigationEntry(entry, nextIndex);
  }

  function handleForward() {
    if (!canGoForward) {
      return;
    }

    const nextIndex = navigationIndex + 1;

    const entry = navigation[nextIndex];

    if (!entry) {
      return;
    }

    restoreNavigationEntry(entry, nextIndex);
  }

  /*
   * Switch browsing identity.
   *
   * Each person keeps an independent in-memory
   * Back/Forward navigation session.
   */
  function handlePersonChange(personId: string) {
    setSelectedPersonId(personId);

    setError("");
    setSearchError("");
    setHistoryError("");

    setHistory([]);
    setLoadingHistory(true);

    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);

    const savedSession = personSessions[personId];

    if (savedSession) {
      setAddress(savedSession.address);
      setPage(savedSession.page);

      setNavigation(savedSession.navigation);

      setNavigationIndex(savedSession.navigationIndex);

      /*
       * Restore the search screen if this person's current
       * navigation entry was a search.
       */
      const currentEntry =
        savedSession.navigation[savedSession.navigationIndex];

      if (currentEntry?.type === "search") {
        setSearchQuery(currentEntry.query);

        setSearchResults(currentEntry.results);

        setShowSearchResults(true);
      }

      return;
    }

    setAddress("garden.local");
    setPage(null);
    setNavigation([]);
    setNavigationIndex(-1);
  }

  function togglePublisher() {
    setShowPublish((current) => !current);

    setPublishError("");
    setPublishSuccess("");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {/* Application header */}
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">The Small Web</h1>

            <p className="mt-1 text-sm text-slate-600">
              A tiny web you can browse, search, and publish.
            </p>
          </div>

          <button
            type="button"
            onClick={togglePublisher}
            className="self-start rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-700 sm:self-auto"
          >
            {showPublish ? "Close Publisher" : "Publish Site"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        {/* Publish panel */}
        {showPublish && (
          <section className="mb-6 rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Publish a Small Web Site</h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a publisher, claim an address, and provide the page HTML.
              </p>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Publisher
                  </span>

                  <select
                    value={publisherId}
                    disabled={loadingPeople || publishing}
                    onChange={(event) => setPublisherId(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 disabled:opacity-50"
                  >
                    {loadingPeople && (
                      <option value="">Loading publishers...</option>
                    )}

                    {!loadingPeople &&
                      people.map((person) => (
                        <option key={person._id} value={person._id}>
                          {person.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                  </span>

                  <input
                    value={publishAddress}
                    disabled={publishing}
                    onChange={(event) => setPublishAddress(event.target.value)}
                    placeholder="my-site.local"
                    autoComplete="off"
                    spellCheck={false}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 disabled:opacity-50"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  HTML
                </span>

                <textarea
                  value={publishHtml}
                  disabled={publishing}
                  onChange={(event) => setPublishHtml(event.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none focus:border-slate-500 disabled:opacity-50"
                />
              </label>

              {publishError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {publishError}
                </div>
              )}

              {publishSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {publishSuccess}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={togglePublisher}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    publishing ||
                    !publisherId ||
                    !publishAddress.trim() ||
                    !publishHtml.trim()
                  }
                  className="rounded-lg bg-slate-900 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Browser toolbar */}
        <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              {/* Browsing identity */}
              <label className="flex min-w-52 flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Browsing as
                </span>

                <select
                  value={selectedPersonId}
                  disabled={loadingPeople}
                  onChange={(event) => handlePersonChange(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
                >
                  {loadingPeople && <option value="">Loading people...</option>}

                  {!loadingPeople &&
                    people.map((person) => (
                      <option key={person._id} value={person._id}>
                        {person.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Address navigation */}
              <form
                onSubmit={handleBrowse}
                className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={!canGoBack}
                    title="Back"
                    aria-label="Back"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={handleForward}
                    disabled={!canGoForward}
                    title="Forward"
                    aria-label="Forward"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    →
                  </button>
                </div>

                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                  </span>

                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="garden.local"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loadingPage || !selectedPersonId || !address.trim()}
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPage ? "Loading..." : "Go"}
                </button>
              </form>
            </div>

            {/* Current Back/Forward status */}
            {navigation.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  Position {navigationIndex + 1} of {navigation.length} in this
                  navigation trail
                </span>

                {canGoBack && (
                  <span className="rounded bg-slate-100 px-2 py-1">
                    Back available
                  </span>
                )}

                {canGoForward && (
                  <span className="rounded bg-slate-100 px-2 py-1">
                    Forward available
                  </span>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Search */}
        <section className="mt-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="mb-2">
            <h2 className="font-bold text-slate-900">Search the Small Web</h2>

            <p className="mt-1 text-xs text-slate-500">
              Search across site titles and page content.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label className="flex-1">
              <span className="sr-only">Search the Small Web</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search page content..."
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              />
            </label>

            <button
              type="submit"
              disabled={
                loadingSearch || !selectedPersonId || !searchQuery.trim()
              }
              className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingSearch ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {searchError}
            </div>
          )}
        </section>

        {/* Browser + persistent History */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Browser viewport */}
          <section className="min-h-125 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            {/* Search results screen */}
            {showSearchResults && (
              <div className="min-h-125">
                <div className="border-b border-slate-200 bg-white px-5 py-4">
                  <h2 className="text-lg font-bold">Search results</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {searchResults.length} result
                    {searchResults.length === 1 ? "" : "s"} for{" "}
                    <strong>&quot;{searchQuery}&quot;</strong>
                  </p>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="font-semibold text-slate-700">
                      No results found
                    </div>

                    <p className="mt-2 text-sm">
                      Try another word from the page content.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {searchResults.map((site) => (
                      <button
                        key={site._id}
                        type="button"
                        disabled={loadingPage}
                        onClick={() => void navigateTo(site.address, "link")}
                        className="block w-full px-5 py-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">
                              {site.title}
                            </div>

                            <div className="mt-1 text-sm text-slate-600">
                              {site.address}
                            </div>

                            <div className="mt-2 text-xs text-slate-400">
                              Published by {site.publisher.name}
                            </div>
                          </div>

                          <span className="shrink-0 text-slate-400">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Initial empty browser */}
            {!showSearchResults && !page && (
              <div className="flex min-h-125 items-center justify-center p-8 text-center text-slate-500">
                <div>
                  <div className="text-lg font-semibold text-slate-700">
                    Ready to browse
                  </div>

                  <p className="mt-2">
                    Enter a Small Web address and press Go.
                  </p>

                  <p className="mt-1 text-sm">
                    Try <strong className="text-slate-700">garden.local</strong>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* 404 screen */}
            {!showSearchResults && page && !page.exists && (
              <div className="flex min-h-125 flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl font-bold text-slate-300">404</div>

                <h2 className="mt-4 text-xl font-bold">Address not found</h2>

                <p className="mt-2 text-slate-600">
                  No site is published at <strong>{page.address}</strong>.
                </p>

                <p className="mt-2 max-w-lg text-sm text-slate-500">
                  Broken addresses are still recorded in browsing history.
                </p>

                {canGoBack && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-100"
                  >
                    ← Go back
                  </button>
                )}
              </div>
            )}

            {/* Published site */}
            {!showSearchResults && page?.exists && page.site && (
              <>
                <div className="border-b border-slate-200 bg-white px-5 py-3">
                  <div className="font-semibold">{page.site.title}</div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    {page.site.address} · Published by{" "}
                    {page.site.publisher.name}
                  </div>
                </div>

                {/*
                    Publisher HTML is untrusted.

                    sandbox="" deliberately does not
                    grant scripts or same-origin access.
                  */}
                <iframe
                  key={page.site._id}
                  title={page.site.title}
                  srcDoc={page.site.html}
                  sandbox=""
                  className="h-125 w-full border-0 bg-white"
                />

                {/* Controlled Small Web links */}
                {pageLinks.length > 0 && (
                  <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Links on this page
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {pageLinks.map((link) => (
                        <button
                          key={link.href}
                          type="button"
                          disabled={loadingPage}
                          onClick={() => void navigateTo(link.href, "link")}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {link.label}
                          <span className="ml-1 text-slate-400">→</span>{" "}
                          {link.href}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Persistent History */}
          <aside className="self-start overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">History</h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Browsing history for the selected person
                  </p>
                </div>

                {!loadingHistory && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {history.length}
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-150 overflow-y-auto">
              {loadingHistory && (
                <div className="p-5 text-center text-sm text-slate-500">
                  Loading history...
                </div>
              )}

              {!loadingHistory && historyError && (
                <div className="p-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {historyError}
                  </div>
                </div>
              )}

              {!loadingHistory && !historyError && history.length === 0 && (
                <div className="p-5 text-center text-sm text-slate-500">
                  No browsing history yet.
                </div>
              )}

              {!loadingHistory && !historyError && history.length > 0 && (
                <div className="divide-y divide-slate-200">
                  {history.map((visit) => (
                    <button
                      key={visit._id}
                      type="button"
                      disabled={loadingPage}
                      onClick={() => void navigateTo(visit.address, "history")}
                      className="block w-full px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {visit.address}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {new Date(visit.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <span
                          className={
                            visit.exists
                              ? "shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700"
                              : "shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-700"
                          }
                        >
                          {visit.exists ? "Found" : "404"}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {visit.source}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
