import { getTeams } from './actions';
import { PATIENTS } from '@/lib/mock-data';
import { TeamsView } from '@/components/teams/teams-view';

export default async function TeamsPage() {
    const teams = await getTeams();
    // In a real app, we'd fetch patients from DB too. 
    // For now, we use the mock data but we need to merge the team assignments from the JSON file if we want persistence there.
    // However, our actions update the teams.json with patientIds, so we can just use PATIENTS and map them in the view.

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <TeamsView initialTeams={teams} patients={PATIENTS} />
        </div>
    );
}
