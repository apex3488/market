/** Server-side ownership checks used by both mock and Neon layers. */

export function assertOwnResource(ownerId: string, resourceOwnerId: string | null | undefined) {
  if (!resourceOwnerId || resourceOwnerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }
}

export function assertAdmin(role: string | null | undefined) {
  if (role !== "admin") throw new Error("FORBIDDEN");
}
