import { addDays, subDays } from "date-fns";

// Types
export type Exercise = {
  id: string;
  name: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions: string[];
  equipment: string[];
  muscleGroups: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  hasWeight: boolean;
  hasReps: boolean;
  hasTime: boolean;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  email: string;
  program?: {
    name: string;
    currentWeek: number;
    totalWeeks: number;
  };
  workoutsCompleted: number;
  workoutsAssigned: number;
  compliancePercent: number;
  lastActivity: Date;
  status: "on-track" | "needs-attention" | "inactive";
  teamId?: string;
};

export type Team = {
  id: string;
  name: string;
  patientIds: string[];
  createdAt: string;
};

export type WorkoutBlock = {
  id: string;
  name: string;
  type: "Movement Prep" | "Strength - Primary" | "Strength - Secondary" | "Conditioning" | "Cooldown";
  exercises: {
    exerciseId: string;
    sets: number;
    reps?: string;
    time?: string;
    rest?: string;
    notes?: string;
  }[];
};

export type Workout = {
  id: string;
  name: string;
  status: "completed" | "pending" | "skipped";
  scheduledDate: Date;
  completedDate?: Date;
  blocks: WorkoutBlock[];
};

export type WeeklyProgram = {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  workouts: Workout[];
};

// Mock Data

export const EXERCISES: Exercise[] = [
  {
    id: "ex-1",
    name: "Single Leg Squat",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Stand on one leg with your other leg extended forward.",
      "Lower your hips back and down as if sitting in a chair.",
      "Keep your chest up and your back straight.",
      "Push through your heel to return to the starting position."
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Quads", "Glutes"],
    difficulty: "Advanced",
    category: "Strength",
    hasWeight: true,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-2",
    name: "Glute Bridge - 2 Leg Up 1 Leg Down",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Lie on your back with knees bent and feet flat on the floor.",
      "Lift your hips until your body forms a straight line from shoulders to knees.",
      "Lift one leg off the ground.",
      "Lower your hips slowly with the supporting leg.",
      "Return to start and repeat."
    ],
    equipment: ["Mat"],
    muscleGroups: ["Glutes", "Hamstrings"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-3",
    name: "Push Up - Narrow Hand Position",
    thumbnailUrl: "https://images.unsplash.com/photo-1598971639058-211a742e7279?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Start in a plank position with hands closer than shoulder-width.",
      "Lower your body until your chest nearly touches the floor.",
      "Keep your elbows tucked close to your body.",
      "Push back up to the starting position."
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Chest", "Triceps"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-4",
    name: "Foam Roll - Latissimus Dorsi",
    thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Lie on your side with a foam roller under your armpit.",
      "Roll slowly down towards your waist and back up.",
      "Pause on any tight spots."
    ],
    equipment: ["Foam Roller"],
    muscleGroups: ["Lats", "Back"],
    difficulty: "Beginner",
    category: "Recovery",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-5",
    name: "Goblet Squat",
    thumbnailUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Hold a kettlebell or dumbbell close to your chest.",
      "Squat down, keeping your chest up and back straight.",
      "Go as deep as you can while maintaining good form.",
      "Stand back up."
    ],
    equipment: ["Kettlebell", "Dumbbell"],
    muscleGroups: ["Quads", "Glutes", "Core"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: true,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-6",
    name: "Plank",
    thumbnailUrl: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Start in a push-up position but on your forearms.",
      "Keep your body in a straight line from head to heels.",
      "Hold the position."
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Core"],
    difficulty: "Beginner",
    category: "Core",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-7",
    name: "Dumbbell Lunges",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Stand with dumbbells in each hand.",
      "Step forward with one leg and lower your hips.",
      "Both knees should be bent at a 90-degree angle.",
      "Push back to the starting position."
    ],
    equipment: ["Dumbbell"],
    muscleGroups: ["Quads", "Glutes", "Hamstrings"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: true,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-8",
    name: "Dead Bug",
    thumbnailUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Lie on your back with arms extended towards the ceiling and legs in tabletop position.",
      "Lower your right arm behind your head and extend your left leg straight out.",
      "Return to start and repeat on the other side."
    ],
    equipment: ["Mat"],
    muscleGroups: ["Core"],
    difficulty: "Beginner",
    category: "Core",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-9",
    name: "Face Pulls",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Attach a rope to a cable machine at face height.",
      "Pull the rope towards your face, separating your hands.",
      "Squeeze your shoulder blades together.",
      "Return to start."
    ],
    equipment: ["Cable Machine", "Rope"],
    muscleGroups: ["Shoulders", "Upper Back"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: true,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-10",
    name: "Box Jumps",
    thumbnailUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800&auto=format&fit=crop&q=60",
    instructions: [
      "Stand in front of a sturdy box.",
      "Jump onto the box, landing softly with both feet.",
      "Step down and repeat."
    ],
    equipment: ["Box"],
    muscleGroups: ["Quads", "Glutes", "Calves"],
    difficulty: "Advanced",
    category: "Plyometrics",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  }
];

export const PATIENTS: Patient[] = [
  {
    id: "p-1",
    firstName: "Sarah",
    lastName: "Connor",
    avatarUrl: "https://i.pravatar.cc/150?u=p-1",
    email: "sarah.connor@example.com",
    program: {
      name: "ACL Recovery - Phase 2",
      currentWeek: 3,
      totalWeeks: 12
    },
    workoutsCompleted: 14,
    workoutsAssigned: 15,
    compliancePercent: 93,
    lastActivity: subDays(new Date(), 1),
    status: "on-track"
  },
  {
    id: "p-2",
    firstName: "John",
    lastName: "Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=p-2",
    email: "john.doe@example.com",
    program: {
      name: "Lower Back Rehab",
      currentWeek: 1,
      totalWeeks: 8
    },
    workoutsCompleted: 2,
    workoutsAssigned: 4,
    compliancePercent: 50,
    lastActivity: subDays(new Date(), 4),
    status: "needs-attention"
  },
  {
    id: "p-3",
    firstName: "Jane",
    lastName: "Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=p-3",
    email: "jane.smith@example.com",
    program: {
      name: "Shoulder Mobility",
      currentWeek: 5,
      totalWeeks: 6
    },
    workoutsCompleted: 28,
    workoutsAssigned: 30,
    compliancePercent: 93,
    lastActivity: new Date(),
    status: "on-track"
  },
  {
    id: "p-4",
    firstName: "Michael",
    lastName: "Jordan",
    avatarUrl: "https://i.pravatar.cc/150?u=p-4",
    email: "mj@example.com",
    program: {
      name: "Performance Enhancement",
      currentWeek: 8,
      totalWeeks: 12
    },
    workoutsCompleted: 45,
    workoutsAssigned: 48,
    compliancePercent: 94,
    lastActivity: subDays(new Date(), 2),
    status: "on-track"
  },
  {
    id: "p-5",
    firstName: "Tom",
    lastName: "Hanks",
    avatarUrl: "https://i.pravatar.cc/150?u=p-5",
    email: "tom.hanks@example.com",
    program: {
      name: "General Fitness",
      currentWeek: 2,
      totalWeeks: 12
    },
    workoutsCompleted: 0,
    workoutsAssigned: 6,
    compliancePercent: 0,
    lastActivity: subDays(new Date(), 14),
    status: "inactive"
  },
  {
    id: "p-6",
    firstName: "Emily",
    lastName: "Waters",
    avatarUrl: "https://i.pravatar.cc/150?u=p-6",
    email: "emily.waters@example.com",
    program: {
      name: "Post-Op Knee Rehab",
      currentWeek: 4,
      totalWeeks: 10
    },
    workoutsCompleted: 10,
    workoutsAssigned: 16,
    compliancePercent: 63,
    lastActivity: subDays(new Date(), 2),
    status: "needs-attention"
  },
  {
    id: "p-7",
    firstName: "Robert",
    lastName: "King",
    avatarUrl: "https://i.pravatar.cc/150?u=p-7",
    email: "robert.king@example.com",
    program: {
      name: "Rotator Cuff PT",
      currentWeek: 7,
      totalWeeks: 12
    },
    workoutsCompleted: 32,
    workoutsAssigned: 35,
    compliancePercent: 91,
    lastActivity: subDays(new Date(), 1),
    status: "on-track"
  },
  {
    id: "p-8",
    firstName: "Laura",
    lastName: "Chen",
    avatarUrl: "https://i.pravatar.cc/150?u=p-8",
    email: "laura.chen@example.com",
    program: {
      name: "Ankle Stability Program",
      currentWeek: 2,
      totalWeeks: 6
    },
    workoutsCompleted: 4,
    workoutsAssigned: 6,
    compliancePercent: 67,
    lastActivity: new Date(),
    status: "needs-attention"
  },
  {
    id: "p-9",
    firstName: "Victor",
    lastName: "Ramirez",
    avatarUrl: "https://i.pravatar.cc/150?u=p-9",
    email: "victor.ramirez@example.com",
    program: {
      name: "Hip Mobility Training",
      currentWeek: 3,
      totalWeeks: 8
    },
    workoutsCompleted: 11,
    workoutsAssigned: 12,
    compliancePercent: 92,
    lastActivity: subDays(new Date(), 3),
    status: "on-track"
  },
  {
    id: "p-10",
    firstName: "Sophia",
    lastName: "Bennett",
    avatarUrl: "https://i.pravatar.cc/150?u=p-10",
    email: "sophia.bennett@example.com",
    program: {
      name: "Core Strengthening",
      currentWeek: 1,
      totalWeeks: 10
    },
    workoutsCompleted: 1,
    workoutsAssigned: 5,
    compliancePercent: 20,
    lastActivity: subDays(new Date(), 5),
    status: "needs-attention"
  },
  {
    id: "p-11",
    firstName: "Ethan",
    lastName: "Price",
    avatarUrl: "https://i.pravatar.cc/150?u=p-11",
    email: "ethan.price@example.com",
    program: {
      name: "General Fitness",
      currentWeek: 6,
      totalWeeks: 12
    },
    workoutsCompleted: 20,
    workoutsAssigned: 24,
    compliancePercent: 83,
    lastActivity: new Date(),
    status: "on-track"
  },
  {
    id: "p-12",
    firstName: "Hannah",
    lastName: "Lopez",
    avatarUrl: "https://i.pravatar.cc/150?u=p-12",
    email: "hannah.lopez@example.com",
    program: {
      name: "Posture Correction Program",
      currentWeek: 3,
      totalWeeks: 8
    },
    workoutsCompleted: 6,
    workoutsAssigned: 12,
    compliancePercent: 50,
    lastActivity: subDays(new Date(), 6),
    status: "needs-attention"
  },
  {
    id: "p-13",
    firstName: "Marcus",
    lastName: "Turner",
    avatarUrl: "https://i.pravatar.cc/150?u=p-13",
    email: "marcus.turner@example.com",
    program: {
      name: "Achilles Tendon Rehab",
      currentWeek: 5,
      totalWeeks: 10
    },
    workoutsCompleted: 18,
    workoutsAssigned: 20,
    compliancePercent: 90,
    lastActivity: subDays(new Date(), 2),
    status: "on-track"
  },
  {
    id: "p-14",
    firstName: "Natalie",
    lastName: "Green",
    avatarUrl: "https://i.pravatar.cc/150?u=p-14",
    email: "natalie.green@example.com",
    program: {
      name: "Weight Loss & Conditioning",
      currentWeek: 2,
      totalWeeks: 16
    },
    workoutsCompleted: 0,
    workoutsAssigned: 8,
    compliancePercent: 0,
    lastActivity: subDays(new Date(), 10),
    status: "inactive"
  },
  {
    id: "p-15",
    firstName: "Daniel",
    lastName: "Brooks",
    avatarUrl: "https://i.pravatar.cc/150?u=p-15",
    email: "daniel.brooks@example.com",
    program: {
      name: "Tennis Elbow Rehab",
      currentWeek: 4,
      totalWeeks: 6
    },
    workoutsCompleted: 14,
    workoutsAssigned: 18,
    compliancePercent: 78,
    lastActivity: new Date(),
    status: "on-track"
  }
];

export const MOCK_WORKOUT_WEEKS: WeeklyProgram[] = [
  {
    weekNumber: 1,
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    workouts: [
      {
        id: "w-1",
        name: "Lower Body Power",
        status: "completed",
        scheduledDate: subDays(new Date(), 5),
        completedDate: subDays(new Date(), 5),
        blocks: [
          {
            id: "b-1",
            name: "Movement Prep",
            type: "Movement Prep",
            exercises: [
              { exerciseId: "ex-4", sets: 1, time: "2 min", notes: "Focus on tight spots" },
              { exerciseId: "ex-2", sets: 2, reps: "10", rest: "30s" }
            ]
          },
          {
            id: "b-2",
            name: "Power Block",
            type: "Strength - Primary",
            exercises: [
              { exerciseId: "ex-10", sets: 3, reps: "5", rest: "90s", notes: "Land softly" }
            ]
          },
          {
            id: "b-3",
            name: "Strength Block",
            type: "Strength - Secondary",
            exercises: [
              { exerciseId: "ex-1", sets: 3, reps: "8/side", rest: "60s" },
              { exerciseId: "ex-5", sets: 3, reps: "12", rest: "60s" }
            ]
          }
        ]
      },
      {
        id: "w-2",
        name: "Upper Body Strength",
        status: "completed",
        scheduledDate: subDays(new Date(), 3),
        completedDate: subDays(new Date(), 3),
        blocks: [
          {
            id: "b-4",
            name: "Warm Up",
            type: "Movement Prep",
            exercises: [
              { exerciseId: "ex-9", sets: 2, reps: "15", rest: "30s" }
            ]
          },
          {
            id: "b-5",
            name: "Push/Pull",
            type: "Strength - Primary",
            exercises: [
              { exerciseId: "ex-3", sets: 4, reps: "10", rest: "60s" },
              { exerciseId: "ex-9", sets: 4, reps: "12", rest: "60s" }
            ]
          }
        ]
      },
      {
        id: "w-3",
        name: "Active Recovery",
        status: "pending",
        scheduledDate: new Date(),
        blocks: [
          {
            id: "b-6",
            name: "Flow",
            type: "Conditioning",
            exercises: [
              { exerciseId: "ex-4", sets: 1, time: "5 min" },
              { exerciseId: "ex-6", sets: 3, time: "45s", rest: "30s" }
            ]
          }
        ]
      }
    ]
  },
  {
    weekNumber: 2,
    startDate: addDays(new Date(), 1),
    endDate: addDays(new Date(), 7),
    workouts: [
      {
        id: "w-4",
        name: "Lower Body Hypertrophy",
        status: "pending",
        scheduledDate: addDays(new Date(), 2),
        blocks: [
          {
            id: "b-7",
            name: "Main Lift",
            type: "Strength - Primary",
            exercises: [
              { exerciseId: "ex-5", sets: 4, reps: "10", rest: "90s" }
            ]
          }
        ]
      }
    ]
  }
];
