import { getCampaigns, getIdentities } from "../actions";
import CampaignsClient from "./CampaignsClient";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const data = await getCampaigns();
    const identities = await getIdentities();
    return <CampaignsClient initialCampaigns={data as any} initialIdentities={identities} />;
}
