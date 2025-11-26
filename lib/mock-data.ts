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
    name: "MP: Bear Crawl Holds",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044483.mp4",
    instructions: [
      "Hold bear crawl position with knees off the ground",
      "Keep back flat and core tight"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Core", "Shoulders"],
    difficulty: "Intermediate",
    category: "Movement Prep",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-2",
    name: "Box Jumps",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044488.mp4",
    instructions: [
      "Swing arms from front to back, bend knees and hips, and jump onto the box",
      "Land softly with knees bent"
    ],
    equipment: ["Box"],
    muscleGroups: ["Quads", "Glutes", "Calves"],
    difficulty: "Advanced",
    category: "Plyometrics",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-3",
    name: "Lateral Lunges Bodyweight",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044391.mp4",
    instructions: [
      "Step wide to the side, keeping the stepping knee over toes",
      "Push hips back and keep chest up"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Quads", "Glutes", "Hip Adductors"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-4",
    name: "Standing Hip Hike on Step",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044215.mp4",
    instructions: [
      "Stand on a step with one foot hanging off",
      "Lift hip on the hanging leg side without bending the knee"
    ],
    equipment: ["Step"],
    muscleGroups: ["Hip Abductors", "Glutes"],
    difficulty: "Beginner",
    category: "Mobility",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-5",
    name: "ITB Stretch Standing",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044384.mp4",
    instructions: [
      "Cross one leg behind the other and lean laterally toward the side of the back leg",
      "Hold the stretch along the side of your hip"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["IT Band", "Hip Flexors"],
    difficulty: "Beginner",
    category: "Recovery",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-6",
    name: "Standing Quadratus Lumborum Stretch with Doorway",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044217.mp4",
    instructions: [
      "Stand near a doorway and reach the corner of the wall of doorway with both hands",
      "Lean gently to the side to stretch the lower back"
    ],
    equipment: ["Doorway"],
    muscleGroups: ["Lower Back", "Quadratus Lumborum"],
    difficulty: "Beginner",
    category: "Recovery",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-7",
    name: "Wall Angels",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044263.mp4",
    instructions: [
      "Stand with back against wall",
      "Raise arms overhead, sliding them along the wall without arching back"
    ],
    equipment: ["Wall"],
    muscleGroups: ["Shoulders", "Upper Back"],
    difficulty: "Beginner",
    category: "Mobility",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-8",
    name: "MP: Child's Pose",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044434.mp4",
    instructions: [
      "On hands and knees, sit back towards your heels while keeping your arms long"
    ],
    equipment: ["Mat"],
    muscleGroups: ["Lower Back", "Hip Flexors"],
    difficulty: "Beginner",
    category: "Movement Prep",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-9",
    name: "Mini Lunge",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044418.mp4",
    instructions: [
      "Step a small distance forward and lower hips slightly",
      "Keep back straight and core engaged"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Quads", "Glutes"],
    difficulty: "Beginner",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-10",
    name: "Prone Press-up on Forearms",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044296.mp4",
    instructions: [
      "Prop up on forearms, lifting chest",
      "Keep hips relaxed and breathe deeply"
    ],
    equipment: ["Mat"],
    muscleGroups: ["Lower Back", "Core"],
    difficulty: "Beginner",
    category: "Mobility",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-11",
    name: "Lower Quarter Reach Combination",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044401.mp4",
    instructions: [
      "Perform controlled reaches with your leg in multiple directions while balancing",
      "Engage core throughout"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Core", "Hip Stabilizers", "Glutes"],
    difficulty: "Intermediate",
    category: "Balance",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-12",
    name: "Standing Bent Over Row BW",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044363.mp4",
    instructions: [
      "Stand tall with elbows at sides",
      "Rotate arms outward while squeezing shoulder blades together"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Upper Back", "Shoulders", "Rhomboids"],
    difficulty: "Intermediate",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-13",
    name: "Wall Child's Pose",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044264.mp4",
    instructions: [
      "Stand facing a wall, bend at hips with arms extended against the wall",
      "Press chest toward the floor"
    ],
    equipment: ["Wall"],
    muscleGroups: ["Lower Back", "Hip Flexors", "Shoulders"],
    difficulty: "Beginner",
    category: "Recovery",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-14",
    name: "Supine Piriformis Stretch Cross-body",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044237.mp4",
    instructions: [
      "Lie on back and one knee bent",
      "Grab the bent knee toward your oppisite shoulder",
      "Keep your back flat on the floor"
    ],
    equipment: ["Mat"],
    muscleGroups: ["Piriformis", "Hip Rotators", "Glutes"],
    difficulty: "Beginner",
    category: "Recovery",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-15",
    name: "MP: Third Trimester",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044244.mp4",
    instructions: [
      "Breathe deeply and relax pelvic floor muscles",
      "Avoid bearing down forcefully"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Core", "Pelvic Floor"],
    difficulty: "Beginner",
    category: "Movement Prep",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-16",
    name: "Supine Bridge",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044235.mp4",
    instructions: [
      "Lie on back with knees bent",
      "Push through heels to lift hips while squeezing glutes"
    ],
    equipment: ["Mat"],
    muscleGroups: ["Glutes", "Hamstrings", "Lower Back"],
    difficulty: "Beginner",
    category: "Strength",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-17",
    name: "Lumbar Flexion AROM Standing",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044407.mp4",
    instructions: [
      "Cross your arms at your chest, bend forward slowly",
      "Keep knees straight and avoid bouncing"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Lower Back", "Hamstrings"],
    difficulty: "Beginner",
    category: "Mobility",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-18",
    name: "MP: Labor Positions",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044390.mp4",
    instructions: [
      "Practice different positions (e.g., hands and knees, squatting) to find comfortable labor postures"
    ],
    equipment: ["Bodyweight"],
    muscleGroups: ["Core", "Hip Flexors", "Glutes"],
    difficulty: "Beginner",
    category: "Movement Prep",
    hasWeight: false,
    hasReps: false,
    hasTime: true
  },
  {
    id: "ex-19",
    name: "MP: Step-ups",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044228.mp4",
    instructions: [
      "Step onto a platform, pushing through the heel of leading foot",
      "Keep torso upright"
    ],
    equipment: ["Step", "Platform"],
    muscleGroups: ["Quads", "Glutes"],
    difficulty: "Intermediate",
    category: "Movement Prep",
    hasWeight: false,
    hasReps: true,
    hasTime: false
  },
  {
    id: "ex-20",
    name: "Thoracic Extension AROM Hands Behind Head Seated",
    thumbnailUrl: "https://rijathaquzmuxtuipenz.supabase.co/storage/v1/object/public/workout_videos/videos/1044245.mp4",
    instructions: [
      "Sit tall with hands behind neck",
      "Gently arch upper back without pulling on the neck"
    ],
    equipment: ["Chair"],
    muscleGroups: ["Upper Back", "Thoracic Spine"],
    difficulty: "Beginner",
    category: "Mobility",
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
