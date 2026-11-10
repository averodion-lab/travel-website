import { api, type Camper } from "./api";

/** The trailer being rented (the first active camper), or null if the API is down.
 *  Call from a server component that sits inside <Suspense>. */
export async function getTrailer(): Promise<Camper | null> {
  try {
    return (await api<{ campers: Camper[] }>("/api/campers")).campers[0] ?? null;
  } catch {
    return null;
  }
}
