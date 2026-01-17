"use server";

import { getSession } from "@/lib/auth";

export async function getUserName() {
    const session = await getSession();
    if (!session || !session.user) {
        return null;
    }

    const { firstName, lastName, preferredName } = session.user;
    const nameToUse = preferredName || firstName;

    return `${nameToUse} ${lastName}`;
}
