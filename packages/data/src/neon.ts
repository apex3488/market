/**
 * Neon-backed repositories land here after DATABASE_URL is configured.
 * Until then the app uses mocks (`DATA_SOURCE=mock`, default).
 */
export function neonUnavailable(feature: string): never {
  throw new Error(
    `Neon is not connected (${feature}). Set DATABASE_URL and DATA_SOURCE=neon after creating a Neon project.`,
  );
}
