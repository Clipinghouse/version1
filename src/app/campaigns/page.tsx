import { getCampaigns } from "../actions";
import CampaignsClient from "./CampaignsClient";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const data = await getCampaigns();
    return <CampaignsClient initialCampaigns={data} />;
}
