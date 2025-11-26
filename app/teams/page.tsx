'use client';

import { useEffect, useState } from 'react';
import { getTeamsAction } from './actions';
import { PATIENTS } from '@/lib/mock-data';
import { TeamsView } from '@/components/teams/teams-view';
import { Team } from '@/lib/mock-data';

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        // Load teams from localStorage on mount
        const loadedTeams = getTeamsAction();
        setTeams(loadedTeams);
    }, []);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <TeamsView initialTeams={teams} patients={PATIENTS} />
        </div>
    );
}
