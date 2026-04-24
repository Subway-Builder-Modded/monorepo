import { describe, expect, it, vi } from "vitest";
import { buildCreditsDirectory, loadCreditsDirectory } from "./content";

describe("buildCreditsDirectory", () => {
  it("builds sections from maintainers and supporters sources", () => {
    const directory = buildCreditsDirectory(
      {
        maintainers: [
          {
            sbm_id: "kaicardenas0618",
            maintainer_alias: "Kai",
            attribution_link: "https://github.com/kaicardenas0618",
            contributor_tier: "developer",
          },
          {
            sbm_id: "ahkimn",
            maintainer_alias: "Yukina-",
            attribution_link: "https://github.com/ahkimn",
            contributor_tier: "developer",
          },
        ],
      },
      {
        ko_fi: [
          {
            sbm_id: "stefanorigano",
            ko_fi_username: "stenori",
            supporter_alias: "Steno",
            attribution_link: "https://ko-fi.com/stenori",
            contributor_tier: "executive",
          },
          {
            ko_fi_username: "ByteOfBacon",
            supporter_alias: "ByteOfBacon",
            contributor_tier: "conductor",
          },
        ],
      },
    );

    expect(directory.sections.map((section) => section.id)).toEqual(["maintainers", "contributors"]);

    const maintainers = directory.sections[0];
    expect(maintainers?.subsections.map((sub) => sub.id)).toEqual(["developer"]);
    expect(maintainers?.subsections[0]?.people.map((person) => person.displayName)).toEqual([
      "Kai",
      "Yukina-",
    ]);
    expect(maintainers?.subsections[0]?.people[0]?.source).toBe("maintainers");

    const contributors = directory.sections[1];
    expect(contributors?.subsections.map((sub) => sub.id)).toEqual(["executive", "conductor"]);

    const executivePeople = contributors?.subsections[0]?.people ?? [];
    expect(executivePeople[0]?.displayName).toBe("Steno");
    expect(executivePeople[0]?.source).toBe("supporters");
    expect(executivePeople[0]?.link).toBe("https://ko-fi.com/stenori");

    const conductorPeople = contributors?.subsections[1]?.people ?? [];
    expect(conductorPeople[0]?.displayName).toBe("ByteOfBacon");
    expect(conductorPeople[0]?.source).toBe("supporters");
    expect(conductorPeople[0]?.link).toBeUndefined();
  });

  it("omits unsupported tiers and entries without display identity", () => {
    const directory = buildCreditsDirectory(
      {
        maintainers: [
          {
            sbm_id: "ignored-tier",
            maintainer_alias: "Ignored Tier",
            contributor_tier: "supporter",
          },
          {
            sbm_id: "missing-tier",
            maintainer_alias: "Missing Tier",
          },
          {
            contributor_tier: "developer",
          },
        ],
      },
      {
        ko_fi: [
          {
            supporter_alias: "Bad Tier",
            contributor_tier: "supporter",
          },
          {
            contributor_tier: "engineer",
          },
        ],
      },
    );

    expect(directory.sections).toHaveLength(0);
  });

  it("gives maintainers precedence over supporters when sbm_id matches", () => {
    const directory = buildCreditsDirectory(
      {
        maintainers: [
          {
            sbm_id: "ByteOfBacon",
            maintainer_alias: "ByteOfBacon",
            attribution_link: "https://github.com/ByteOfBacon",
            contributor_tier: "collaborator",
          },
        ],
      },
      {
        ko_fi: [
          {
            sbm_id: "byteofbacon",
            ko_fi_username: "ByteOfBacon",
            supporter_alias: "ByteOfBacon",
            attribution_link: "https://ko-fi.com/ByteOfBacon",
            contributor_tier: "conductor",
          },
          {
            sbm_id: "stefanorigano",
            ko_fi_username: "stenori",
            supporter_alias: "Steno",
            attribution_link: "https://ko-fi.com/stenori",
            contributor_tier: "executive",
          },
        ],
      },
    );

    expect(directory.sections.map((section) => section.id)).toEqual(["maintainers", "contributors"]);

    const maintainers = directory.sections[0];
    expect(maintainers?.subsections.map((subsection) => subsection.id)).toEqual(["collaborator"]);
    expect(maintainers?.subsections[0]?.people.map((person) => person.displayName)).toEqual([
      "ByteOfBacon",
    ]);

    const contributors = directory.sections[1];
    expect(contributors?.subsections.map((subsection) => subsection.id)).toEqual(["executive"]);
    expect(contributors?.subsections[0]?.people.map((person) => person.displayName)).toEqual(["Steno"]);
  });

  it("omits empty sections and subsections", () => {
    const directory = buildCreditsDirectory(
      {
        maintainers: [{ sbm_id: "m1", maintainer_alias: "Dev", contributor_tier: "developer" }],
      },
      null,
    );

    expect(directory.sections.map((section) => section.id)).toEqual(["maintainers"]);
    expect(directory.sections[0]?.subsections.map((subsection) => subsection.id)).toEqual(["developer"]);
  });
});

describe("loadCreditsDirectory", () => {
  it("fetches maintainers and supporters from registry credits paths", async () => {
    const responses: Record<string, unknown> = {
      "/registry/credits/maintainers.json": { schema_version: 1, maintainers: [] },
      "/registry/credits/supporters.json": { schema_version: 1, ko_fi: [] },
    };

    const fetchImpl = vi.fn(async (path: string) => ({
      ok: true,
      json: async () => responses[path],
    })) as unknown as typeof fetch;

    await loadCreditsDirectory(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/registry/credits/maintainers.json");
    expect(fetchImpl).toHaveBeenCalledWith("/registry/credits/supporters.json");
  });
});
