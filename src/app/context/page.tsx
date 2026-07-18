import { getContextCategories, getIdentities } from "../actions";
import ContextClient from "./ContextClient";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const data = await getContextCategories();
    const identities = await getIdentities();
    return <ContextClient initialCategories={data} identities={identities} />;
}
