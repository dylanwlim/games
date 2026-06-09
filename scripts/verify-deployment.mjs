const target =
  process.argv[2] ??
  process.env.GAMES_URL ??
  process.env.DYLAN_GAMES_URL ??
  "https://games.dylanwlim.com";

const normalizeUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "games-deployment-verifier/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
};

const assertIncludes = (text, expected, label) => {
  if (!text.includes(expected)) {
    throw new Error(`${label} did not include "${expected}"`);
  }
};

const main = async () => {
  const url = normalizeUrl(target);
  const rootUrl = url.toString().replace(/\/$/, "");
  const [html, robots] = await Promise.all([
    fetchText(rootUrl),
    fetchText(`${rootUrl}/robots.txt`),
  ]);

  assertIncludes(html, "Dylan Games", "Root page");
  assertIncludes(html, "Snake", "Root page");
  assertIncludes(html, "noindex", "Root page metadata");
  assertIncludes(robots, "Disallow: /", "Robots policy");

  const snakeHtml = await fetchText(`${rootUrl}/games/snake`);
  assertIncludes(snakeHtml, "Dylan Games", "Snake route");
  assertIncludes(snakeHtml, "Snake", "Snake route");

  console.log(`Deployment verified: ${rootUrl}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
