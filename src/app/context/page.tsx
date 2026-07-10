import { getContextCategories } from "../actions";
import ContextClient from "./ContextClient";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const data = await getContextCategories();
    return <ContextClient initialCategories={data} />;
}
