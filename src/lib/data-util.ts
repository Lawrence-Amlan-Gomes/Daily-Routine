// src/lib/data-util.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cleanUserForClient = (user: any) => {
  if (!user) return null;
  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Helper to clean routine items

  // Helper to clean routine items — NOW includes category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanRoutine = (routine: any): IRoutine => {
    if (!routine) {
      return {
        saturday: [],
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapItem = (item: any): IRoutineItem => ({
      name: String(item.name || ""),
      time: String(item.time || ""),
      category: String(item.category || ""), // ← this line was missing
    });

    return {
      saturday: (routine.saturday || []).map(mapItem),
      sunday: (routine.sunday || []).map(mapItem),
      monday: (routine.monday || []).map(mapItem),
      tuesday: (routine.tuesday || []).map(mapItem),
      wednesday: (routine.wednesday || []).map(mapItem),
      thursday: (routine.thursday || []).map(mapItem),
      friday: (routine.friday || []).map(mapItem),
    };
  };

  return {
    id: user._id?.toString() || user.id,
    name: user.name || "User",
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle ?? false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType || "Free One Week", // ← add fallback if needed
    routine: cleanRoutine(user.routine),
    todayPremiumResponses: user.todayPremiumResponses || "",
    stats: Array.isArray(user.stats) ? user.stats : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goals: Array.isArray(user.goals) ? user.goals.map((g: any) => ({
      id: String(g.id ?? ""),
      name: String(g.name ?? ""),
      description: String(g.description ?? ""),
      priority: String(g.priority ?? "medium"),
      status: String(g.status ?? "todo"),
      category: String(g.category ?? ""),
      dueDate: String(g.dueDate ?? ""),
      time: String(g.time ?? ""),
      reminderAt: String(g.reminderAt ?? ""),
      repeat: String(g.repeat ?? "none"),
      tags: Array.isArray(g.tags) ? g.tags.map((t: unknown) => String(t)) : [],
      subtasks: Array.isArray(g.subtasks)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? g.subtasks.map((s: any) => ({
            id: String(s.id ?? ""),
            name: String(s.name ?? ""),
            isDone: Boolean(s.isDone ?? false),
          }))
        : [],
      createdAt: String(g.createdAt ?? ""),
      finishedAt: String(g.finishedAt ?? ""),
      pinned: Boolean(g.pinned ?? false),
      color: String(g.color ?? ""),
    })) : [],
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cleanGoogleUserForClient = (googleUser: any) => {
  if (!googleUser) return null;

  return {
    name: googleUser.name || "Google User",
    email: googleUser.email,
    image: googleUser.picture || googleUser.image || "",
  };
};
