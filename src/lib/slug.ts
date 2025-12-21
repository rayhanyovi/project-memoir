const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const isValidSlug = (slug: string): boolean => SLUG_REGEX.test(slug);

export const makeUniqueSlug = async (
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>
): Promise<string> => {
  const normalized = slugify(baseSlug);
  if (!normalized) {
    throw new Error("Slug cannot be empty");
  }

  if (!(await existsFn(normalized))) {
    return normalized;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalized}-${suffix}`;
    if (!(await existsFn(candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique slug");
};

export const WORKSPACE_SLUG_REGEX = SLUG_REGEX;
