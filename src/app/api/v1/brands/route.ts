import { catalogRepository } from "@market/data";

export async function GET() {
  const brands = await catalogRepository.listBrands();
  return Response.json({ brands });
}
