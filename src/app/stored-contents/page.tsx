import { getStoredContents } from "../actions";
import StoredContentsClient from "./StoredContentsClient";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const data = await getStoredContents();
    return <StoredContentsClient initialNotes={data} />;
}
