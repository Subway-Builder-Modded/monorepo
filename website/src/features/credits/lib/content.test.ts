import { describe, expect, it, vi } from "vitest";
import { buildCreditsDirectory, loadCreditsDirectory } from "./content";

describe("buildCreditsDirectory", () => {
  it("builds maintainer and contributor sections from credit_roles", () => {
    const directory = buildCreditsDirectory({
      schema_version: 1,
      authors: [
        {
          github_id: 1,
          author_id: "kaicardenas0618",
          author_alias: "Kai",
          attribution_link: "https://github.com/kaicardenas0618",
          contributor_tier: "developer",
          credit_roles: ["maintainer"],
        },
        {
          github_id: 2,
          author_id: "ahkimn",
          author_alias: "Yukina-",
          attribution_link: "https://github.com/ahkimn",
          contributor_tier: "developer",
          credit_roles: ["maintainer"],
        },
        {
          github_id: 3,
          author_id: "stefanorigano",
          author_alias: "Steno",
          attribution_link: "https://ko-fi.com/stenori",
          ko_fi_username: "stenori",
          contributor_tier: "executive",
          credit_roles: ["supporter"],
        },
        {
          author_id: "ByteOfBacon",
          author_alias: "ByteOfBacon",
          ko_fi_username: "F1F6123UV",
          contributor_tier: "conductor",
          credit_roles: ["supporter"],
        },
        {
          github_id: 4,
          author_id: "plain-author",
          author_alias: "No Roles",
          contributor_tier: "developer",
        },
      ],
    });

    expect(directory.sections.map((section) => section.id)).toEqual([
      "maintainers",
      "contributors",
    ]);

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
  });

  it("omits entries without roles, without supported tiers, or without display identity", () => {
    const directory = buildCreditsDirectory({
      schema_version: 1,
      authors: [
        { author_id: "no-roles", author_alias: "No Roles", contributor_tier: "developer" },
        {
          author_id: "bad-tier",
          author_alias: "Bad Tier",
          contributor_tier: "supporter",
          credit_roles: ["supporter"],
        },
        { author_id: "missing-tier", author_alias: "Missing Tier", credit_roles: ["maintainer"] },
        { contributor_tier: "developer", credit_roles: ["maintainer"] },
      ],
    });

    expect(directory.sections).toHaveLength(0);
  });

  it("gives the maintainer role precedence when an entry carries both roles", () => {
    const directory = buildCreditsDirectory({
      schema_version: 1,
      authors: [
        {
          github_id: 5,
          author_id: "ByteOfBacon",
          author_alias: "ByteOfBacon",
          attribution_link: "https://github.com/ByteOfBacon",
          contributor_tier: "collaborator",
          credit_roles: ["maintainer", "supporter"],
        },
        {
          github_id: 6,
          author_id: "stefanorigano",
          author_alias: "Steno",
          attribution_link: "https://ko-fi.com/stenori",
          contributor_tier: "executive",
          credit_roles: ["supporter"],
        },
      ],
    });

    expect(directory.sections.map((section) => section.id)).toEqual([
      "maintainers",
      "contributors",
    ]);

    const maintainers = directory.sections[0];
    expect(maintainers?.subsections.map((subsection) => subsection.id)).toEqual(["collaborator"]);
    expect(maintainers?.subsections[0]?.people.map((person) => person.displayName)).toEqual([
      "ByteOfBacon",
    ]);

    const contributors = directory.sections[1];
    expect(contributors?.subsections.map((subsection) => subsection.id)).toEqual(["executive"]);
    expect(contributors?.subsections[0]?.people.map((person) => person.displayName)).toEqual([
      "Steno",
    ]);
  });

  it("omits empty sections and subsections", () => {
    const directory = buildCreditsDirectory({
      schema_version: 1,
      authors: [
        {
          author_id: "m1",
          author_alias: "Dev",
          contributor_tier: "developer",
          credit_roles: ["maintainer"],
        },
      ],
    });

    expect(directory.sections.map((section) => section.id)).toEqual(["maintainers"]);
    expect(directory.sections[0]?.subsections.map((subsection) => subsection.id)).toEqual([
      "developer",
    ]);
  });
});

describe("loadCreditsDirectory", () => {
  it("fetches credited people from the registry authors index", async () => {
    const responses: Record<string, unknown> = {
      "/registry-cache/authors/index.json": { schema_version: 1, authors: [] },
    };

    const fetchImpl = vi.fn(async (path: string) => ({
      ok: true,
      json: async () => responses[path],
    })) as unknown as typeof fetch;

    await loadCreditsDirectory(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/registry-cache/authors/index.json");
  });
});
